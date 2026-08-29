import { collection, doc, getDocs, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { Order, OrderStatus, Product, ShippingMethod, CustomerInfo } from '../types';
import { fetchProducts } from './products';
import { fetchShippingMethods, fetchStoreSettings } from './settings';

export interface CreateOrderPayload {
  customer: CustomerInfo;
  items: {
    productId: string;
    size: string;
    quantity: number;
  }[];
  shippingMethodId?: string;
}

const LOCAL_STORAGE_ORDERS_KEY = 'weft_orders_data';

function getLocalOrders(): Order[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY) || localStorage.getItem('cell_orders_data');
    if (raw) {
      const sanitizedRaw = raw.replace(/\bCELL\b/g, 'WEFT').replace(/CELL-/g, 'WEFT-');
      const parsed = JSON.parse(sanitizedRaw);
      localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(parsed));
      return parsed;
    }
  } catch (e) {
    console.error('Error reading orders from localStorage:', e);
  }
  return [];
}

function saveLocalOrders(orders: Order[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Error saving orders to localStorage:', e);
  }
}

function asyncCloudSync(syncFn: () => Promise<any>): void {
  if (!db) return;
  setTimeout(async () => {
    try {
      await syncFn();
    } catch (err) {
      console.warn('Orders cloud sync note:', err);
    }
  }, 10);
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
): Promise<{ success: boolean; order?: Order; error?: string }> {
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

    // Save to Firestore non-blocking
    asyncCloudSync(async () => {
      if (db) {
        await setDoc(doc(db, 'orders', orderId), newOrder);
      }
    });

    return { success: true, order: newOrder };
  } catch (e) {
    console.error('Order creation error:', e);
    return { success: false, error: 'অর্ডার সম্পন্ন করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' };
  }
}

export const submitOrder = createOrder;

export async function fetchOrders(): Promise<Order[]> {
  const local = getLocalOrders();
  return local;
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

  if (orderIndex >= 0) {
    const updatedOrder: Order = {
      ...current[orderIndex],
      orderStatus: newStatus,
      updatedAt: timestamp,
      statusHistory: [...(current[orderIndex].statusHistory || []), historyEntry],
    };
    current[orderIndex] = updatedOrder;
    saveLocalOrders(current);

    asyncCloudSync(async () => {
      if (db) {
        await setDoc(
          doc(db, 'orders', orderId),
          {
            orderStatus: newStatus,
            updatedAt: timestamp,
            statusHistory: updatedOrder.statusHistory,
          },
          { merge: true }
        );
      }
    });

    return true;
  }
  return false;
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

  asyncCloudSync(async () => {
    if (db) {
      for (const id of orderIds) {
        const order = updatedOrders.find((o) => o.id === id);
        if (order) {
          await setDoc(
            doc(db, 'orders', id),
            {
              orderStatus: newStatus,
              updatedAt: timestamp,
              statusHistory: order.statusHistory,
            },
            { merge: true }
          );
        }
      }
    }
  });

  return true;
}

// Edit and modify existing order completely
export async function updateOrderDetails(updatedOrder: Order): Promise<boolean> {
  const current = getLocalOrders();
  const index = current.findIndex((o) => o.id === updatedOrder.id);
  if (index < 0) return false;

  current[index] = {
    ...updatedOrder,
    updatedAt: new Date().toISOString(),
  };
  saveLocalOrders(current);

  asyncCloudSync(async () => {
    if (db) {
      await setDoc(doc(db, 'orders', updatedOrder.id), current[index], { merge: true });
    }
  });

  return true;
}

// Delete single order
export async function deleteOrder(orderId: string): Promise<boolean> {
  const current = getLocalOrders();
  const filtered = current.filter((o) => o.id !== orderId);
  saveLocalOrders(filtered);

  asyncCloudSync(async () => {
    if (db) {
      await deleteDoc(doc(db, 'orders', orderId));
    }
  });

  return true;
}

// Bulk delete orders
export async function bulkDeleteOrders(orderIds: string[]): Promise<boolean> {
  if (!orderIds.length) return false;
  const current = getLocalOrders();
  const idSet = new Set(orderIds);
  const filtered = current.filter((o) => !idSet.has(o.id));
  saveLocalOrders(filtered);

  asyncCloudSync(async () => {
    if (db) {
      for (const id of orderIds) {
        await deleteDoc(doc(db, 'orders', id));
      }
    }
  });

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
