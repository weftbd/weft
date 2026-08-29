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
import { fetchProducts } from '../services/products';
import {
  fetchHomepageSettings,
  fetchSizeChart,
  fetchShippingMethods,
  fetchFAQs,
  fetchStoreSettings,
  fetchFooterSettings,
} from '../services/settings';
import { fetchOrders } from '../services/orders';
import { getCurrentAdmin, AdminUser } from '../services/auth';
import {
  DEFAULT_HOMEPAGE,
  DEFAULT_PRODUCTS,
  DEFAULT_SIZE_CHART,
  DEFAULT_SHIPPING_METHODS,
  DEFAULT_FAQS,
  DEFAULT_STORE_SETTINGS,
  DEFAULT_FOOTER,
} from '../data/defaults';

export function useData() {
  const [loading, setLoading] = useState(true);
  const [homepage, setHomepage] = useState<HomepageSettings>(DEFAULT_HOMEPAGE);
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [sizeChart, setSizeChart] = useState<SizeChart>(DEFAULT_SIZE_CHART);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>(DEFAULT_SHIPPING_METHODS);
  const [faqs, setFaqs] = useState<FAQItem[]>(DEFAULT_FAQS);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [footerSettings, setFooterSettings] = useState<FooterSettings>(DEFAULT_FOOTER);
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(getCurrentAdmin());

  // Customer selection state for single-page checkout
  const [selectedItems, setSelectedItems] = useState<SelectedProductSelection[]>([
    {
      productId: DEFAULT_PRODUCTS[0]?.id || 'prod-lavender',
      size: 'L',
      quantity: 1,
    },
  ]);

  const loadAllData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) {
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
      if (prods && prods.length > 0) setProducts(prods);
      if (sc) setSizeChart(sc);
      if (ship && ship.length > 0) setShippingMethods(ship);
      if (fq) setFaqs(fq);
      if (store) setStoreSettings(store);
      if (foot) setFooterSettings(foot);
      if (ords) setOrders(ords);

      // Ensure initial selection has a valid product
      if (prods && prods.length > 0) {
        setSelectedItems((prev) => {
          if (prev.length === 0) {
            return [{ productId: prods[0].id, size: prods[0].availableSizes[1] || 'L', quantity: 1 }];
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('Error loading application data:', err);
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadAllData(true);
    setCurrentAdmin(getCurrentAdmin());
  }, [loadAllData]);

  // Selection helpers
  const toggleProductSelection = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    const defaultSize = product?.availableSizes[1] || product?.availableSizes[0] || 'L';

    setSelectedItems((prev) => {
      const exists = prev.some((item) => item.productId === productId);
      if (exists) {
        if (prev.length === 1) {
          return prev;
        }
        return prev.filter((item) => item.productId !== productId);
      } else {
        return [...prev, { productId, size: defaultSize, quantity: 1 }];
      }
    });
  };

  const addItem = (productId: string, size?: string) => {
    const product = products.find((p) => p.id === productId);
    const defaultSize = size || product?.availableSizes[1] || product?.availableSizes[0] || 'L';

    setSelectedItems((prev) => {
      const existing = prev.find((it) => it.productId === productId && it.size === defaultSize);
      if (existing) {
        return prev.map((it) =>
          it.productId === productId && it.size === defaultSize
            ? { ...it, quantity: it.quantity + 1 }
            : it
        );
      }
      return [...prev, { productId, size: defaultSize, quantity: 1 }];
    });
  };

  const selectSingleProductAndScroll = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    const defaultSize = product?.availableSizes[1] || product?.availableSizes[0] || 'L';

    setSelectedItems((prev) => {
      const exists = prev.some((item) => item.productId === productId);
      if (!exists) {
        return [{ productId, size: defaultSize, quantity: 1 }];
      }
      return prev;
    });

    const orderSection = document.getElementById('order-form');
    if (orderSection) {
      orderSection.scrollIntoView({ behavior: 'smooth' });
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
