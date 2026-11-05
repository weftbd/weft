import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Product } from '../types';
import { DEFAULT_PRODUCTS } from '../data/defaults';

const LOCAL_STORAGE_KEY = 'weft_products_data';
const INITIALIZED_FLAG_KEY = 'weft_products_initialized_v2';

export function getLocalProducts(): Product[] {
  try {
    const raw =
      localStorage.getItem(LOCAL_STORAGE_KEY) || localStorage.getItem('cell_products_data');
    if (raw) {
      const sanitizedRaw = raw.replace(/\b(CELL|WEFT)\b/g, 'Taarok');
      const parsed = JSON.parse(sanitizedRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading local products:', e);
  }

  const isInit = localStorage.getItem(INITIALIZED_FLAG_KEY);
  if (!isInit) {
    saveLocalProducts(DEFAULT_PRODUCTS);
    return DEFAULT_PRODUCTS;
  }
  return [];
}

export function saveLocalProducts(products: Product[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(products));
    localStorage.setItem(INITIALIZED_FLAG_KEY, 'true');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('weft_products_updated'));
    }
  } catch (e) {
    console.error('Error saving local products:', e);
  }
}

// Helper to race Firestore promise with timeout
async function withTimeout<T>(promise: Promise<T>, fallback: T, ms = 2500): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  try {
    const res = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    return fallback;
  }
}

// Real-time Firestore subscription so products stay synced across all domains and tabs
export function subscribeToProducts(
  onProductsUpdated: (products: Product[]) => void
): Unsubscribe {
  if (!db) {
    onProductsUpdated(getLocalProducts());
    const handleLocalUpdate = () => onProductsUpdated(getLocalProducts());
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleLocalUpdate);
      window.addEventListener('weft_products_updated', handleLocalUpdate);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleLocalUpdate);
        window.removeEventListener('weft_products_updated', handleLocalUpdate);
      }
    };
  }

  try {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, orderBy('sortOrder', 'asc'));

    return onSnapshot(
      q,
      async (snapshot) => {
        if (!snapshot.empty) {
          const cloudProducts: Product[] = [];
          snapshot.forEach((docSnap) => {
            cloudProducts.push({ ...(docSnap.data() as Product), id: docSnap.id });
          });
          saveLocalProducts(cloudProducts);
          onProductsUpdated(cloudProducts);
        } else {
          const local = getLocalProducts();
          if (local.length > 0 && db) {
            // Migrate any products previously created in localStorage up to Cloud Firestore
            try {
              await Promise.all(
                local.map((p) => setDoc(doc(db!, 'products', p.id), p, { merge: true }))
              );
            } catch (seedErr) {
              console.warn('Auto-sync local products to cloud note:', seedErr);
            }
            onProductsUpdated(local);
          } else {
            saveLocalProducts([]);
            onProductsUpdated([]);
          }
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, 'products');
        onProductsUpdated(getLocalProducts());
      }
    );
  } catch (e) {
    console.warn('Failed to attach products subscription:', e);
    onProductsUpdated(getLocalProducts());
    return () => {};
  }
}

// Fetch products directly from Firestore database with auto-migration of local products
export async function fetchProducts(): Promise<Product[]> {
  const local = getLocalProducts();

  if (!db) {
    return local;
  }

  try {
    const fetchPromise = async () => {
      const productsRef = collection(db!, 'products');
      const q = query(productsRef, orderBy('sortOrder', 'asc'));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const cloudProducts: Product[] = [];
        snapshot.forEach((docSnap) => {
          cloudProducts.push({ ...(docSnap.data() as Product), id: docSnap.id });
        });
        saveLocalProducts(cloudProducts);
        return cloudProducts;
      } else {
        if (local.length > 0) {
          // Cloud is empty but this browser has products in localStorage: upload them to Cloud Firestore!
          try {
            await Promise.all(
              local.map((p) => setDoc(doc(db!, 'products', p.id), p, { merge: true }))
            );
          } catch (seedErr) {
            console.warn('Initial cloud product migration note:', seedErr);
          }
          return local;
        }
        saveLocalProducts([]);
        return [];
      }
    };

    return await withTimeout(fetchPromise(), local, 2500);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'products');
    return local;
  }
}

export async function fetchProductById(id: string): Promise<Product | null> {
  const local = getLocalProducts();
  const found = local.find((p) => p.id === id);

  if (!db) return found || null;

  try {
    const fetchCloud = async () => {
      const docRef = doc(db!, 'products', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { ...(docSnap.data() as Product), id: docSnap.id };
      }
      return found || null;
    };
    return await withTimeout(fetchCloud(), found || null, 2000);
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, `products/${id}`);
    return found || null;
  }
}

export async function saveProduct(product: Product): Promise<Product> {
  const now = new Date().toISOString();
  const productToSave: Product = {
    ...product,
    updatedAt: now,
    createdAt: product.createdAt || now,
  };

  // Update local storage first
  const current = getLocalProducts();
  const index = current.findIndex((p) => p.id === productToSave.id);
  if (index >= 0) {
    current[index] = productToSave;
  } else {
    current.push(productToSave);
  }
  saveLocalProducts(current);

  // Persist to Cloud Firestore immediately so all domains receive the product
  if (db) {
    try {
      const docRef = doc(db, 'products', productToSave.id);
      await withTimeout(setDoc(docRef, productToSave, { merge: true }), undefined, 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `products/${productToSave.id}`);
    }
  }

  return productToSave;
}

export async function deleteProduct(productId: string): Promise<void> {
  const current = getLocalProducts();
  const filtered = current.filter((p) => p.id !== productId);
  saveLocalProducts(filtered);

  if (db) {
    try {
      const docRef = doc(db, 'products', productId);
      await withTimeout(deleteDoc(docRef), undefined, 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${productId}`);
    }
  }
}

export async function reorderProducts(products: Product[]): Promise<void> {
  const updated = products.map((p, idx) => ({ ...p, sortOrder: idx + 1 }));
  saveLocalProducts(updated);

  if (db) {
    try {
      await withTimeout(
        Promise.all(
          updated.map((p) =>
            setDoc(doc(db!, 'products', p.id), { sortOrder: p.sortOrder }, { merge: true })
          )
        ),
        undefined,
        3000
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'products');
    }
  }
}
