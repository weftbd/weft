import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import { Product } from '../types';
import { DEFAULT_PRODUCTS } from '../data/defaults';

const LOCAL_STORAGE_KEY = 'weft_products_data';
const INITIALIZED_FLAG_KEY = 'weft_products_initialized_v2';

export function getLocalProducts(): Product[] {
  try {
    const raw =
      localStorage.getItem(LOCAL_STORAGE_KEY) || localStorage.getItem('cell_products_data');
    if (raw) {
      const sanitizedRaw = raw.replace(/\bCELL\b/g, 'WEFT');
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
  } catch (e) {
    console.error('Error saving local products:', e);
  }
}

// Background sync helper
function backgroundCloudSync(syncFn: () => Promise<any>): void {
  if (!db) return;
  setTimeout(async () => {
    try {
      await syncFn();
    } catch (err) {
      console.warn('Background Firestore product sync note:', err);
    }
  }, 10);
}

// Helper to race Firestore promise with timeout
async function withTimeout<T>(promise: Promise<T>, fallback: T, ms = 1200): Promise<T> {
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

// Fetch products directly from Firestore database with instant fallback
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
          // Cloud empty, persist existing local
          return local;
        }
        saveLocalProducts([]);
        return [];
      }
    };

    return await withTimeout(fetchPromise(), local, 1200);
  } catch (err) {
    console.warn('Firestore fetchProducts note, loading cached:', err);
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
    return await withTimeout(fetchCloud(), found || null, 1000);
  } catch (e) {
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

  // Background Firestore persistence
  backgroundCloudSync(async () => {
    if (db) {
      const docRef = doc(db, 'products', productToSave.id);
      await setDoc(docRef, productToSave, { merge: true });
    }
  });

  return productToSave;
}

export async function deleteProduct(productId: string): Promise<void> {
  const current = getLocalProducts();
  const filtered = current.filter((p) => p.id !== productId);
  saveLocalProducts(filtered);

  backgroundCloudSync(async () => {
    if (db) {
      const docRef = doc(db, 'products', productId);
      await deleteDoc(docRef);
    }
  });
}

export async function reorderProducts(products: Product[]): Promise<void> {
  const updated = products.map((p, idx) => ({ ...p, sortOrder: idx + 1 }));
  saveLocalProducts(updated);

  backgroundCloudSync(async () => {
    if (db) {
      for (const p of updated) {
        await setDoc(doc(db, 'products', p.id), { sortOrder: p.sortOrder }, { merge: true });
      }
    }
  });
}
