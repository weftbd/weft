export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image: {
    url: string;
    alt?: string;
    thumbnailUrl?: string;
  };
  price: number;
  originalPrice: number;
  discountAmount: number;
  active: boolean;
  featured: boolean;
  availableSizes: string[];
  stock: Record<string, number>;
  sortOrder: number;
  colorHex?: string;
  badge?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  image: string;
  size: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
  city: string;
  note?: string;
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED';

export interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
  shippingMethodId?: string;
}

export interface HeroSettings {
  enabled: boolean;
  badge: string;
  title: string;
  subtitle?: string;
  regularPrice: number;
  offerPrice: number;
  offerLabel: string;
  deliveryText: string;
  ctaText: string;
  customerCount: string;
  customerText: string;
  image: {
    url: string;
    alt: string;
  };
}

export interface TrustItem {
  icon: 'shield-check' | 'truck' | 'banknote' | 'refresh-cw' | string;
  title: string;
  description: string;
}

export interface HomepageSettings {
  hero: HeroSettings;
  promotionalImage: {
    url: string;
    alt: string;
    badge?: string;
    title?: string;
  };
  styleSection: {
    title: string;
    subtitle: string;
    visible: boolean;
  };
  orderSection: {
    title: string;
    subtitle: string;
    buttonText: string;
  };
  trustSection: {
    title?: string;
    items: TrustItem[];
  };
}

export interface SizeChartRow {
  size: string;
  values: string[];
}

export interface SizeChart {
  title: string;
  columns: string[];
  rows: SizeChartRow[];
  note: string;
}

export interface ShippingMethod {
  id: string;
  name: string;
  charge: number;
  active: boolean;
  estimatedTime?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  active: boolean;
}

export interface StoreSettings {
  storeName: string;
  orderPrefix: string;
  phone: string;
  email: string;
  whatsapp: string;
  address: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  currency: string;
  freeShippingMinQty: number;
  defaultShippingCharge: number;
  metaPixelId?: string;
  metaCapiToken?: string;
  metaTestEventCode?: string;
  metaTrackingEnabled?: boolean;
}

export interface FooterSettings {
  brandDescription: string;
  phone: string;
  email: string;
  whatsapp: string;
  address: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  copyrightText: string;
  quickLinks: { label: string; url: string }[];
  supportLinks: { label: string; url: string }[];
}

export interface SelectedProductSelection {
  productId: string;
  size: string;
  quantity: number;
}
