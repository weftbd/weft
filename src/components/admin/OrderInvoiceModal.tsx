import React from 'react';
import { Printer, Download, X } from 'lucide-react';
import { Order, StoreSettings } from '../../types';

interface OrderInvoiceModalProps {
  orders: Order[];
  storeSettings: StoreSettings;
  onClose: () => void;
}

export const OrderInvoiceModal: React.FC<OrderInvoiceModalProps> = ({
  orders,
  storeSettings,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  if (!orders || orders.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in print:p-0 print:bg-white print:static">
      {/* Top Action Bar (hidden in print) */}
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <Printer className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                {orders.length === 1 ? 'Customer Invoice' : `Bulk Invoices (${orders.length} Orders)`}
              </h3>
              <p className="text-[11px] text-slate-400">
                Ready for standard thermal / A4 printing or PDF saving
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#008236] hover:bg-[#00702e] text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print {orders.length > 1 ? 'All Invoices' : 'Invoice'}</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Container */}
        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar space-y-12 bg-slate-100 print:bg-white print:p-0 print:space-y-8 print:overflow-visible">
          {orders.map((order, orderIdx) => {
            return (
              <div
                key={order.id}
                className="bg-white p-8 sm:p-10 rounded-xl shadow-xs border border-slate-200 print:shadow-none print:border-none print:p-6 print:page-break-after"
                style={{ breakAfter: orderIdx < orders.length - 1 ? 'page' : 'auto' }}
              >
                {/* Header with Brand & Invoice Info */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-slate-200 pb-6">
                  {/* Left: Brand Identity & Contact Info */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#071426] px-3.5 py-1.5 rounded-lg inline-flex items-center justify-center shadow-xs">
                        <img
                          src="https://i.ibb.co.com/5hcdCy8k/Chat-GPT-Image-Aug-29-2026-01-41-24-PM.png"
                          alt={storeSettings?.storeName || 'WEFT'}
                          className="h-7 w-auto max-w-[90px] object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                          {storeSettings?.storeName || 'WEFT'}
                        </h2>
                        <p className="text-[10px] text-slate-500 font-semibold tracking-wide">
                          Premium Comfort Knitwear Bangladesh
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 space-y-0.5 font-medium">
                      <p>{storeSettings?.address || 'Road #11, Banani, Dhaka-1213, Bangladesh'}</p>
                      <p>
                        Hotline:{' '}
                        <strong className="text-slate-900">
                          {storeSettings?.phone || '+8801909999079'}
                        </strong>
                      </p>
                      <p>Email: {storeSettings?.email || 'weftbd247@gmail.com'}</p>
                    </div>
                  </div>

                  {/* Right: Invoice Meta & Status */}
                  <div className="sm:text-right flex flex-col sm:items-end space-y-1.5">
                    <div className="inline-block px-3 py-1 bg-emerald-50 border border-emerald-200 text-[#008236] font-bold text-xs rounded-full uppercase tracking-wider">
                      Cash on Delivery
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight pt-1">
                      INVOICE
                    </h1>
                    <div className="text-xs text-slate-600 space-y-1 pt-1">
                      <p>
                        Invoice No:{' '}
                        <strong className="text-slate-900 font-mono">{order.orderNumber}</strong>
                      </p>
                      <p>
                        Date:{' '}
                        <strong className="text-slate-800">
                          {new Date(order.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </strong>
                      </p>
                      <p className="flex items-center sm:justify-end gap-1.5">
                        <span>Status:</span>
                        <span className="font-bold text-slate-800 uppercase text-[10px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {order.orderStatus}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Customer Details & Shipping info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Billed & Delivered To:
                    </span>
                    <p className="text-base font-bold text-slate-900">{order.customer.name}</p>
                    <p className="font-bold text-[#008236] font-mono text-sm">
                      {order.customer.phone}
                    </p>
                    <p className="text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                      {order.customer.address}
                    </p>
                    <p className="text-slate-500 font-semibold">
                      Destination: {order.customer.city || 'Inside Dhaka'}
                    </p>
                  </div>

                  <div className="space-y-2 sm:text-right flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Payment & Dispatch:
                      </span>
                      <p className="font-bold text-slate-800 mt-1">
                        Method: {order.paymentMethod || 'Cash On Delivery'}
                      </p>
                      <p className="text-slate-600 text-[11px]">
                        Payment Status: <strong>{order.paymentStatus || 'PENDING'}</strong>
                      </p>
                    </div>

                    {order.customer.note && (
                      <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[11px] text-left sm:text-right mt-2">
                        <strong>Special Note:</strong> {order.customer.note}
                      </div>
                    )}
                  </div>
                </div>

                {/* Items Table */}
                <div className="py-6">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b-2 border-slate-800 text-slate-900 uppercase font-bold text-[10px] tracking-wider">
                        <th className="py-2.5">#</th>
                        <th className="py-2.5">Item Description</th>
                        <th className="py-2.5 text-center">Size</th>
                        <th className="py-2.5 text-center">Unit Price</th>
                        <th className="py-2.5 text-center">Qty</th>
                        <th className="py-2.5 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {order.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                          <td className="py-3 pr-2">
                            <div className="font-bold text-slate-900">{item.productName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              SKU: {item.productId}
                            </div>
                          </td>
                          <td className="py-3 text-center font-bold text-slate-800">
                            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                              {item.size}
                            </span>
                          </td>
                          <td className="py-3 text-center font-mono">৳{item.unitPrice}</td>
                          <td className="py-3 text-center font-bold text-slate-900">{item.quantity}</td>
                          <td className="py-3 text-right font-bold text-slate-900 font-mono">
                            ৳{item.subtotal}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals & Signatures */}
                <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row justify-between items-start gap-6">
                  <div className="text-xs text-slate-500 max-w-sm space-y-1">
                    <p className="font-bold text-slate-800">Thank you for choosing WEFT!</p>
                    <p className="text-[11px] leading-relaxed">
                      Please verify your products upon delivery. In case of size exchange or any
                      inquiry, contact our hotline within 48 hours.
                    </p>
                  </div>

                  <div className="w-full sm:w-64 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-mono font-medium">৳{order.subtotal}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Delivery Charge:</span>
                      <span className="font-mono font-medium">
                        {order.shipping === 0 ? '৳0 (Free Delivery)' : `৳${order.shipping}`}
                      </span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount:</span>
                        <span className="font-mono font-medium">-৳{order.discount}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t-2 border-slate-800">
                      <span>Total Payable:</span>
                      <span className="text-[#008236] font-mono">৳{order.total}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Signature Line for Delivery Confirmation */}
                <div className="hidden print:flex justify-between items-end pt-12 mt-6 border-t border-dashed border-slate-300 text-[10px] text-slate-500">
                  <div>
                    <div className="w-36 border-b border-slate-400 mb-1"></div>
                    <span>Customer Signature</span>
                  </div>
                  <div className="text-center font-bold text-slate-700">
                    WEFT Official Order Verification
                  </div>
                  <div className="text-right">
                    <div className="w-36 border-b border-slate-400 mb-1"></div>
                    <span>Authorized Signature</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
