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
import { db } from './firebase';
import { Order, OrderStatus, CustomerInfo } from '../types';
import { fetchProducts } from './products';
import { fetchShippingMethods, fetchStoreSettings } from './settings';
import { getMetaAttribution } from './metaPixel';

export interface CreateOrderPayload {
  customer: CustomerInfo;
  items: {
    productId: string;
    size: string;
    quantity: number;
  }[];
  shippingMethodId?: string;
  attribution?: {
    fbp?: string;
    fbc?: string;
  };
}

const LOCAL_STORAGE_ORDERS_KEY = 'weft_orders_data';

export function getLocalOrders(): Order[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY) || localStorage.getItem('cell_orders_data');
    if (raw) {
      const sanitizedRaw = raw.replace(/\bCELL\b/g, 'WEFT').replace(/CELL-/g, 'WEFT-');
      const parsed = JSON.parse(sanitizedRaw);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (e) {
    console.error('Error reading orders from localStorage:', e);
  }
  return [];
}

export function saveLocalOrders(orders: Order[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Error saving orders to localStorage:', e);
  }
}

// Real-time Firestore subscription listener for instant live order updates
export function subscribeToOrders(
  onOrdersUpdated: (orders: Order[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  if (!db) {
    onOrdersUpdated(getLocalOrders());
    return () => {};
  }

  try {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const cloudOrders: Order[] = [];
        snapshot.forEach((docSnap) => {
          cloudOrders.push({ ...(docSnap.data() as Order), id: docSnap.id });
        });
        saveLocalOrders(cloudOrders);
        onOrdersUpdated(cloudOrders);
      },
      (err) => {
        console.warn('Orders subscription note, serving local:', err);
        if (onError) onError(err);
        onOrdersUpdated(getLocalOrders());
      }
    );

    return unsubscribe;
  } catch (e) {
    console.warn('Failed to attach orders subscription:', e);
    onOrdersUpdated(getLocalOrders());
    return () => {};
  }
}

export function validateBangladeshiPhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s-]/g, '');
  // Standard Bangladeshi mobile phone regex (11 digits starting with 013-019)
  const bdPhoneRegex = /^(?:\+8801|8801|01)[3-9]\d{8}$/;
  return bdPhoneRegex.test(cleaned);
}

export function formatBangladeshiPhone(phone: string): string {
  const cleaned = phone.replace(/[\s-]/g, '');
  if (cleaned.startsWith('+88')) return cleaned;
  if (cleaned.startsWith('88')) return '+' + cleaned;
  if (cleaned.startsWith('01')) return '+88' + cleaned;
  return phone;
}

export async function createOrder(
  payload: CreateOrderPayload
): Promise<{ success: boolean; order?: Order; eventId?: string; error?: string }> {
  try {
    const products = await fetchProducts();
    const shippingMethods = await fetchShippingMethods();
    const storeSettings = await fetchStoreSettings();

    if (!payload.items || payload.items.length === 0) {
      return { success: false, error: 'অন্তত একটি পণ্য সিলেক্ট করুন।' };
    }

    if (!payload.customer.name?.trim()) {
      return { success: false, error: 'অনুগ্রহ করে আপনার পুরো নাম লিখুন।' };
    }

    if (!validateBangladeshiPhone(payload.customer.phone)) {
      return {
        success: false,
        error: 'অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন (যেমন: 017XXXXXXXX)।',
      };
    }

    if (!payload.customer.address?.trim()) {
      return { success: false, error: 'অনুগ্রহ করে আপনার বিস্তারিত ঠিকানা লিখুন।' };
    }

    const orderItems = [];
    let subtotal = 0;
    let totalQuantity = 0;

    for (const item of payload.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        return { success: false, error: 'নির্বাচিত পণ্য পাওয়া যায়নি।' };
      }
      if (!product.active) {
        return { success: false, error: `${product.name} বর্তমানে স্টক শেষ।` };
      }
      if (!product.availableSizes.includes(item.size)) {
        return { success: false, error: `${product.name} এর ${item.size} সাইজ উপলব্ধ নেই।` };
      }

      const unitPrice = product.price;
      const lineSubtotal = unitPrice * item.quantity;
      subtotal += lineSubtotal;
      totalQuantity += item.quantity;

      orderItems.push({
        productId: product.id,
        productName: product.name,
        size: item.size,
        quantity: item.quantity,
        unitPrice: unitPrice,
        subtotal: lineSubtotal,
        image: product.image?.url || '',
      });
    }

    let selectedShipping = shippingMethods.find((s) => s.id === payload.shippingMethodId);
    if (!selectedShipping && shippingMethods.length > 0) {
      selectedShipping = shippingMethods[0];
    }

    let shippingCharge = selectedShipping ? selectedShipping.charge : 70;
    const freeShippingMinQty = storeSettings?.freeShippingMinQty ?? 2;
    if (totalQuantity >= freeShippingMinQty) {
      shippingCharge = 0;
    }

    const discount = 0;
    const finalTotal = subtotal + shippingCharge - discount;

    const timestamp = new Date().toISOString();
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const cleanPrefix = (storeSettings.orderPrefix || 'WEFT')
      .toUpperCase()
      .replace(/CELL/g, 'WEFT')
      .replace(/[^A-Z0-9_-]/g, '')
      .replace(/[-_]+$/, '') || 'WEFT';
    const orderNumber = `${cleanPrefix}-${new Date().getFullYear()}-${randomSuffix}`;
    const orderId = 'ord-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      customer: {
        name: payload.customer.name.trim(),
        phone: formatBangladeshiPhone(payload.customer.phone),
        address: payload.customer.address.trim(),
        city: payload.customer.city?.trim() || 'Inside Dhaka',
        note: payload.customer.note?.trim(),
      },
      items: orderItems,
      subtotal,
      shipping: shippingCharge,
      discount,
      total: finalTotal,
      paymentMethod: 'Cash on Delivery',
      paymentStatus: 'PENDING',
      orderStatus: 'PENDING',
      statusHistory: [
        {
          status: 'PENDING',
          timestamp,
          note: 'অর্ডার সফলভাবে গ্রহণ করা হয়েছে (Cash on Delivery)',
        },
      ],
      createdAt: timestamp,
      updatedAt: timestamp,
      shippingMethodId: selectedShipping?.id,
    };

    // Update local cache immediately
    const currentOrders = getLocalOrders();
    currentOrders.unshift(newOrder);
    saveLocalOrders(currentOrders);

    const eventId = `purchase_${newOrder.orderNumber}`;
    const attribution = payload.attribution || getMetaAttribution();

    // Trigger server CAPI in background
    try {
      fetch('/api/meta/capi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: 'Purchase',
          eventId,
          eventSourceUrl: typeof window !== 'undefined' ? window.location.href : 'https://weftbd.com',
          userData: {
            phone: newOrder.customer.phone,
            firstName: newOrder.customer.name.split(' ')[0] || '',
            lastName: newOrder.customer.name.split(' ').slice(1).join(' ') || '',
            city: newOrder.customer.city,
            fbp: attribution.fbp,
            fbc: attribution.fbc,
            externalId: newOrder.customer.phone,
          },
          customData: {
            content_type: 'product',
            content_ids: orderItems.map((it) => it.productId),
            contents: orderItems.map((it) => ({
              id: it.productId,
              quantity: it.quantity,
              item_price: it.unitPrice,
              size: it.size,
            })),
            value: finalTotal,
            currency: 'BDT',
            num_items: totalQuantity,
            order_id: newOrder.orderNumber,
          },
        }),
      }).catch((e) => console.warn('[Meta CAPI] Purchase background trigger error:', e));
    } catch (e) {
      // Ignore
    }

    // Direct save to Cloud Firestore
    if (db) {
      try {
        await setDoc(doc(db, 'orders', orderId), newOrder);
      } catch (err) {
        console.warn('Firestore order save error, fallback kept locally:', err);
      }
    }

    return { success: true, order: newOrder, eventId };
  } catch (e) {
    console.error('Order creation error:', e);
    return { success: false, error: 'অর্ডার সম্পন্ন করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' };
  }
}

export const submitOrder = createOrder;

// Fetch orders with fast-return strategy: returns cached data instantly while syncing in background
export async function fetchOrders(): Promise<Order[]> {
  const local = getLocalOrders();

  if (!db) {
    return local;
  }

  // Use a race with a quick timeout (1.5s) so the UI is never blocked if the network is slow
  try {
    const fetchPromise = (async () => {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const cloudOrders: Order[] = [];
        snapshot.forEach((docSnap) => {
          cloudOrders.push({ ...(docSnap.data() as Order), id: docSnap.id });
        });
        saveLocalOrders(cloudOrders);
        return cloudOrders;
      }
      return [];
    })();

    const timeoutPromise = new Promise<Order[]>((resolve) =>
      setTimeout(() => resolve(local), 1200)
    );

    const result = await Promise.race([fetchPromise, timeoutPromise]);
    return result.length > 0 ? result : local;
  } catch (err) {
    console.warn('Firestore fetchOrders fast fallback:', err);
    return local;
  }
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  note?: string
): Promise<boolean> {
  const timestamp = new Date().toISOString();
  const historyEntry = {
    status: newStatus,
    timestamp,
    note: note || `Status updated to ${newStatus}`,
  };

  const current = getLocalOrders();
  const orderIndex = current.findIndex((o) => o.id === orderId);

  let updatedOrder: Order | null = null;
  if (orderIndex >= 0) {
    const previousOrder = current[orderIndex];
    const oldStatus = previousOrder.orderStatus;
    updatedOrder = {
      ...previousOrder,
      orderStatus: newStatus,
      updatedAt: timestamp,
      statusHistory: [...(previousOrder.statusHistory || []), historyEntry],
    };
    current[orderIndex] = updatedOrder;
    saveLocalOrders(current);

    // Trigger Meta CAPI Lifecycle server-side in background
    try {
      fetch('/api/admin/order-lifecycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: updatedOrder,
          previousStatus: oldStatus,
          newStatus,
          adminNote: note,
        }),
      }).catch((e) => console.warn('[Meta CAPI] Lifecycle trigger notice:', e));
    } catch (e) {
      // Ignore
    }
  }

  // Update in Cloud Firestore synchronously so any immediate reads/listeners get the fresh status
  if (db) {
    try {
      await setDoc(
        doc(db, 'orders', orderId),
        {
          orderStatus: newStatus,
          updatedAt: timestamp,
          ...(updatedOrder?.statusHistory ? { statusHistory: updatedOrder.statusHistory } : {}),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Firestore updateOrderStatus error:', err);
    }
  }

  return true;
}

// Bulk update order status (like WordPress bulk actions)
export async function bulkUpdateOrderStatus(
  orderIds: string[],
  newStatus: OrderStatus,
  note?: string
): Promise<boolean> {
  if (!orderIds.length) return false;
  const timestamp = new Date().toISOString();
  const current = getLocalOrders();

  const idSet = new Set(orderIds);
  const updatedOrders = current.map((order) => {
    if (idSet.has(order.id)) {
      return {
        ...order,
        orderStatus: newStatus,
        updatedAt: timestamp,
        statusHistory: [
          ...(order.statusHistory || []),
          {
            status: newStatus,
            timestamp,
            note: note || `Bulk status update to ${newStatus}`,
          },
        ],
      };
    }
    return order;
  });

  saveLocalOrders(updatedOrders);

  // Trigger Meta CAPI Lifecycle server-side in background for each bulk updated order
  try {
    for (const id of orderIds) {
      const updated = updatedOrders.find((o) => o.id === id);
      const prev = current.find((o) => o.id === id);
      if (updated) {
        fetch('/api/admin/order-lifecycle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order: updated,
            previousStatus: prev?.orderStatus,
            newStatus,
            adminNote: note || `Bulk status update to ${newStatus}`,
          }),
        }).catch((e) => console.warn('[Meta CAPI] Bulk lifecycle trigger notice:', e));
      }
    }
  } catch (e) {
    // Ignore
  }

  if (db) {
    try {
      await Promise.all(
        orderIds.map((id) => {
          const order = updatedOrders.find((o) => o.id === id);
          return setDoc(
            doc(db!, 'orders', id),
            {
              orderStatus: newStatus,
              updatedAt: timestamp,
              ...(order?.statusHistory ? { statusHistory: order.statusHistory } : {}),
            },
            { merge: true }
          );
        })
      );
    } catch (err) {
      console.warn('Firestore bulkUpdateOrderStatus error:', err);
    }
  }

  return true;
}

// Edit and modify existing order completely
export async function updateOrderDetails(updatedOrder: Order): Promise<boolean> {
  const current = getLocalOrders();
  const index = current.findIndex((o) => o.id === updatedOrder.id);
  if (index < 0) return false;

  const orderWithTimestamp = {
    ...updatedOrder,
    updatedAt: new Date().toISOString(),
  };

  current[index] = orderWithTimestamp;
  saveLocalOrders(current);

  if (db) {
    try {
      await setDoc(doc(db, 'orders', updatedOrder.id), orderWithTimestamp, { merge: true });
    } catch (err) {
      console.warn('Firestore updateOrderDetails error:', err);
    }
  }

  return true;
}

// Delete single order
export async function deleteOrder(orderId: string): Promise<boolean> {
  const current = getLocalOrders();
  const filtered = current.filter((o) => o.id !== orderId);
  saveLocalOrders(filtered);

  if (db) {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (err) {
      console.warn('Firestore deleteOrder error:', err);
    }
  }

  return true;
}

// Bulk delete orders
export async function bulkDeleteOrders(orderIds: string[]): Promise<boolean> {
  if (!orderIds.length) return false;
  const current = getLocalOrders();
  const idSet = new Set(orderIds);
  const filtered = current.filter((o) => !idSet.has(o.id));
  saveLocalOrders(filtered);

  if (db) {
    try {
      await Promise.all(orderIds.map((id) => deleteDoc(doc(db!, 'orders', id))));
    } catch (err) {
      console.warn('Firestore bulkDeleteOrders error:', err);
    }
  }

  return true;
}

export function exportOrdersToCSV(orders: Order[]): void {
  if (!orders.length) return;

  const headers = [
    'Order Number',
    'Date',
    'Customer Name',
    'Phone',
    'City/Area',
    'Address',
    'Items Summary',
    'Subtotal (BDT)',
    'Shipping (BDT)',
    'Total (BDT)',
    'Status',
    'Payment Method',
  ];

  const rows = orders.map((o) => {
    const itemsSummary = o.items
      .map((it) => `${it.productName} (${it.size}) x${it.quantity}`)
      .join('; ');

    return [
      `"${o.orderNumber}"`,
      `"${new Date(o.createdAt).toLocaleDateString()} ${new Date(o.createdAt).toLocaleTimeString()}"`,
      `"${(o.customer?.name || '').replace(/"/g, '""')}"`,
      `"${o.customer?.phone || ''}"`,
      `"${(o.customer?.city || '').replace(/"/g, '""')}"`,
      `"${(o.customer?.address || '').replace(/"/g, '""')}"`,
      `"${itemsSummary.replace(/"/g, '""')}"`,
      o.subtotal,
      o.shipping,
      o.total,
      `"${o.orderStatus}"`,
      `"${o.paymentMethod}"`,
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `WEFT_Orders_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

