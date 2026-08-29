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

// Local storage keys
const KEY_HOMEPAGE = 'weft_cms_homepage';
const KEY_SIZE_CHART = 'weft_cms_size_chart';
const KEY_SHIPPING = 'weft_cms_shipping';
const KEY_FAQS = 'weft_cms_faqs';
const KEY_STORE = 'weft_cms_store_settings';
const KEY_FOOTER = 'weft_cms_footer';

function getLocalItem<T>(key: string, defaultValue: T): T {
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

function saveLocalItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key}:`, e);
  }
}

// Non-blocking fire-and-forget sync helper that never freezes or delays the UI
function asyncCloudSync(syncFn: () => Promise<any>): void {
  if (!db) return;
  // Execute in background
  setTimeout(async () => {
    try {
      await syncFn();
    } catch (err) {
      console.warn('Background Firestore sync note:', err);
    }
  }, 10);
}

// HOMEPAGE
export async function fetchHomepageSettings(): Promise<HomepageSettings> {
  try {
    if (db) {
      const docRef = doc(db, 'siteSettings', 'homepage');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const cloudData = snap.data() as HomepageSettings;
        saveLocalItem(KEY_HOMEPAGE, cloudData);
        return cloudData;
      }
    }
  } catch (e) {
    console.warn('Firestore fetchHomepageSettings note:', e);
  }
  const local = getLocalItem<HomepageSettings>(KEY_HOMEPAGE, DEFAULT_HOMEPAGE);
  return local;
}

export async function saveHomepageSettings(settings: HomepageSettings): Promise<void> {
  saveLocalItem(KEY_HOMEPAGE, settings);
  if (db) {
    try {
      await setDoc(doc(db, 'siteSettings', 'homepage'), settings, { merge: true });
    } catch (e) {
      console.warn('Firestore saveHomepageSettings error:', e);
    }
  }
}

// SIZE CHART
export async function fetchSizeChart(): Promise<SizeChart> {
  try {
    if (db) {
      const snap = await getDoc(doc(db, 'sizeCharts', 'default'));
      if (snap.exists()) {
        const cloudData = snap.data() as SizeChart;
        saveLocalItem(KEY_SIZE_CHART, cloudData);
        return cloudData;
      }
    }
  } catch (e) {
    console.warn('Firestore fetchSizeChart note:', e);
  }
  return getLocalItem<SizeChart>(KEY_SIZE_CHART, DEFAULT_SIZE_CHART);
}

export async function saveSizeChart(chart: SizeChart): Promise<void> {
  saveLocalItem(KEY_SIZE_CHART, chart);
  if (db) {
    try {
      await setDoc(doc(db, 'sizeCharts', 'default'), chart, { merge: true });
    } catch (e) {
      console.warn('Firestore saveSizeChart error:', e);
    }
  }
}

// SHIPPING METHODS
export async function fetchShippingMethods(): Promise<ShippingMethod[]> {
  try {
    if (db) {
      const snap = await getDocs(collection(db, 'shippingMethods'));
      if (!snap.empty) {
        const cloudList: ShippingMethod[] = [];
        snap.forEach((d) => cloudList.push({ ...(d.data() as ShippingMethod), id: d.id }));
        saveLocalItem(KEY_SHIPPING, cloudList);
        return cloudList;
      }
    }
  } catch (e) {
    console.warn('Firestore fetchShippingMethods note:', e);
  }
  return getLocalItem<ShippingMethod[]>(KEY_SHIPPING, DEFAULT_SHIPPING_METHODS);
}

export async function saveShippingMethods(methods: ShippingMethod[]): Promise<void> {
  saveLocalItem(KEY_SHIPPING, methods);
  if (db) {
    try {
      for (const m of methods) {
        await setDoc(doc(db, 'shippingMethods', m.id), m, { merge: true });
      }
    } catch (e) {
      console.warn('Firestore saveShippingMethods error:', e);
    }
  }
}

// FAQS
export async function fetchFAQs(): Promise<FAQItem[]> {
  try {
    if (db) {
      const snap = await getDocs(collection(db, 'faqs'));
      if (!snap.empty) {
        const cloudList: FAQItem[] = [];
        snap.forEach((d) => cloudList.push({ ...(d.data() as FAQItem), id: d.id }));
        const sorted = cloudList.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        saveLocalItem(KEY_FAQS, sorted);
        return sorted;
      }
    }
  } catch (e) {
    console.warn('Firestore fetchFAQs note:', e);
  }
  const list = getLocalItem<FAQItem[]>(KEY_FAQS, DEFAULT_FAQS);
  return [...list].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

export async function saveFAQs(faqs: FAQItem[]): Promise<void> {
  saveLocalItem(KEY_FAQS, faqs);
  if (db) {
    try {
      for (const f of faqs) {
        await setDoc(doc(db, 'faqs', f.id), f, { merge: true });
      }
    } catch (e) {
      console.warn('Firestore saveFAQs error:', e);
    }
  }
}

// STORE SETTINGS
export async function fetchStoreSettings(): Promise<StoreSettings> {
  let loaded = getLocalItem<StoreSettings>(KEY_STORE, DEFAULT_STORE_SETTINGS);
  try {
    if (db) {
      const snap = await getDoc(doc(db, 'siteSettings', 'store'));
      if (snap.exists()) {
        loaded = snap.data() as StoreSettings;
      }
    }
  } catch (e) {
    console.warn('Firestore fetchStoreSettings note:', e);
  }

  const cleanPrefix = (loaded?.orderPrefix || 'WEFT')
    .toUpperCase()
    .replace(/CELL/g, 'WEFT')
    .replace(/[^A-Z0-9_-]/g, '')
    .replace(/[-_]+$/, '') || 'WEFT';

  const merged: StoreSettings = {
    ...DEFAULT_STORE_SETTINGS,
    ...loaded,
    orderPrefix: cleanPrefix,
  };
  saveLocalItem(KEY_STORE, merged);
  return merged;
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

  if (db) {
    try {
      await setDoc(doc(db, 'siteSettings', 'store'), merged, { merge: true });
    } catch (e) {
      console.warn('Firestore saveStoreSettings error:', e);
    }
  }
}

// FOOTER SETTINGS
export async function fetchFooterSettings(): Promise<FooterSettings> {
  try {
    if (db) {
      const snap = await getDoc(doc(db, 'siteSettings', 'footer'));
      if (snap.exists()) {
        const cloudData = snap.data() as FooterSettings;
        saveLocalItem(KEY_FOOTER, cloudData);
        return cloudData;
      }
    }
  } catch (e) {
    console.warn('Firestore fetchFooterSettings note:', e);
  }
  return getLocalItem<FooterSettings>(KEY_FOOTER, DEFAULT_FOOTER);
}

export async function saveFooterSettings(settings: FooterSettings): Promise<void> {
  saveLocalItem(KEY_FOOTER, settings);
  if (db) {
    try {
      await setDoc(doc(db, 'siteSettings', 'footer'), settings, { merge: true });
    } catch (e) {
      console.warn('Firestore saveFooterSettings error:', e);
    }
  }
}
