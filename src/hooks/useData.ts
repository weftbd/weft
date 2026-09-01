import { useState, useEffect, useCallback } from 'react';
import {
  HomepageSettings,
  Product,
  SizeChart,
  ShippingMethod,
  FAQItem,
  StoreSettings,
  FooterSettings,
  Order,
  SelectedProductSelection,
} from '../types';
import { fetchProducts, getLocalProducts } from '../services/products';
import {
  fetchHomepageSettings,
  fetchSizeChart,
  fetchShippingMethods,
  fetchFAQs,
  fetchStoreSettings,
  fetchFooterSettings,
  getLocalHomepageSettings,
  getLocalSizeChart,
  getLocalShippingMethods,
  getLocalFAQs,
  getLocalStoreSettings,
  getLocalFooterSettings,
} from '../services/settings';
import { fetchOrders, subscribeToOrders, getLocalOrders } from '../services/orders';
import { getCurrentAdmin, AdminUser } from '../services/auth';

export function useData() {
  const [loading, setLoading] = useState(false);
  // Zero-latency synchronous initialization from cache eliminates flash of default images/content on reload
  const [homepage, setHomepage] = useState<HomepageSettings>(() => getLocalHomepageSettings());
  const [products, setProducts] = useState<Product[]>(() => getLocalProducts());
  const [sizeChart, setSizeChart] = useState<SizeChart>(() => getLocalSizeChart());
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>(() => getLocalShippingMethods());
  const [faqs, setFaqs] = useState<FAQItem[]>(() => getLocalFAQs());
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => getLocalStoreSettings());
  const [footerSettings, setFooterSettings] = useState<FooterSettings>(() => getLocalFooterSettings());
  // Instant zero-latency initialization from cache so Orders Manager is ready immediately
  const [orders, setOrders] = useState<Order[]>(() => getLocalOrders());
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(() => getCurrentAdmin());

  // Customer selection state for single-page checkout initialized synchronously
  const [selectedItems, setSelectedItems] = useState<SelectedProductSelection[]>(() => {
    const initProds = getLocalProducts();
    const active = initProds.filter((p) => p.active);
    const first = active[0] || initProds[0];
    return first ? [{ productId: first.id, size: '', quantity: 1 }] : [];
  });

  // Purge any legacy dummy products from browser cache on initial mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('weft_products_data') || localStorage.getItem('cell_products_data');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.some((p) => p.id?.startsWith('prod-lavender') || p.id?.startsWith('prod-navy-blue'))) {
          localStorage.removeItem('weft_products_data');
          localStorage.removeItem('cell_products_data');
        }
      }
    } catch (e) {
      console.warn('Cache purge note:', e);
    }
  }, []);

  // Real-time live synchronization for orders
  useEffect(() => {
    const unsub = subscribeToOrders((cloudOrders) => {
      setOrders(cloudOrders);
    });
    return () => unsub();
  }, []);

  const loadAllData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial && orders.length === 0) {
        setLoading(true);
      }
      const [hp, prods, sc, ship, fq, store, foot, ords] = await Promise.all([
        fetchHomepageSettings(),
        fetchProducts(),
        fetchSizeChart(),
        fetchShippingMethods(),
        fetchFAQs(),
        fetchStoreSettings(),
        fetchFooterSettings(),
        fetchOrders(),
      ]);

      if (hp) setHomepage(hp);
      if (prods) setProducts(prods);
      if (sc) setSizeChart(sc);
      if (ship) setShippingMethods(ship);
      if (fq) setFaqs(fq);
      if (store) setStoreSettings(store);
      if (foot) setFooterSettings(foot);
      if (ords) setOrders(ords);

      // Auto-select exactly 1 product initially, but DO NOT auto-select any size (size must be explicitly chosen)
      if (prods && prods.length > 0) {
        const activeList = prods.filter((p) => p.active);
        const firstProd = activeList[0] || prods[0];
        setSelectedItems((prev) => {
          if (prev.length === 0 || !prods.some((p) => p.id === prev[0]?.productId)) {
            return [{ productId: firstProd.id, size: '', quantity: 1 }];
          }
          return prev;
        });
      } else {
        setSelectedItems([]);
      }
    } catch (err) {
      console.error('Error loading application data:', err);
    } finally {
      setLoading(false);
    }
  }, [orders.length]);

  useEffect(() => {
    loadAllData(true);
    setCurrentAdmin(getCurrentAdmin());
  }, [loadAllData]);

  // Selection helpers
  const toggleProductSelection = (productId: string) => {
    setSelectedItems((prev) => {
      const exists = prev.some((item) => item.productId === productId);
      if (exists) {
        if (prev.length === 1) {
          return prev;
        }
        return prev.filter((item) => item.productId !== productId);
      } else {
        return [...prev, { productId, size: '', quantity: 1 }];
      }
    });
  };

  const addItem = (productId: string, size = '') => {
    setSelectedItems((prev) => {
      const existing = prev.find((it) => it.productId === productId);
      if (existing) {
        return prev.map((it) =>
          it.productId === productId
            ? { ...it, quantity: it.quantity + 1, size: size || it.size }
            : it
        );
      }
      return [...prev, { productId, size, quantity: 1 }];
    });
  };

  const selectSingleProductAndScroll = (productId: string) => {
    setSelectedItems((prev) => {
      const existing = prev.find((item) => item.productId === productId);
      return [{ productId, size: existing?.size || '', quantity: existing?.quantity || 1 }];
    });

    const orderSection = document.getElementById('order-form');
    if (orderSection) {
      orderSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const updateItemSize = (productId: string, newSize: string) => {
    setSelectedItems((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, size: newSize } : item))
    );
  };

  const updateItemQuantity = (productId: string, delta: number) => {
    setSelectedItems((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : item;
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (productId: string) => {
    setSelectedItems((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((item) => item.productId !== productId);
    });
  };

  const clearSelectedItems = () => {
    if (products.length > 0) {
      setSelectedItems([
        {
          productId: products[0].id,
          size: products[0].availableSizes[1] || 'L',
          quantity: 1,
        },
      ]);
    } else {
      setSelectedItems([]);
    }
  };

  return {
    loading,
    homepage,
    products,
    sizeChart,
    shippingMethods,
    faqs,
    storeSettings,
    footer: footerSettings,
    footerSettings,
    orders,
    currentAdmin,
    selectedItems,
    refreshAll: () => loadAllData(false),
    toggleProductSelection,
    selectSingleProductAndScroll,
    updateItemSize,
    updateItemQuantity,
    addItem,
    removeItem,
    clearSelectedItems,
  };
}
