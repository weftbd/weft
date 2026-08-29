import React, { useState, useRef } from 'react';
import {
  ShoppingCart,
  Plus,
  Minus,
  Check,
  Truck,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  Product,
  ShippingMethod,
  SelectedProductSelection,
  StoreSettings,
  Order,
} from '../../types';
import {
  validateBangladeshiPhone,
  submitOrder,
  CreateOrderPayload,
} from '../../services/orders';

interface OrderFormSectionProps {
  products: Product[];
  shippingMethods: ShippingMethod[];
  storeSettings?: StoreSettings;
  selectedItems: SelectedProductSelection[];
  onToggleProduct: (productId: string) => void;
  onUpdateSize: (productId: string, size: string) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onOrderSuccess: (order: Order) => void;
}

export const OrderFormSection: React.FC<OrderFormSectionProps> = ({
  products,
  shippingMethods,
  storeSettings,
  selectedItems,
  onToggleProduct,
  onUpdateSize,
  onUpdateQuantity,
  onOrderSuccess,
}) => {
  const activeProducts = products.filter((p) => p.active);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [note, setNote] = useState('');
  const [selectedShippingId, setSelectedShippingId] = useState<string>(
    shippingMethods[0]?.id || 'inside-dhaka'
  );

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Field error tracking for red highlight and shake
  const [fieldErrors, setFieldErrors] = useState<{
    products?: boolean;
    name?: boolean;
    phone?: boolean;
    address?: boolean;
  }>({});

  // Input & section refs for smooth auto-scrolling
  const productSectionRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLTextAreaElement>(null);

  // Validation helpers
  const isPhoneTouched = phone.length > 0;
  const isPhoneValid = validateBangladeshiPhone(phone);

  // Calculate live totals
  let subtotal = 0;
  let totalQty = 0;

  selectedItems.forEach((item) => {
    const prod = products.find((p) => p.id === item.productId);
    if (prod) {
      subtotal += prod.price * item.quantity;
      totalQty += item.quantity;
    }
  });

  const selectedShipping =
    shippingMethods.find((s) => s.id === selectedShippingId) || shippingMethods[0];
  const baseShippingCharge = selectedShipping ? selectedShipping.charge : 70;

  // Free shipping rule: 2 or more shirts = Free delivery
  const isFreeShipping = totalQty >= (storeSettings?.freeShippingMinQty ?? 2);
  const shippingCharge = isFreeShipping ? 0 : baseShippingCharge;
  const grandTotal = subtotal + shippingCharge;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    // 1. Validation: Product selection
    if (selectedItems.length === 0) {
      setFieldErrors({ products: true });
      setFormError('অনুগ্রহ করে পছন্দের অন্তত একটি শার্ট ও সাইজ সিলেক্ট করুন।');
      if (productSectionRef.current) {
        productSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // 2. Validation: Customer Name
    if (!name.trim()) {
      setFieldErrors({ name: true });
      setFormError('অনুগ্রহ করে আপনার পুরো নাম লিখুন।');
      if (nameInputRef.current) {
        nameInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        nameInputRef.current.focus();
      }
      return;
    }

    // 3. Validation: Phone Number
    if (!phone.trim() || !validateBangladeshiPhone(phone)) {
      setFieldErrors({ phone: true });
      setFormError('অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন (যেমন: 017XXXXXXXX)।');
      if (phoneInputRef.current) {
        phoneInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        phoneInputRef.current.focus();
      }
      return;
    }

    // 4. Validation: Full Delivery Address
    if (!address.trim()) {
      setFieldErrors({ address: true });
      setFormError('অনুগ্রহ করে আপনার সম্পূর্ণ ডেলিভারি ঠিকানা লিখুন।');
      if (addressInputRef.current) {
        addressInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        addressInputRef.current.focus();
      }
      return;
    }

    // Verify stock availability
    for (const sel of selectedItems) {
      const prod = products.find((p) => p.id === sel.productId);
      if (prod) {
        const available = prod.stock?.[sel.size] ?? 10;
        if (available < sel.quantity) {
          setFieldErrors({ products: true });
          setFormError(
            `${prod.name} (${sel.size} সাইজ) স্টকে পর্যাপ্ত নেই। অনুগ্রহ করে অন্য সাইজ অথবা কালার নির্বাচন করুন।`
          );
          if (productSectionRef.current) {
            productSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          return;
        }
      }
    }

    setSubmitting(true);

    const payload: CreateOrderPayload = {
      customer: {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim() || selectedShipping?.name || 'Dhaka',
        note: note.trim(),
      },
      items: selectedItems.map((it) => ({
        productId: it.productId,
        size: it.size,
        quantity: it.quantity,
      })),
      shippingMethodId: selectedShippingId,
    };

    try {
      const result = await submitOrder(payload);
      if (result.success && result.order) {
        onOrderSuccess(result.order);
      } else {
        setFormError(result.error || 'অর্ডার সম্পন্ন হতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
      }
    } catch (err: any) {
      console.error('Order submit error:', err);
      setFormError('নেটওয়ার্ক সমস্যা। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="order-form" className="py-8 sm:py-16 bg-white">
      <div className="max-w-6xl mx-auto px-3 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-6 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full bg-[#008236]/10 text-[#008236] text-[11px] sm:text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#008236]" />
            <span>Fast 1-Click Checkout</span>
          </div>
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-snug px-1">
            আপনার পছন্দের কালার ও সাইজ নির্বাচন করে অর্ডার করুন
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 font-normal max-w-xl mx-auto px-2">
            কোনো অগ্রিম পেমেন্ট নেই! পণ্য হাতে পেয়ে কোয়ালিটি দেখে সম্পূর্ণ ক্যাশ অন ডেলিভারিতে মূল্য পরিশোধ করুন।
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start">
            {/* LEFT COLUMN: SELECTED PRODUCTS & SIZE PICKER (7 cols) */}
            <div
              ref={productSectionRef}
              className={`lg:col-span-7 bg-white rounded-xl p-3.5 sm:p-6 border transition-all duration-300 shadow-sm space-y-4 sm:space-y-6 ${
                fieldErrors.products
                  ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/10 animate-shake'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 sm:pb-4">
                <h3 className="text-sm sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md text-white text-[11px] sm:text-xs flex items-center justify-center font-bold transition-colors ${
                      fieldErrors.products ? 'bg-rose-600' : 'bg-[#071426]'
                    }`}
                  >
                    ১
                  </span>
                  <span>শার্ট ও সাইজ সিলেক্ট করুন</span>
                  {fieldErrors.products && (
                    <span className="text-[11px] sm:text-xs text-rose-600 font-semibold">(১টি সিলেক্ট করুন)</span>
                  )}
                </h3>
                <span className="text-[11px] sm:text-xs font-semibold text-[#008236] bg-[#008236]/10 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md">
                  {selectedItems.length} টি সিলেক্টেড
                </span>
              </div>

              {/* Product list with selector checkboxes */}
              <div className="space-y-3">
                {activeProducts.length === 0 ? (
                  <div className="text-center py-8 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-sm font-semibold text-slate-700">বর্তমানে কোনো প্রোডাক্ট তালিকায় নেই</p>
                    <p className="text-xs text-slate-500 mt-1">অ্যাডমিন প্যানেল থেকে আপনার নিজস্ব প্রোডাক্ট যুক্ত করুন</p>
                  </div>
                ) : (
                  activeProducts.map((product) => {
                  const selection = selectedItems.find((s) => s.productId === product.id);
                  const isSelected = !!selection;
                  const currentSize = selection?.size || product.availableSizes[1] || 'L';
                  const currentQty = selection?.quantity || 1;

                  return (
                    <div
                      key={product.id}
                      onClick={(e) => {
                        // If not selected, clicking anywhere on the card selects it
                        if (!isSelected) {
                          onToggleProduct(product.id);
                        }
                      }}
                      className={`p-3 sm:p-4 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-[#008236] bg-[#008236]/5 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-[#008236]/50 hover:bg-slate-50/50 cursor-pointer'
                      }`}
                    >
                      {/* Top Row: Checkbox, Thumbnail, and Centered Title & Price */}
                      <div className="flex items-center gap-2.5 sm:gap-3.5">
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleProduct(product.id);
                          }}
                          aria-label={`Select ${product.name}`}
                          className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#008236] text-white shadow-xs'
                              : 'bg-white border-2 border-slate-300 hover:border-[#008236]'
                          }`}
                        >
                          {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                        </button>

                        {/* Thumbnail */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleProduct(product.id);
                          }}
                          className="w-14 h-16 sm:w-16 sm:h-20 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200 cursor-pointer"
                        >
                          <img
                            src={product.image.url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>

                        {/* Product Title & Price - Vertically Centered */}
                        <div className="grow min-w-0 flex items-center justify-between gap-2">
                          <h4 className="font-bold text-xs sm:text-base text-slate-900 hover:text-[#008236] truncate">
                            {product.name}
                          </h4>
                          <div className="text-right shrink-0">
                            <span className="font-bold text-xs sm:text-base text-slate-900">
                              ৳{product.price}
                            </span>
                            {product.originalPrice > product.price && (
                              <span className="ml-1 text-[10px] sm:text-xs text-slate-400 line-through">
                                ৳{product.originalPrice}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Size Selection & Quantity (Shown when selected) */}
                      {isSelected && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2"
                        >
                          {/* Sizes */}
                          <div>
                            <label className="block text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                              সাইজ:
                            </label>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {product.availableSizes.map((size) => {
                                const stockQty = product.stock?.[size] ?? 10;
                                const isOut = stockQty <= 0;
                                const isChosen = currentSize === size;

                                return (
                                  <button
                                    key={size}
                                    type="button"
                                    disabled={isOut}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onUpdateSize(product.id, size);
                                    }}
                                    className={`min-w-9 h-8 sm:min-w-8 sm:h-7 px-2.5 sm:px-2 rounded-lg sm:rounded-md text-xs font-bold transition-all cursor-pointer ${
                                      isChosen
                                        ? 'bg-[#008236] text-white shadow-xs'
                                        : isOut
                                        ? 'bg-slate-100 text-slate-300 line-through cursor-not-allowed'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95'
                                    }`}
                                  >
                                    {size}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Quantity Stepper */}
                          <div>
                            <label className="block text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 text-right sm:text-left">
                              পরিমাণ:
                            </label>
                            <div className="inline-flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateQuantity(product.id, -1);
                                }}
                                aria-label="Decrease quantity"
                                className="w-7 h-7 sm:w-6 sm:h-6 rounded-md bg-white shadow-xs flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-90 cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                              </button>
                              <span className="w-7 text-center font-bold text-xs sm:text-sm text-slate-900">
                                {currentQty}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateQuantity(product.id, 1);
                                }}
                                aria-label="Increase quantity"
                                className="w-7 h-7 sm:w-6 sm:h-6 rounded-md bg-white shadow-xs flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-90 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              </div>

              {/* Free delivery prompt banner inside selection box */}
              {!isFreeShipping && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="leading-tight">
                    আরেকটি শার্ট যোগ করলেই ডেলিভারি চার্জ সম্পূর্ণ ফ্রি হয়ে যাবে!
                  </span>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: CUSTOMER DETAILS & ORDER SUMMARY (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-xl p-3.5 sm:p-6 border border-slate-200 shadow-sm space-y-4 sm:space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 sm:pb-4">
                <h3 className="text-sm sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#071426] text-white text-[11px] sm:text-xs flex items-center justify-center font-bold">
                    ২
                  </span>
                  <span>ডেলিভারি তথ্য দিন</span>
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-[#008236] bg-[#008236]/10 px-2 py-0.5 rounded-md">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#008236]" />
                  ক্যাশ অন ডেলিভারি
                </span>
              </div>

              {/* Form Fields */}
              <div className="space-y-3.5">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>
                      আপনার নাম লিখুন <span className="text-rose-500">*</span>
                    </span>
                    {fieldErrors.name && (
                      <span className="text-rose-600 text-[11px] font-medium animate-pulse">নাম প্রয়োজন</span>
                    )}
                  </label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    required
                    value={name || ''}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: false }));
                    }}
                    placeholder="যেমন: তানভীর আহমেদ"
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-xs sm:text-sm font-medium text-slate-900 focus:outline-none transition-all ${
                      fieldErrors.name
                        ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/40 animate-shake'
                        : 'border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#008236]'
                    }`}
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex justify-between items-center">
                    <span>
                      আপনার মোবাইল নাম্বার লিখুন <span className="text-rose-500">*</span>
                    </span>
                    <span className="text-[11px] font-normal text-slate-400">১১ ডিজিট</span>
                  </label>
                  <input
                    ref={phoneInputRef}
                    type="tel"
                    required
                    value={phone || ''}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: false }));
                    }}
                    placeholder="017XXXXXXXX"
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-xs sm:text-sm font-medium text-slate-900 focus:outline-none transition-all ${
                      fieldErrors.phone
                        ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/40 animate-shake'
                        : isPhoneTouched && !isPhoneValid
                        ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500'
                        : isPhoneValid
                        ? 'border-[#008236]/60 bg-[#008236]/5 focus:border-[#008236]'
                        : 'border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#008236]'
                    }`}
                  />
                  {(fieldErrors.phone || (isPhoneTouched && !isPhoneValid)) && (
                    <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন (যেমন: 017XXXXXXXX)</span>
                    </p>
                  )}
                </div>

                {/* Full Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>
                      আপনার সম্পূর্ণ ডেলিভারি ঠিকানা লিখুন <span className="text-rose-500">*</span>
                    </span>
                    {fieldErrors.address && (
                      <span className="text-rose-600 text-[11px] font-medium animate-pulse">ঠিকানা প্রয়োজন</span>
                    )}
                  </label>
                  <textarea
                    ref={addressInputRef}
                    required
                    rows={2}
                    value={address || ''}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      if (fieldErrors.address) setFieldErrors((prev) => ({ ...prev, address: false }));
                    }}
                    placeholder="বাসা/হোল্ডিং নং, রোড নং, এলাকা, থানা/উপজেলা ও জেলা"
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-xs sm:text-sm font-medium text-slate-900 focus:outline-none transition-all resize-none ${
                      fieldErrors.address
                        ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/40 animate-shake'
                        : 'border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#008236]'
                    }`}
                  />
                </div>

                {/* Delivery Location Radios */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ডেলিভারি এলাকা সিলেক্ট করুন <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {shippingMethods.map((ship) => {
                      const isChosen = selectedShippingId === ship.id;
                      return (
                        <div
                          key={ship.id}
                          onClick={() => setSelectedShippingId(ship.id)}
                          className={`p-2.5 sm:p-3 rounded-lg border cursor-pointer transition-all flex flex-col justify-between active:scale-98 ${
                            isChosen
                              ? 'border-[#008236] bg-[#008236]/5 shadow-xs'
                              : 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold text-xs text-slate-900 truncate">
                              {ship.name.split('(')[0]}
                            </span>
                            <div
                              className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                isChosen ? 'border-[#008236] bg-[#008236]' : 'border-slate-300'
                              }`}
                            >
                              {isChosen && <div className="w-1 h-1 rounded-full bg-white" />}
                            </div>
                          </div>
                          <div className="mt-1 flex items-baseline justify-between gap-1">
                            <span className="text-[10px] sm:text-[11px] text-slate-500">
                              {ship.estimatedTime || 'ডেলিভারি'}
                            </span>
                            <span className="font-bold text-xs text-slate-900">
                              {isFreeShipping ? (
                                <span className="text-[#008236] font-bold">ফ্রি</span>
                              ) : (
                                `৳${ship.charge}`
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Optional Note */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    বিশেষ নির্দেশনা (অপশনাল)
                  </label>
                  <input
                    type="text"
                    value={note || ''}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="যেমন: বিকাল ৫টার পর ডেলিভারি দিবেন"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#008236] focus:outline-none text-xs sm:text-sm font-medium text-slate-900"
                  />
                </div>
              </div>

              {/* Order Breakdown Calculation */}
              <div className="bg-slate-50 rounded-xl p-3.5 sm:p-4 border border-slate-200 space-y-1.5 sm:space-y-2">
                <div className="flex justify-between text-xs font-medium text-slate-600">
                  <span>মোট শার্টের মূল্য ({totalQty} পিস):</span>
                  <span className="font-bold text-slate-900">৳{subtotal}</span>
                </div>
                <div className="flex justify-between text-xs font-medium text-slate-600">
                  <span>ডেলিভারি চার্জ:</span>
                  {isFreeShipping ? (
                    <span className="font-bold text-[#008236] bg-[#008236]/15 px-2 py-0.5 rounded-md text-[11px]">
                      ফ্রি ডেলিভারি
                    </span>
                  ) : (
                    <span className="font-bold text-slate-900">৳{shippingCharge}</span>
                  )}
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline text-slate-900">
                  <span className="text-xs sm:text-sm font-bold">সর্বমোট প্রদেয়:</span>
                  <span className="text-lg sm:text-xl font-bold text-[#008236]">৳{grandTotal}</span>
                </div>
              </div>

              {/* Error banner */}
              {formError && (
                <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Irresistibly Animated 1-Click Order Confirmation Button */}
              <div className="relative group/btn pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="relative overflow-hidden w-full py-3.5 sm:py-4 px-4 sm:px-5 rounded-xl bg-gradient-to-r from-[#008236] via-[#009b40] to-[#008236] hover:from-[#006e2e] hover:to-[#005a26] active:scale-[0.98] text-white font-extrabold text-base sm:text-lg shadow-lg shadow-[#008236]/35 hover:shadow-xl hover:shadow-[#008236]/50 transition-all duration-300 flex items-center justify-between cursor-pointer animate-order-pulse"
                >
                  {/* Glossy Light Shimmer Sweep Effect */}
                  <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/35 to-transparent animate-shimmer pointer-events-none" />

                  {submitting ? (
                    <div className="w-full flex items-center justify-center gap-2">
                      <Clock className="w-5 h-5 animate-spin" />
                      <span>অর্ডার প্রসেস হচ্ছে...</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0 shadow-inner group-hover/btn:rotate-6 transition-transform">
                        <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <div className="flex-1 text-center px-1 sm:px-2">
                        <span className="block tracking-tight text-white drop-shadow-sm text-sm sm:text-base font-extrabold leading-tight">
                          অর্ডার সম্পন্ন করুন <br /> ৳{grandTotal}
                        </span>
                      </div>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center shrink-0">
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover/btn:translate-x-1 transition-transform" />
                      </div>
                    </>
                  )}
                </button>
              </div>

              <div className="text-center">
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#008236] shrink-0" />
                  <span>সম্পূর্ণ ক্যাশ অন ডেলিভারি | ৭ দিনে সহজ সাইজ এক্সচেঞ্জ সুবিধা</span>
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
};
