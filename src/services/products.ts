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

function getLocalProducts(): Product[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY) || localStorage.getItem('cell_products_data');
    if (raw) {
      const sanitizedRaw = raw.replace(/\bCELL\b/g, 'WEFT');
      const parsed = JSON.parse(sanitizedRaw);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
      return parsed;
    }
  } catch (e) {
    console.error('Error reading local products:', e);
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCTS));
  return DEFAULT_PRODUCTS;
}

function saveLocalProducts(products: Product[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(products));
  } catch (e) {
    console.error('Error saving local products:', e);
  }
}

function asyncCloudSync(syncFn: () => Promise<any>): void {
  if (!db) return;
  setTimeout(async () => {
    try {
      await syncFn();
    } catch (err) {
      console.warn('Product cloud sync note:', err);
    }
  }, 10);
}

export async function fetchProducts(): Promise<Product[]> {
  const local = getLocalProducts();
  return local;
}

export async function fetchProductById(id: string): Promise<Product | null> {
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

  // Update local storage synchronously first
  const current = getLocalProducts();
  const index = current.findIndex((p) => p.id === productToSave.id);
  if (index >= 0) {
    current[index] = productToSave;
  } else {
    current.push(productToSave);
  }
  saveLocalProducts(current);

  // Background sync
  asyncCloudSync(async () => {
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

  asyncCloudSync(async () => {
    if (db) {
      const docRef = doc(db, 'products', productId);
      await deleteDoc(docRef);
    }
  });
}

export async function reorderProducts(products: Product[]): Promise<void> {
  const updated = products.map((p, idx) => ({ ...p, sortOrder: idx + 1 }));
  saveLocalProducts(updated);

  asyncCloudSync(async () => {
    if (db) {
      for (const p of updated) {
        await setDoc(doc(db, 'products', p.id), { sortOrder: p.sortOrder }, { merge: true });
      }
    }
  });
}
