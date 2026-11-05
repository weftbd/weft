import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, ShoppingBag, AlertCircle } from 'lucide-react';
import { Order, OrderItem, Product, ShippingMethod, StoreSettings } from '../../types';
import { updateOrderDetails } from '../../services/orders';

interface OrderEditModalProps {
  order: Order;
  products: Product[];
  shippingMethods: ShippingMethod[];
  storeSettings: StoreSettings;
  onClose: () => void;
  onOrderSaved: () => void;
}

export const OrderEditModal: React.FC<OrderEditModalProps> = ({
  order,
  products,
  shippingMethods,
  storeSettings,
  onClose,
  onOrderSaved,
}) => {
  const [customerName, setCustomerName] = useState(order.customer.name || '');
  const [customerPhone, setCustomerPhone] = useState(order.customer.phone || '');
  const [customerAddress, setCustomerAddress] = useState(order.customer.address || '');
  const [customerCity, setCustomerCity] = useState(order.customer.city || 'Inside Dhaka');
  const [customerNote, setCustomerNote] = useState(order.customer.note || '');

  const [items, setItems] = useState<OrderItem[]>(order.items || []);
  const [shippingMethodId, setShippingMethodId] = useState<string>(
    order.shippingMethodId || shippingMethods[0]?.id || ''
  );
  const [customShippingCharge, setCustomShippingCharge] = useState<number>(order.shipping);
  const [manualShippingOverride, setManualShippingOverride] = useState<boolean>(false);
  const [discount, setDiscount] = useState<number>(order.discount || 0);

  const [selectedNewProductId, setSelectedNewProductId] = useState<string>(products[0]?.id || '');
  const [selectedNewSize, setSelectedNewSize] = useState<string>('L');

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Calculate totals
  const subtotal = items.reduce((sum, it) => sum + (it.subtotal || it.unitPrice * it.quantity), 0);
  const totalQuantity = items.reduce((sum, it) => sum + it.quantity, 0);

  // Auto calculate shipping unless manually overridden
  const effectiveShipping = React.useMemo(() => {
    if (manualShippingOverride) return customShippingCharge;
    const freeMin = storeSettings?.freeShippingMinQty ?? 2;
    if (totalQuantity >= freeMin) return 0;
    const method = shippingMethods.find((s) => s.id === shippingMethodId);
    return method ? method.charge : (storeSettings?.defaultShippingCharge ?? 70);
  }, [manualShippingOverride, customShippingCharge, totalQuantity, shippingMethodId, shippingMethods, storeSettings]);

  const total = Math.max(0, subtotal + effectiveShipping - discount);

  // When changing item size
  const handleItemSizeChange = (index: number, newSize: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], size: newSize };
    setItems(updated);
  };

  // When changing item quantity
  const handleItemQuantityChange = (index: number, newQty: number) => {
    if (newQty < 1) return;
    const updated = [...items];
    const unitPrice = updated[index].unitPrice;
    updated[index] = {
      ...updated[index],
      quantity: newQty,
      subtotal: unitPrice * newQty,
    };
    setItems(updated);
  };

  // When switching product in an existing row
  const handleItemProductChange = (index: number, newProductId: string) => {
    const targetProduct = products.find((p) => p.id === newProductId);
    if (!targetProduct) return;
    const updated = [...items];
    const defaultSize = targetProduct.availableSizes[1] || targetProduct.availableSizes[0] || 'L';
    const unitPrice = targetProduct.price;
    const qty = updated[index].quantity || 1;

    updated[index] = {
      productId: targetProduct.id,
      productName: targetProduct.name,
      image: targetProduct.image?.url || '',
      size: defaultSize,
      quantity: qty,
      unitPrice: unitPrice,
      subtotal: unitPrice * qty,
    };
    setItems(updated);
  };

  // Remove item
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      setErrorMessage('অর্ডারে অন্তত একটি পণ্য থাকতে হবে।');
      return;
    }
    setErrorMessage(null);
    setItems(items.filter((_, idx) => idx !== index));
  };

  // Add new item to order
  const handleAddNewItem = () => {
    const prod = products.find((p) => p.id === selectedNewProductId);
    if (!prod) return;

    const unitPrice = prod.price;
    const newItem: OrderItem = {
      productId: prod.id,
      productName: prod.name,
      image: prod.image?.url || '',
      size: selectedNewSize || prod.availableSizes[0] || 'L',
      quantity: 1,
      unitPrice: unitPrice,
      subtotal: unitPrice,
    };

    setItems([...items, newItem]);
    setErrorMessage(null);
  };

  const handleSaveOrder = async () => {
    if (!customerName.trim()) {
      setErrorMessage('Customer name cannot be empty');
      return;
    }
    if (!customerPhone.trim()) {
      setErrorMessage('Phone number cannot be empty');
      return;
    }
    if (items.length === 0) {
      setErrorMessage('Order must have at least one product');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const updatedOrderData: Order = {
        ...order,
        customer: {
          name: customerName.trim(),
          phone: customerPhone.trim(),
          address: customerAddress.trim(),
          city: customerCity.trim(),
          note: customerNote.trim(),
        },
        items: items,
        subtotal: subtotal,
        shipping: effectiveShipping,
        discount: discount,
        total: total,
        shippingMethodId: shippingMethodId,
        updatedAt: new Date().toISOString(),
        statusHistory: [
          ...(order.statusHistory || []),
          {
            status: order.orderStatus,
            timestamp: new Date().toISOString(),
            note: 'Order details modified by Admin (Items/Shipping/Customer info adjusted)',
          },
        ],
      };

      await updateOrderDetails(updatedOrderData);
      onOrderSaved();
      onClose();
    } catch (err) {
      console.error('Failed to update order:', err);
      setErrorMessage('Failed to save order modifications. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800 shrink-0">
          <div>
            <span className="text-xs font-semibold text-emerald-400">Edit Customer Order</span>
            <h3 className="font-mono text-lg font-bold">
              {order.orderNumber}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Customer Information Edit */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              1. Customer Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#008236]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Phone Number *
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#008236]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Delivery Address *
                </label>
                <textarea
                  rows={2}
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full text-xs font-medium p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#008236]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  City / Area
                </label>
                <input
                  type="text"
                  value={customerCity}
                  onChange={(e) => setCustomerCity(e.target.value)}
                  className="w-full text-xs font-medium p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#008236]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Internal / Customer Note
                </label>
                <input
                  type="text"
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder="e.g. Call before delivery / change size"
                  className="w-full text-xs font-medium p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#008236]"
                />
              </div>
            </div>
          </div>

          {/* Ordered Products Management */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                2. Ordered Items ({items.length})
              </h4>
              <span className="text-[11px] text-slate-500">
                Change shirt color/article, adjust sizes, or edit quantities
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden bg-white shadow-xs">
              {items.map((item, idx) => {
                const currentProd = products.find((p) => p.id === item.productId);
                const availableSizes = currentProd?.availableSizes || ['M', 'L', 'XL', 'XXL'];

                return (
                  <div key={idx} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50/60 transition-colors">
                    {/* Product Selector */}
                    <div className="flex items-center gap-3 min-w-[220px]">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.productName}
                          className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                      )}
                      <div className="space-y-1">
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemProductChange(idx, e.target.value)}
                          className="text-xs font-bold text-slate-900 border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:border-[#008236] max-w-[190px]"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (৳{p.price})
                            </option>
                          ))}
                        </select>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Unit: ৳{item.unitPrice}
                        </div>
                      </div>
                    </div>

                    {/* Size & Quantity Controllers */}
                    <div className="flex items-center gap-3">
                      {/* Size Selector */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Size</span>
                        <select
                          value={item.size}
                          onChange={(e) => handleItemSizeChange(idx, e.target.value)}
                          className="text-xs font-bold px-2 py-1 rounded border border-slate-300 bg-white focus:outline-none focus:border-[#008236]"
                        >
                          {availableSizes.map((sz) => (
                            <option key={sz} value={sz}>
                              {sz}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity Selector */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Qty</span>
                        <div className="flex items-center border border-slate-300 rounded overflow-hidden">
                          <button
                            type="button"
                            onClick={() => handleItemQuantityChange(idx, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-xs font-bold disabled:opacity-40 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-2.5 py-1 text-xs font-bold text-slate-800 bg-white">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleItemQuantityChange(idx, item.quantity + 1)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-xs font-bold cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Line Subtotal */}
                      <div className="text-right min-w-[70px]">
                        <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Total</span>
                        <span className="text-xs font-bold text-slate-900 font-mono">
                          ৳{item.subtotal}
                        </span>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 cursor-pointer transition-colors"
                        title="Remove product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add New Product Row */}
            <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <select
                  value={selectedNewProductId}
                  onChange={(e) => {
                    setSelectedNewProductId(e.target.value);
                    const p = products.find((prod) => prod.id === e.target.value);
                    if (p) setSelectedNewSize(p.availableSizes[0] || 'L');
                  }}
                  className="text-xs font-medium p-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (৳{p.price})
                    </option>
                  ))}
                </select>

                <select
                  value={selectedNewSize}
                  onChange={(e) => setSelectedNewSize(e.target.value)}
                  className="text-xs font-bold p-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none"
                >
                  {(products.find((p) => p.id === selectedNewProductId)?.availableSizes || ['M', 'L', 'XL', 'XXL']).map(
                    (s) => (
                      <option key={s} value={s}>
                        Size {s}
                      </option>
                    )
                  )}
                </select>
              </div>

              <button
                type="button"
                onClick={handleAddNewItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item to Order</span>
              </button>
            </div>
          </div>

          {/* Shipping & Discount Adjustments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                3. Shipping & Delivery
              </h4>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Shipping Method
                </label>
                <select
                  value={shippingMethodId}
                  onChange={(e) => {
                    setShippingMethodId(e.target.value);
                    setManualShippingOverride(false);
                  }}
                  className="w-full text-xs font-medium p-2 rounded-lg border border-slate-300 bg-white focus:outline-none"
                >
                  {shippingMethods.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (৳{m.charge})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="overrideShipping"
                  checked={manualShippingOverride}
                  onChange={(e) => setManualShippingOverride(e.target.checked)}
                  className="rounded text-[#008236] focus:ring-[#008236] cursor-pointer"
                />
                <label htmlFor="overrideShipping" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Manual Delivery Fee Override
                </label>
              </div>

              {manualShippingOverride && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Custom Delivery Fee (৳)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={customShippingCharge}
                    onChange={(e) => setCustomShippingCharge(Number(e.target.value))}
                    className="w-32 text-xs font-bold p-2 rounded-lg border border-slate-300 bg-white focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Price Calculations */}
            <div className="space-y-2 border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                4. Recalculated Order Total
              </h4>
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal ({totalQuantity} pcs):</span>
                <span className="font-mono font-medium">৳{subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Charge:</span>
                <span className="font-mono font-medium">
                  {effectiveShipping === 0 ? '৳0 (Free)' : `৳${effectiveShipping}`}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-slate-600">Discount (৳):</span>
                <input
                  type="number"
                  min={0}
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-24 text-right text-xs font-bold p-1 rounded border border-slate-300 bg-white focus:outline-none font-mono"
                />
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-300">
                <span>New Total:</span>
                <span className="text-[#008236] font-mono text-base">৳{total}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveOrder}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#008236] hover:bg-[#00702e] text-white text-xs font-bold shadow-md cursor-pointer transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save & Update Order'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
