import {
  HomepageSettings,
  Product,
  SizeChart,
  ShippingMethod,
  FAQItem,
  StoreSettings,
  FooterSettings,
} from '../types';

export const DEFAULT_HOMEPAGE: HomepageSettings = {
  hero: {
    enabled: true,
    badge: 'PREMIUM OXFORD COTTON',
    title: 'Experience Premium Comfort & Export Quality Shirts',
    subtitle: '১০০% পিওর কটন ফেব্রিক দিয়ে তৈরি প্রিমিয়াম এক্সপোর্ট কোয়ালিটি ফর্মাল ও ক্যাজুয়াল শার্ট। সারাদিন থাকুন আত্মবিশ্বাসী ও আরামদায়ক।',
    regularPrice: 1390,
    offerPrice: 990,
    offerLabel: 'Offer Price',
    deliveryText: 'যেকোনো ২ পিস বা তার অধিক শার্ট অর্ডার করলে ডেলিভারি চার্জ সম্পূর্ণ ফ্রি!',
    ctaText: 'এখনই অর্ডার করুন',
    customerCount: '৫০০+',
    customerText: 'সন্তুষ্ট গ্রাহক',
    image: {
      url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1200&auto=format&fit=crop',
      alt: 'WEFT Premium Oxford Cotton Shirts Hero Banner',
    },
  },
  promotionalImage: {
    url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1200&auto=format&fit=crop',
    alt: 'WEFT Premium Export Quality Cotton Shirt Details',
    badge: 'EXPORT QUALITY FABRIC',
    title: 'বিশুদ্ধ কটন আর নিখুঁত সেলাইয়ের প্রিমিয়াম ফিনিশিং',
  },
  styleSection: {
    title: 'Choose Your Style',
    subtitle: 'আপনার পছন্দের প্রিমিয়াম কালার সিলেক্ট করুন এবং এক ক্লিকে অর্ডার সম্পন্ন করুন',
    visible: true,
  },
  orderSection: {
    title: 'আপনার পছন্দের কালার ও সাইজ নির্বাচন করে অর্ডার করুন',
    subtitle: 'ক্যাশ অন ডেলিভারিতে সারাদেশে দ্রুততম হোম ডেলিভারি সুবিধা',
    buttonText: 'অর্ডার সম্পন্ন করুন',
  },
  trustSection: {
    title: 'কেন আপনি WEFT শার্ট পছন্দ করবেন?',
    items: [
      {
        icon: 'shield-check',
        title: '১০০% এক্সপোর্ট কোয়ালিটি',
        description: 'সর্বোচ্চ মানের পিওর প্রিমিয়াম অক্সফোর্ড কটন ফেব্রিক ও নিখুঁত ফিনিশিং।',
      },
      {
        icon: 'truck',
        title: 'সারাদেশে হোম ডেলিভারি',
        description: 'ঢাকা সিটির ভেতর ২৪-৪৮ ঘণ্টা এবং ঢাকার বাইরে ২-৩ দিনে দ্রুত ডেলিভারি।',
      },
      {
        icon: 'banknote',
        title: 'ক্যাশ অন ডেলিভারি',
        description: 'পণ্য হাতে পেয়ে কোয়ালিটি যাচাই করে মূল্য পরিশোধের সম্পূর্ণ সুবিধা।',
      },
      {
        icon: 'refresh-cw',
        title: 'সহজ সাইজ এক্সচেঞ্জ',
        description: 'সাইজে সমস্যা হলে কোনো জটিলতা ছাড়া ৭ দিনের মধ্যে সহজ এক্সচেঞ্জ গ্যারান্টি।',
      },
    ],
  },
};

export const DEFAULT_PRODUCTS: Product[] = [];

export const DEFAULT_SIZE_CHART: SizeChart = {
  title: 'SIZE CHART',
  columns: ['SIZE', 'CHEST (INCH)', 'LENGTH (INCH)', 'COLLAR (INCH)'],
  rows: [
    {
      size: 'S',
      values: ['40+', '29', '15'],
    },
    {
      size: 'M',
      values: ['42+', '30', '15.5'],
    },
    {
      size: 'L',
      values: ['44+', '31', '16'],
    },
    {
      size: 'XL',
      values: ['46+', '31', '16.5'],
    },
    {
      size: 'XXL',
      values: ['48+', '31.5', '17'],
    },
  ],
  note: '* European Measurement. Please check your size carefully before ordering.',
};

export const DEFAULT_SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: 'inside-dhaka',
    name: 'Inside Dhaka (ঢাকা সিটির ভেতরে)',
    charge: 70,
    active: true,
    estimatedTime: '24-48 Hours',
  },
  {
    id: 'outside-dhaka',
    name: 'Outside Dhaka (ঢাকা সিটির বাইরে)',
    charge: 130,
    active: true,
    estimatedTime: '2-3 Days',
  },
];

export const DEFAULT_FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'আমি কিভাবে অর্ডার সম্পন্ন করব?',
    answer:
      'খুবই সহজ! উপরে আপনার পছন্দের শার্টের কালার এবং সাইজ সিলেক্ট করুন। এরপর নিচের অর্ডার ফর্মে আপনার নাম, মোবাইল নাম্বার এবং সম্পূর্ণ ঠিকানা দিয়ে "অর্ডার সম্পন্ন করুন" বাটনে ক্লিক করুন।',
    sortOrder: 1,
    active: true,
  },
  {
    id: 'faq-2',
    question: 'শার্টের ফেব্রিক কোয়ালিটি কেমন?',
    answer:
      'WEFT শার্টগুলো ১০০% পিওর অক্সফোর্ড কটন ফেব্রিক দিয়ে তৈরি। এটি আরামদায়ক, প্রিমিয়াম এক্সপোর্ট কোয়ালিটির এবং কালার গ্যারান্টিযুক্ত।',
    sortOrder: 2,
    active: true,
  },
  {
    id: 'faq-3',
    question: 'ডেলিভারি চার্জ কত এবং ফ্রি ডেলিভারি কিভাবে পাব?',
    answer:
      'ঢাকা সিটির ভেতর ডেলিভারি চার্জ মাত্র ৭০ টাকা এবং ঢাকা সিটির বাইরে ১৩০ টাকা। তবে যেকোনো ২ পিস বা তার বেশি শার্ট অর্ডার করলেই ডেলিভারি চার্জ সম্পূর্ণ ফ্রি!',
    sortOrder: 3,
    active: true,
  },
  {
    id: 'faq-4',
    question: 'ক্যাশ অন ডেলিভারি সুবিধা আছে কি?',
    answer:
      'হ্যাঁ, আমরা সারাদেশে সম্পূর্ণ ক্যাশ অন ডেলিভারি (পণ্য হাতে পেয়ে টাকা পরিশোধ) সুবিধা প্রদান করি। অগ্রিম কোনো টাকা দিতে হবে না।',
    sortOrder: 4,
    active: true,
  },
  {
    id: 'faq-5',
    question: 'সাইজে সমস্যা হলে কি এক্সচেঞ্জ করা যাবে?',
    answer:
      'অবশ্যই! পার্সেল পাওয়ার পর সাইজে কোনো সমস্যা হলে ৭ দিনের মধ্যে আমাদের হেল্পলাইন বা হোয়াটসঅ্যাপে যোগাযোগ করে সহজে সাইজ পরিবর্তন করতে পারবেন।',
    sortOrder: 5,
    active: true,
  },
  {
    id: 'faq-6',
    question: 'ডেলিভারি পেতে কতদিন সময় লাগবে?',
    answer:
      'ঢাকা সিটির ভেতর সাধারণত ২৪ থেকে ৪৮ ঘণ্টার মধ্যে এবং ঢাকা সিটির বাইরে ২ থেকে ৩ কার্যদিবসের মধ্যে ডেলিভারি সম্পন্ন হয়।',
    sortOrder: 6,
    active: true,
  },
];

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'WEFT',
  orderPrefix: 'WEFT',
  phone: '+8801909999079',
  email: 'weftbd247@gmail.com',
  whatsapp: '+8801909999079',
  address: 'Road #11, Banani, Dhaka-1213, Bangladesh',
  facebook: 'https://facebook.com/weftfashionbd',
  instagram: 'https://instagram.com/weftfashionbd',
  tiktok: 'https://tiktok.com/@weftfashionbd',
  currency: '৳',
  freeShippingMinQty: 2,
  defaultShippingCharge: 70,
};

export const DEFAULT_FOOTER: FooterSettings = {
  brandDescription:
    'WEFT হলো আধুনিক লাইফস্টাইল ও প্রিমিয়াম ফ্যাশন ব্র্যান্ড। আমরা শতভাগ কোয়ালিটি সম্পন্ন এক্সপোর্ট অক্সফোর্ড কটন শার্ট সরবরাহ করি সাশ্রয়ী মূল্যে।',
  phone: '+8801909999079',
  email: 'weftbd247@gmail.com',
  whatsapp: '+8801909999079',
  address: 'House 42, Road 11, Block D, Banani, Dhaka-1213',
  facebook: 'https://facebook.com/weftfashionbd',
  instagram: 'https://instagram.com/weftfashionbd',
  tiktok: 'https://tiktok.com/@weftfashionbd',
  copyrightText: '© 2026 WEFT Bangladesh. All rights reserved.',
  quickLinks: [
    { label: 'হোম পেজ', url: '#top' },
    { label: 'কালার সিলেকশন', url: '#products' },
    { label: 'সাইজ চার্ট', url: '#size-chart' },
    { label: 'অর্ডার ফর্ম', url: '#order-form' },
    { label: 'কেন কিনবেন', url: '#trust' },
    { label: 'সাধারণ প্রশ্নোত্তর (FAQ)', url: '#faq' },
  ],
  supportLinks: [
    { label: 'ডেলিভারি পলিসি', url: '#faq' },
    { label: 'রিটার্ন ও এক্সচেঞ্জ পলিসি', url: '#faq' },
    { label: 'প্রাইভেসি পলিসি', url: '#faq' },
    { label: 'টার্মস অ্যান্ড কন্ডিশনস', url: '#faq' },
  ],
};
