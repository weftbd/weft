import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
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
  const cleanPrefix =
    (local?.orderPrefix || 'TAAROK')
      .toUpperCase()
      .replace(/CELL|WEFT/g, 'TAAROK')
      .replace(/[^A-Z0-9_-]/g, '')
      .replace(/[-_]+$/, '') || 'TAAROK';
  const cleanStoreName =
    !local?.storeName || local.storeName === 'WEFT' || local.storeName === 'CELL'
      ? 'Taarok'
      : local.storeName;

  return {
    ...DEFAULT_STORE_SETTINGS,
    ...local,
    storeName: cleanStoreName,
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
        .replace(/"orderPrefix":"(CELL|WEFT)"/g, '"orderPrefix":"TAAROK"')
        .replace(/\b(CELL|WEFT)\b/g, 'Taarok')
        .replace(/\+?880\s?1700-000000/g, '+8801348289477')
        .replace(/8801700000000/g, '8801348289477')
        .replace(/\+?8801909999079/g, '+8801348289477')
        .replace(/support@weftbd\.com/g, 'support@taarok.com');
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

// Real-time subscription for Homepage settings across domains
export function subscribeToHomepageSettings(
  onUpdated: (homepage: HomepageSettings) => void
): Unsubscribe {
  if (!db) {
    onUpdated(getLocalHomepageSettings());
    return () => {};
  }

  try {
    const docRef = doc(db, 'siteSettings', 'homepage');
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const cloudData = snap.data() as HomepageSettings;
          saveLocalItem(KEY_HOMEPAGE, cloudData);
          onUpdated(cloudData);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, 'siteSettings/homepage');
      }
    );
  } catch (e) {
    return () => {};
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
      } else {
        // Seed existing local homepage settings into Firestore if not yet in cloud
        await setDoc(docRef, local, { merge: true });
      }
      return local;
    };
    return await withTimeout(fetchCloud(), local, 2500);
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, 'siteSettings/homepage');
    return local;
  }
}

export async function saveHomepageSettings(settings: HomepageSettings): Promise<void> {
  saveLocalItem(KEY_HOMEPAGE, settings);
  if (db) {
    try {
      await withTimeout(
        setDoc(doc(db, 'siteSettings', 'homepage'), settings, { merge: true }),
        undefined,
        3000
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'siteSettings/homepage');
    }
  }
}

// SIZE CHART
export async function fetchSizeChart(): Promise<SizeChart> {
  const local = getLocalItem<SizeChart>(KEY_SIZE_CHART, DEFAULT_SIZE_CHART);
  if (!db) return local;

  try {
    const fetchCloud = async () => {
      const docRef = doc(db!, 'sizeCharts', 'default');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const cloudData = snap.data() as SizeChart;
        saveLocalItem(KEY_SIZE_CHART, cloudData);
        return cloudData;
      } else {
        await setDoc(docRef, local, { merge: true });
      }
      return local;
    };
    return await withTimeout(fetchCloud(), local, 2500);
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, 'sizeCharts/default');
    return local;
  }
}

export async function saveSizeChart(chart: SizeChart): Promise<void> {
  saveLocalItem(KEY_SIZE_CHART, chart);
  if (db) {
    try {
      await withTimeout(
        setDoc(doc(db, 'sizeCharts', 'default'), chart, { merge: true }),
        undefined,
        3000
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'sizeCharts/default');
    }
  }
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
      } else if (local.length > 0) {
        await Promise.all(
          local.map((m) => setDoc(doc(db!, 'shippingMethods', m.id), m, { merge: true }))
        );
      }
      return local;
    };
    return await withTimeout(fetchCloud(), local, 2500);
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, 'shippingMethods');
    return local;
  }
}

export async function saveShippingMethods(methods: ShippingMethod[]): Promise<void> {
  saveLocalItem(KEY_SHIPPING, methods);
  if (db) {
    try {
      await withTimeout(
        Promise.all(
          methods.map((m) => setDoc(doc(db!, 'shippingMethods', m.id), m, { merge: true }))
        ),
        undefined,
        3000
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'shippingMethods');
    }
  }
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
      } else if (local.length > 0) {
        await Promise.all(local.map((f) => setDoc(doc(db!, 'faqs', f.id), f, { merge: true })));
      }
      return local;
    };
    const res = await withTimeout(fetchCloud(), local, 2500);
    return [...res].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, 'faqs');
    return [...local].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }
}

export async function saveFAQs(faqs: FAQItem[]): Promise<void> {
  saveLocalItem(KEY_FAQS, faqs);
  if (db) {
    try {
      await withTimeout(
        Promise.all(faqs.map((f) => setDoc(doc(db!, 'faqs', f.id), f, { merge: true }))),
        undefined,
        3000
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'faqs');
    }
  }
}

// STORE SETTINGS
export async function fetchStoreSettings(): Promise<StoreSettings> {
  const local = getLocalItem<StoreSettings>(KEY_STORE, DEFAULT_STORE_SETTINGS);

  const cleanPrefix =
    (local?.orderPrefix || 'TAAROK')
      .toUpperCase()
      .replace(/CELL|WEFT/g, 'TAAROK')
      .replace(/[^A-Z0-9_-]/g, '')
      .replace(/[-_]+$/, '') || 'TAAROK';

  const cleanStoreName =
    !local?.storeName || local.storeName === 'WEFT' || local.storeName === 'CELL'
      ? 'Taarok'
      : local.storeName;

  const mergedLocal: StoreSettings = {
    ...DEFAULT_STORE_SETTINGS,
    ...local,
    storeName: cleanStoreName,
    orderPrefix: cleanPrefix,
  };

  if (!db) return mergedLocal;

  try {
    const fetchCloud = async () => {
      const docRef = doc(db!, 'siteSettings', 'store');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const cloud = snap.data() as StoreSettings;
        const cPrefix =
          (cloud?.orderPrefix || 'TAAROK')
            .toUpperCase()
            .replace(/CELL|WEFT/g, 'TAAROK')
            .replace(/[^A-Z0-9_-]/g, '')
            .replace(/[-_]+$/, '') || 'TAAROK';
        const cStoreName =
          !cloud?.storeName || cloud.storeName === 'WEFT' || cloud.storeName === 'CELL'
            ? 'Taarok'
            : cloud.storeName;
        const mergedCloud: StoreSettings = {
          ...DEFAULT_STORE_SETTINGS,
          ...cloud,
          storeName: cStoreName,
          orderPrefix: cPrefix,
        };
        saveLocalItem(KEY_STORE, mergedCloud);
        return mergedCloud;
      } else {
        await setDoc(docRef, mergedLocal, { merge: true });
      }
      return mergedLocal;
    };
    return await withTimeout(fetchCloud(), mergedLocal, 2500);
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, 'siteSettings/store');
    return mergedLocal;
  }
}

export async function saveStoreSettings(settings: StoreSettings): Promise<void> {
  const cleanPrefix =
    (settings.orderPrefix || 'TAAROK')
      .toUpperCase()
      .replace(/CELL|WEFT/g, 'TAAROK')
      .replace(/[^A-Z0-9_-]/g, '')
      .replace(/[-_]+$/, '') || 'TAAROK';

  const merged: StoreSettings = {
    ...DEFAULT_STORE_SETTINGS,
    ...settings,
    orderPrefix: cleanPrefix,
  };
  saveLocalItem(KEY_STORE, merged);

  if (db) {
    try {
      await withTimeout(
        setDoc(doc(db, 'siteSettings', 'store'), merged, { merge: true }),
        undefined,
        3000
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'siteSettings/store');
    }
  }
}

// FOOTER SETTINGS
export async function fetchFooterSettings(): Promise<FooterSettings> {
  const local = getLocalItem<FooterSettings>(KEY_FOOTER, DEFAULT_FOOTER);
  if (!db) return local;

  try {
    const fetchCloud = async () => {
      const docRef = doc(db!, 'siteSettings', 'footer');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const cloudData = snap.data() as FooterSettings;
        saveLocalItem(KEY_FOOTER, cloudData);
        return cloudData;
      } else {
        await setDoc(docRef, local, { merge: true });
      }
      return local;
    };
    return await withTimeout(fetchCloud(), local, 2500);
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, 'siteSettings/footer');
    return local;
  }
}

export async function saveFooterSettings(settings: FooterSettings): Promise<void> {
  saveLocalItem(KEY_FOOTER, settings);
  if (db) {
    try {
      await withTimeout(
        setDoc(doc(db, 'siteSettings', 'footer'), settings, { merge: true }),
        undefined,
        3000
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'siteSettings/footer');
    }
  }
}
