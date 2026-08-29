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

function getLocalProducts(): Product[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY) || localStorage.getItem('cell_products_data');
    if (raw) {
      const sanitizedRaw = raw.replace(/\bCELL\b/g, 'WEFT');
      const parsed = JSON.parse(sanitizedRaw);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (e) {
    console.error('Error reading local products:', e);
  }
  return [];
}

function saveLocalProducts(products: Product[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(products));
    localStorage.setItem(INITIALIZED_FLAG_KEY, 'true');
  } catch (e) {
    console.error('Error saving local products:', e);
  }
}

// Fetch products directly from Firestore database with instant fallback
export async function fetchProducts(): Promise<Product[]> {
  const local = getLocalProducts();

  if (!db) {
    return local;
  }

  try {
    const fetchPromise = (async () => {
      const productsRef = collection(db, 'products');
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
        saveLocalProducts([]);
        return [];
      }
    })();

    const timeoutPromise = new Promise<Product[]>((resolve) =>
      setTimeout(() => resolve(local), 1200)
    );

    const result = await Promise.race([fetchPromise, timeoutPromise]);
    return result;
  } catch (err) {
    console.warn('Firestore fetchProducts note, loading cached:', err);
    return local;
  }
}

export async function fetchProductById(id: string): Promise<Product | null> {
  try {
    if (db) {
      const docRef = doc(db, 'products', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { ...(docSnap.data() as Product), id: docSnap.id };
      }
    }
  } catch (e) {
    console.warn('Firestore fetchProductById note:', e);
  }

  const local = getLocalProducts();
  return local.find((p) => p.id === id) || null;
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

  // Direct Firestore persistence
  if (db) {
    try {
      const docRef = doc(db, 'products', productToSave.id);
      await setDoc(docRef, productToSave, { merge: true });
    } catch (err) {
      console.warn('Firestore saveProduct error:', err);
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
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore deleteProduct error:', err);
    }
  }
}

export async function reorderProducts(products: Product[]): Promise<void> {
  const updated = products.map((p, idx) => ({ ...p, sortOrder: idx + 1 }));
  saveLocalProducts(updated);

  if (db) {
    try {
      for (const p of updated) {
        await setDoc(doc(db, 'products', p.id), { sortOrder: p.sortOrder }, { merge: true });
      }
    } catch (err) {
      console.warn('Firestore reorderProducts error:', err);
    }
  }
}

