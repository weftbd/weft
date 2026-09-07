import { doc, getDoc, setDoc, getDocs, collection } from 'firebase/firestore';
import { db } from './firebase';
import {
  HomepageSettings,
  SizeChart,
  ShippingMethod,
  FAQItem,
  StoreSettings,
  FooterSettings,
} from '../types';
import {
  DEFAULT_HOMEPAGE,
  DEFAULT_SIZE_CHART,
  DEFAULT_SHIPPING_METHODS,
  DEFAULT_FAQS,
  DEFAULT_STORE_SETTINGS,
  DEFAULT_FOOTER,
} from '../data/defaults';

export function getLocalHomepageSettings(): HomepageSettings {
  return getLocalItem<HomepageSettings>(KEY_HOMEPAGE, DEFAULT_HOMEPAGE);
}

export function getLocalSizeChart(): SizeChart {
  return getLocalItem<SizeChart>(KEY_SIZE_CHART, DEFAULT_SIZE_CHART);
}

export function getLocalShippingMethods(): ShippingMethod[] {
  return getLocalItem<ShippingMethod[]>(KEY_SHIPPING, DEFAULT_SHIPPING_METHODS);
}

export function getLocalFAQs(): FAQItem[] {
  const local = getLocalItem<FAQItem[]>(KEY_FAQS, DEFAULT_FAQS);
  return [...local].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

export function getLocalStoreSettings(): StoreSettings {
  const local = getLocalItem<StoreSettings>(KEY_STORE, DEFAULT_STORE_SETTINGS);
  const cleanPrefix = (local?.orderPrefix || 'WEFT')
    .toUpperCase()
    .replace(/CELL/g, 'WEFT')
    .replace(/[^A-Z0-9_-]/g, '')
    .replace(/[-_]+$/, '') || 'WEFT';

  return {
    ...DEFAULT_STORE_SETTINGS,
    ...local,
    orderPrefix: cleanPrefix,
  };
}

export function getLocalFooterSettings(): FooterSettings {
  return getLocalItem<FooterSettings>(KEY_FOOTER, DEFAULT_FOOTER);
}

// Local storage keys
const KEY_HOMEPAGE = 'weft_cms_homepage';
const KEY_SIZE_CHART = 'weft_cms_size_chart';
const KEY_SHIPPING = 'weft_cms_shipping';
const KEY_FAQS = 'weft_cms_faqs';
const KEY_STORE = 'weft_cms_store_settings';
const KEY_FOOTER = 'weft_cms_footer';

export function getLocalItem<T>(key: string, defaultValue: T): T {
  try {
    const legacyKey = key.replace('weft_', 'cell_');
    const raw = localStorage.getItem(key) || localStorage.getItem(legacyKey);
    if (raw) {
      const sanitizedRaw = raw
        .replace(/\bCELL\b/g, 'WEFT')
        .replace(/\+?880\s?1700-000000/g, '+8801909999079')
        .replace(/8801700000000/g, '8801909999079')
        .replace(/support@weftbd\.com/g, 'weftbd247@gmail.com');
      const parsed = JSON.parse(sanitizedRaw);
      localStorage.setItem(key, JSON.stringify(parsed));
      return parsed;
    }
  } catch (e) {
    console.error(`Error reading ${key}:`, e);
  }
  localStorage.setItem(key, JSON.stringify(defaultValue));
  return defaultValue;
}

export function saveLocalItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key}:`, e);
  }
}

// Background non-blocking sync helper
function backgroundCloudSync(syncFn: () => Promise<any>): void {
  if (!db) return;
  setTimeout(async () => {
    try {
      await syncFn();
    } catch (err) {
      console.warn('Background Firestore sync note:', err);
    }
  }, 10);
}

// Helper to race Firestore promise with timeout
async function withTimeout<T>(promise: Promise<T>, fallback: T, ms = 1000): Promise<T> {
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

// HOMEPAGE
export async function fetchHomepageSettings(): Promise<HomepageSettings> {
  const local = getLocalItem<HomepageSettings>(KEY_HOMEPAGE, DEFAULT_HOMEPAGE);
  if (!db) return local;

  try {
    const fetchCloud = async () => {
      const docRef = doc(db!, 'siteSettings', 'homepage');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const cloudData = snap.data() as HomepageSettings;
        saveLocalItem(KEY_HOMEPAGE, cloudData);
        return cloudData;
      }
      return local;
    };
    return await withTimeout(fetchCloud(), local, 1200);
  } catch (e) {
    return local;
  }
}

export async function saveHomepageSettings(settings: HomepageSettings): Promise<void> {
  saveLocalItem(KEY_HOMEPAGE, settings);
  backgroundCloudSync(async () => {
    if (db) {
      await setDoc(doc(db, 'siteSettings', 'homepage'), settings, { merge: true });
    }
  });
}

// SIZE CHART
export async function fetchSizeChart(): Promise<SizeChart> {
  const local = getLocalItem<SizeChart>(KEY_SIZE_CHART, DEFAULT_SIZE_CHART);
  if (!db) return local;

  try {
    const fetchCloud = async () => {
      const snap = await getDoc(doc(db!, 'sizeCharts', 'default'));
      if (snap.exists()) {
        const cloudData = snap.data() as SizeChart;
        saveLocalItem(KEY_SIZE_CHART, cloudData);
        return cloudData;
      }
      return local;
    };
    return await withTimeout(fetchCloud(), local, 1200);
  } catch (e) {
    return local;
  }
}

export async function saveSizeChart(chart: SizeChart): Promise<void> {
  saveLocalItem(KEY_SIZE_CHART, chart);
  backgroundCloudSync(async () => {
    if (db) {
      await setDoc(doc(db, 'sizeCharts', 'default'), chart, { merge: true });
    }
  });
}

// SHIPPING METHODS
export async function fetchShippingMethods(): Promise<ShippingMethod[]> {
  const local = getLocalItem<ShippingMethod[]>(KEY_SHIPPING, DEFAULT_SHIPPING_METHODS);
  if (!db) return local;

  try {
    const fetchCloud = async () => {
      const snap = await getDocs(collection(db!, 'shippingMethods'));
      if (!snap.empty) {
        const cloudList: ShippingMethod[] = [];
        snap.forEach((d) => cloudList.push({ ...(d.data() as ShippingMethod), id: d.id }));
        saveLocalItem(KEY_SHIPPING, cloudList);
        return cloudList;
      }
      return local;
    };
    return await withTimeout(fetchCloud(), local, 1200);
  } catch (e) {
    return local;
  }
}

export async function saveShippingMethods(methods: ShippingMethod[]): Promise<void> {
  saveLocalItem(KEY_SHIPPING, methods);
  backgroundCloudSync(async () => {
    if (db) {
      for (const m of methods) {
        await setDoc(doc(db, 'shippingMethods', m.id), m, { merge: true });
      }
    }
  });
}

// FAQS
export async function fetchFAQs(): Promise<FAQItem[]> {
  const local = getLocalItem<FAQItem[]>(KEY_FAQS, DEFAULT_FAQS);
  if (!db) return [...local].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  try {
    const fetchCloud = async () => {
      const snap = await getDocs(collection(db!, 'faqs'));
      if (!snap.empty) {
        const cloudList: FAQItem[] = [];
        snap.forEach((d) => cloudList.push({ ...(d.data() as FAQItem), id: d.id }));
        const sorted = cloudList.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        saveLocalItem(KEY_FAQS, sorted);
        return sorted;
      }
      return local;
    };
    const res = await withTimeout(fetchCloud(), local, 1200);
    return [...res].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  } catch (e) {
    return [...local].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }
}

export async function saveFAQs(faqs: FAQItem[]): Promise<void> {
  saveLocalItem(KEY_FAQS, faqs);
  backgroundCloudSync(async () => {
    if (db) {
      for (const f of faqs) {
        await setDoc(doc(db, 'faqs', f.id), f, { merge: true });
      }
    }
  });
}

// STORE SETTINGS
export async function fetchStoreSettings(): Promise<StoreSettings> {
  const local = getLocalItem<StoreSettings>(KEY_STORE, DEFAULT_STORE_SETTINGS);

  const cleanPrefix = (local?.orderPrefix || 'WEFT')
    .toUpperCase()
    .replace(/CELL/g, 'WEFT')
    .replace(/[^A-Z0-9_-]/g, '')
    .replace(/[-_]+$/, '') || 'WEFT';

  const mergedLocal: StoreSettings = {
    ...DEFAULT_STORE_SETTINGS,
    ...local,
    orderPrefix: cleanPrefix,
  };

  if (!db) return mergedLocal;

  try {
    const fetchCloud = async () => {
      const snap = await getDoc(doc(db!, 'siteSettings', 'store'));
      if (snap.exists()) {
        const cloud = snap.data() as StoreSettings;
        const cPrefix = (cloud?.orderPrefix || 'WEFT')
          .toUpperCase()
          .replace(/CELL/g, 'WEFT')
          .replace(/[^A-Z0-9_-]/g, '')
          .replace(/[-_]+$/, '') || 'WEFT';
        const mergedCloud: StoreSettings = {
          ...DEFAULT_STORE_SETTINGS,
          ...cloud,
          orderPrefix: cPrefix,
        };
        saveLocalItem(KEY_STORE, mergedCloud);
        return mergedCloud;
      }
      return mergedLocal;
    };
    return await withTimeout(fetchCloud(), mergedLocal, 1200);
  } catch (e) {
    return mergedLocal;
  }
}

export async function saveStoreSettings(settings: StoreSettings): Promise<void> {
  const cleanPrefix = (settings.orderPrefix || 'WEFT')
    .toUpperCase()
    .replace(/CELL/g, 'WEFT')
    .replace(/[^A-Z0-9_-]/g, '')
    .replace(/[-_]+$/, '') || 'WEFT';

  const merged: StoreSettings = {
    ...DEFAULT_STORE_SETTINGS,
    ...settings,
    orderPrefix: cleanPrefix,
  };
  saveLocalItem(KEY_STORE, merged);

  backgroundCloudSync(async () => {
    if (db) {
      await setDoc(doc(db, 'siteSettings', 'store'), merged, { merge: true });
    }
  });
}

// FOOTER SETTINGS
export async function fetchFooterSettings(): Promise<FooterSettings> {
  const local = getLocalItem<FooterSettings>(KEY_FOOTER, DEFAULT_FOOTER);
  if (!db) return local;

  try {
    const fetchCloud = async () => {
      const snap = await getDoc(doc(db!, 'siteSettings', 'footer'));
      if (snap.exists()) {
        const cloudData = snap.data() as FooterSettings;
        saveLocalItem(KEY_FOOTER, cloudData);
        return cloudData;
      }
      return local;
    };
    return await withTimeout(fetchCloud(), local, 1200);
  } catch (e) {
    return local;
  }
}

export async function saveFooterSettings(settings: FooterSettings): Promise<void> {
  saveLocalItem(KEY_FOOTER, settings);
  backgroundCloudSync(async () => {
    if (db) {
      await setDoc(doc(db, 'siteSettings', 'footer'), settings, { merge: true });
    }
  });
}
