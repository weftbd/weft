import { Order, Product } from '../types';

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
  }
}

export const DEFAULT_PIXEL_ID = '1005176032544398';

// Set to track dispatched event IDs in memory to avoid duplicate firings during re-renders
const processedEventIds = new Set<string>();

// Get stored event IDs from sessionStorage for cross-render/refresh protection
function getSessionEventIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem('weft_meta_processed_events');
    if (raw) {
      const arr = JSON.parse(raw);
      return new Set(Array.isArray(arr) ? arr : []);
    }
  } catch (e) {
    // Ignore storage errors
  }
  return new Set();
}

function markEventProcessed(eventId: string): void {
  processedEventIds.add(eventId);
  try {
    const ids = getSessionEventIds();
    ids.add(eventId);
    sessionStorage.setItem('weft_meta_processed_events', JSON.stringify(Array.from(ids)));
  } catch (e) {
    // Ignore
  }
}

export function isEventProcessed(eventId: string): boolean {
  if (processedEventIds.has(eventId)) return true;
  const sessionIds = getSessionEventIds();
  return sessionIds.has(eventId);
}

/**
 * Capture _fbp and _fbc cookies or URL parameters
 */
export function getMetaAttribution(): { fbp?: string; fbc?: string } {
  if (typeof document === 'undefined') return {};

  const getCookie = (name: string) => {
    const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
    return match ? decodeURIComponent(match[3]) : undefined;
  };

  let fbp = getCookie('_fbp');
  let fbc = getCookie('_fbc');

  // If no _fbc cookie, check if fbclid is in the URL and preserve it
  if (!fbc && typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const fbclid = urlParams.get('fbclid');
    if (fbclid) {
      const timestamp = Date.now();
      fbc = `fb.1.${timestamp}.${fbclid}`;
      try {
        document.cookie = `_fbc=${fbc};path=/;max-age=${90 * 24 * 60 * 60};SameSite=Lax`;
      } catch (e) {
        // Ignore cookie write error
      }
    }
  }

  return { fbp, fbc };
}

let isInitialized = false;
let currentPixelId: string | null = null;

/**
 * Initialize Meta Pixel Base Code exactly once or re-init on ID change
 */
export function initMetaPixel(customPixelId?: string): void {
  if (typeof window === 'undefined') return;

  const pixelId =
    customPixelId ||
    ((import.meta as any).env?.VITE_META_PIXEL_ID as string) ||
    DEFAULT_PIXEL_ID;

  // Standard Meta Pixel snippet loader fallback if not in head
  if (!window.fbq) {
    const n: any = function (...args: any[]) {
      if (n.callMethod) {
        n.callMethod.apply(n, args);
      } else {
        n.queue.push(args);
      }
    };
    if (!window._fbq) window._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    window.fbq = n;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      document.head.appendChild(script);
    }
  }

  // Ensure init is executed with active Pixel ID
  try {
    if (currentPixelId !== pixelId || !isInitialized) {
      window.fbq('init', pixelId);
      currentPixelId = pixelId;
      isInitialized = true;
      console.log(`%c[Meta Pixel Active ID] %c${pixelId}`, 'color: #008236; font-weight: bold;', 'color: #0284c7; font-weight: bold;');
    }
  } catch (err) {
    console.warn('[Meta Pixel] Initialization notice:', err);
  }
}

/**
 * Low-level event dispatcher with complete parameter passing for Meta Pixel Helper
 */
export function trackMetaEvent(
  eventName: string,
  params: Record<string, any> = {},
  options?: { eventID?: string }
): void {
  if (typeof window === 'undefined') return;

  // Deduplication check for unique server-synced events (e.g. Purchase)
  if (options?.eventID) {
    if (isEventProcessed(options.eventID)) {
      console.log(`[Meta Pixel] Skipped duplicate event: ${eventName} (eventID: ${options.eventID})`);
      return;
    }
    markEventProcessed(options.eventID);
  }

  // Ensure initialization
  if (!window.fbq) {
    initMetaPixel();
  }

  try {
    if (options?.eventID) {
      window.fbq('track', eventName, params, { eventID: options.eventID });
    } else {
      window.fbq('track', eventName, params);
    }

    console.log(
      `%c[Meta Pixel Event: ${eventName}]`,
      'color: #008236; font-weight: bold; background: #e6f4ea; padding: 2px 6px; border-radius: 4px;',
      {
        event: eventName,
        params,
        options,
        time: new Date().toLocaleTimeString(),
      }
    );
  } catch (err) {
    console.warn(`[Meta Pixel] Failed to track ${eventName}:`, err);
  }
}

/**
 * Custom Meta event dispatcher
 */
export function trackMetaCustomEvent(
  eventName: string,
  params: Record<string, any> = {},
  options?: { eventID?: string }
): void {
  if (typeof window === 'undefined') return;

  if (options?.eventID) {
    if (isEventProcessed(options.eventID)) {
      console.log(`[Meta Pixel] Skipped duplicate custom event: ${eventName} (eventID: ${options.eventID})`);
      return;
    }
    markEventProcessed(options.eventID);
  }

  if (!window.fbq) {
    initMetaPixel();
  }

  try {
    if (options?.eventID) {
      window.fbq('trackCustom', eventName, params, { eventID: options.eventID });
    } else {
      window.fbq('trackCustom', eventName, params);
    }

    console.log(
      `%c[Meta Pixel Custom Event: ${eventName}]`,
      'color: #0284c7; font-weight: bold; background: #e0f2fe; padding: 2px 6px; border-radius: 4px;',
      {
        event: eventName,
        params,
        options,
        time: new Date().toLocaleTimeString(),
      }
    );
  } catch (err) {
    console.warn(`[Meta Pixel] Failed to track custom event ${eventName}:`, err);
  }
}

// ----------------------------------------------------
// Standard Meta Ecommerce Event Handlers
// ----------------------------------------------------

/**
 * 1. PageView - Fire on route/view change with page metadata
 */
export function trackPageView(pageTitle?: string): void {
  if (typeof window === 'undefined') return;
  if (!window.fbq) initMetaPixel();

  try {
    window.fbq('track', 'PageView', {
      page_title: pageTitle || document.title || 'WEFTBD Premium Oxford Cotton Shirts',
      page_location: window.location.href,
      page_path: window.location.pathname,
    });
    console.log(
      '%c[Meta Pixel Event: PageView]',
      'color: #008236; font-weight: bold; background: #e6f4ea; padding: 2px 6px; border-radius: 4px;',
      {
        title: pageTitle || document.title,
        url: window.location.href,
      }
    );
  } catch (e) {
    // Ignore
  }
}

/**
 * 2. ViewContent - Fire when customer views a product or catalog item
 */
export function trackViewContent(params: {
  product: Product | { id: string; name: string; price: number; category?: string; originalPrice?: number };
  currency?: string;
}): void {
  const { product, currency = 'BDT' } = params;
  const numVal = Number(product.price) || 0;

  trackMetaEvent('ViewContent', {
    content_name: product.name,
    content_category: (product as any).category || 'Oxford Cotton Shirts',
    content_ids: [String(product.id)],
    content_type: 'product',
    value: numVal,
    currency,
    contents: [
      {
        id: String(product.id),
        quantity: 1,
        item_price: numVal,
        name: product.name,
      },
    ],
  });
}

/**
 * 3. Search - Fire when customer searches for products
 */
export function trackSearch(searchTerm: string): void {
  if (!searchTerm || !searchTerm.trim()) return;
  trackMetaEvent('Search', {
    search_string: searchTerm.trim(),
    content_type: 'product',
  });
}

/**
 * 4. AddToCart - Fire when item or size is selected/added
 */
export function trackAddToCart(params: {
  product: Product | { id: string; name: string; price: number; category?: string };
  quantity?: number;
  size?: string;
  currency?: string;
}): void {
  const { product, quantity = 1, size = 'L', currency = 'BDT' } = params;
  const unitPrice = Number(product.price) || 0;
  const totalValue = unitPrice * (quantity || 1);

  trackMetaEvent('AddToCart', {
    content_name: `${product.name}${size ? ` (${size})` : ''}`,
    content_category: (product as any).category || 'Oxford Cotton Shirts',
    content_ids: [String(product.id)],
    content_type: 'product',
    value: totalValue,
    currency,
    num_items: quantity,
    contents: [
      {
        id: String(product.id),
        quantity,
        item_price: unitPrice,
        size,
        name: product.name,
      },
    ],
  });
}

/**
 * 5. RemoveFromCart - Fire when user removes an item from cart
 */
export function trackRemoveFromCart(params: {
  product: Product | { id: string; name: string; price: number; category?: string };
  quantity?: number;
  size?: string;
  currency?: string;
}): void {
  const { product, quantity = 1, currency = 'BDT' } = params;
  const unitPrice = Number(product.price) || 0;

  trackMetaCustomEvent('RemoveFromCart', {
    content_ids: [String(product.id)],
    content_type: 'product',
    content_name: product.name,
    value: unitPrice * quantity,
    currency,
    quantity,
  });
}

/**
 * 6. ViewCart - Fire when user views their cart summary
 */
export function trackViewCart(params: {
  items: Array<{ productId: string; name?: string; price: number; quantity: number; size?: string }>;
  total: number;
  currency?: string;
}): void {
  const { items, total, currency = 'BDT' } = params;
  const totalVal = Number(total) || 0;

  trackMetaCustomEvent('ViewCart', {
    content_ids: items.map((i) => String(i.productId)),
    content_type: 'product',
    value: totalVal,
    currency,
    num_items: items.reduce((acc, it) => acc + (it.quantity || 1), 0),
    contents: items.map((it) => ({
      id: String(it.productId),
      quantity: it.quantity || 1,
      item_price: Number(it.price) || 0,
      size: it.size || 'L',
      name: it.name || 'Oxford Shirt',
    })),
  });
}

/**
 * 7. InitiateCheckout - Fire when user initiates checkout or focuses order form
 */
let lastCheckoutTimestamp = 0;
export function trackInitiateCheckout(params: {
  items: Array<{ productId: string; name?: string; price: number; quantity: number; size?: string }>;
  total: number;
  numItems?: number;
  currency?: string;
}): void {
  const now = Date.now();
  // Prevent duplicate rapid calls within 2.5 seconds
  if (now - lastCheckoutTimestamp < 2500) return;
  lastCheckoutTimestamp = now;

  const { items, total, currency = 'BDT' } = params;
  const numItems = params.numItems ?? items.reduce((acc, it) => acc + (it.quantity || 1), 0);
  const totalVal = Number(total) || 0;

  trackMetaEvent('InitiateCheckout', {
    content_name: items.length > 0 ? items.map((i) => i.name || 'Shirt').join(', ') : 'Oxford Shirt Single Page Checkout',
    content_category: 'Oxford Cotton Shirts',
    content_ids: items.map((i) => String(i.productId)),
    content_type: 'product',
    value: totalVal,
    currency,
    num_items: numItems,
    contents: items.map((it) => ({
      id: String(it.productId),
      quantity: it.quantity || 1,
      item_price: Number(it.price) || 0,
      size: it.size || 'L',
      name: it.name || 'Oxford Shirt',
    })),
  });
}

/**
 * 8. AddPaymentInfo - Fire when payment information (e.g. Cash on Delivery) is confirmed
 */
export function trackAddPaymentInfo(params: {
  items: Array<{ productId: string; name?: string; price: number; quantity: number; size?: string }>;
  total: number;
  paymentType?: string;
  currency?: string;
}): void {
  const { items, total, paymentType = 'Cash on Delivery (ক্যাশ অন ডেলিভারি)', currency = 'BDT' } = params;
  const totalVal = Number(total) || 0;

  trackMetaEvent('AddPaymentInfo', {
    content_name: 'Cash On Delivery Payment',
    content_category: 'Oxford Cotton Shirts',
    content_ids: items.map((i) => String(i.productId)),
    content_type: 'product',
    value: totalVal,
    currency,
    payment_type: paymentType,
    num_items: items.reduce((acc, it) => acc + (it.quantity || 1), 0),
    contents: items.map((it) => ({
      id: String(it.productId),
      quantity: it.quantity || 1,
      item_price: Number(it.price) || 0,
      size: it.size || 'L',
      name: it.name || 'Oxford Shirt',
    })),
  });
}

/**
 * 9. Purchase - Fire on successful order creation with deduplication eventID
 */
export function trackPurchase(order: Order, customEventId?: string): void {
  if (!order || !order.id) return;

  const eventId = customEventId || `purchase_${order.orderNumber || order.id}`;
  const totalItems = order.items.reduce((acc, it) => acc + (it.quantity || 1), 0);
  const totalValue = Number(order.total) || 0;

  const eventData = {
    content_name: order.items.map((it) => it.productName || 'Oxford Shirt').join(', '),
    content_category: 'Oxford Cotton Shirts',
    content_ids: order.items.map((it) => String(it.productId)),
    content_type: 'product',
    value: totalValue,
    currency: 'BDT',
    num_items: totalItems,
    order_id: order.orderNumber || order.id,
    payment_type: 'Cash on Delivery',
    contents: order.items.map((it) => ({
      id: String(it.productId),
      quantity: it.quantity || 1,
      item_price: Number(it.unitPrice) || 0,
      size: it.size || 'L',
      name: it.productName || 'Oxford Shirt',
    })),
  };

  trackMetaEvent('Purchase', eventData, { eventID: eventId });
}

/**
 * 10. Contact - Fire on WhatsApp, phone, or contact link clicks
 */
export function trackContact(params?: { method?: string; value?: number }): void {
  trackMetaEvent('Contact', {
    content_name: params?.method || 'WhatsApp Customer Support',
    content_category: 'Customer Service',
    value: params?.value || 0,
    currency: 'BDT',
  });
}

/**
 * 11. Lead - Fire on successful lead form / enquiry
 */
export function trackLead(params?: { content_name?: string; value?: number }): void {
  trackMetaEvent('Lead', {
    content_name: params?.content_name || 'Store Inquiry',
    value: params?.value || 0,
    currency: 'BDT',
  });
}

/**
 * 12. CompleteRegistration - Fire on registration
 */
export function trackCompleteRegistration(params?: { status?: boolean }): void {
  trackMetaEvent('CompleteRegistration', {
    status: params?.status ?? true,
  });
}

/**
 * 13. AddToWishlist - Fire on wishlist interaction
 */
export function trackAddToWishlist(params: {
  product: Product | { id: string; name: string; price: number };
  currency?: string;
}): void {
  const { product, currency = 'BDT' } = params;
  trackMetaCustomEvent('AddToWishlist', {
    content_ids: [product.id],
    content_type: 'product',
    content_name: product.name,
    value: product.price,
    currency,
  });
}

/**
 * Order Lifecycle Custom Events (for UI or client callbacks)
 */
export function trackOrderCreated(order: Order, eventId?: string): void {
  trackMetaCustomEvent(
    'OrderCreated',
    {
      order_id: order.orderNumber || order.id,
      value: order.total,
      currency: 'BDT',
      content_ids: order.items.map((it) => it.productId),
    },
    { eventID: eventId || `created_${order.id}` }
  );
}

export function trackOrderConfirmed(order: Order, eventId?: string): void {
  trackMetaCustomEvent(
    'OrderConfirmed',
    {
      order_id: order.orderNumber || order.id,
      value: order.total,
      currency: 'BDT',
      content_ids: order.items.map((it) => it.productId),
    },
    { eventID: eventId || `confirmed_${order.id}` }
  );
}

export function trackOrderCancelled(order: Order, eventId?: string): void {
  trackMetaCustomEvent(
    'OrderCancelled',
    {
      order_id: order.orderNumber || order.id,
      value: order.total,
      currency: 'BDT',
      content_ids: order.items.map((it) => it.productId),
    },
    { eventID: eventId || `cancel_${order.id}` }
  );
}

export function trackOrderDelivered(order: Order, eventId?: string): void {
  trackMetaCustomEvent(
    'OrderDelivered',
    {
      order_id: order.orderNumber || order.id,
      value: order.total,
      currency: 'BDT',
      content_ids: order.items.map((it) => it.productId),
    },
    { eventID: eventId || `delivered_${order.id}` }
  );
}

export function trackOrderRefunded(order: Order, eventId?: string): void {
  trackMetaCustomEvent(
    'OrderRefunded',
    {
      order_id: order.orderNumber || order.id,
      value: order.total,
      currency: 'BDT',
      content_ids: order.items.map((it) => it.productId),
    },
    { eventID: eventId || `refund_${order.id}` }
  );
}
