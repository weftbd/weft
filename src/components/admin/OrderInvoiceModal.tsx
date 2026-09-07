import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  X,
  FileText,
  Scissors,
  CheckSquare,
  Square,
  Layers,
  Info,
  ExternalLink,
} from 'lucide-react';
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
  // Track which orders among the passed ones are active for printing
  const [activeOrderIds, setActiveOrderIds] = useState<string[]>(() =>
    orders.map((o) => o.id)
  );

  // Layout mode: 'two-per-a4' (half A4 compact, 2 invoices per sheet) or 'one-per-page' (1 invoice per page)
  const [layoutMode, setLayoutMode] = useState<'two-per-a4' | 'one-per-page'>('two-per-a4');

  // Activate print body class when modal is mounted
  useEffect(() => {
    document.body.classList.add('printing-invoices-active');
    return () => {
      document.body.classList.remove('printing-invoices-active');
    };
  }, []);

  // Filter only selected orders
  const printableOrders = useMemo(() => {
    return orders.filter((o) => activeOrderIds.includes(o.id));
  }, [orders, activeOrderIds]);

  // Group orders into pairs for 2-invoices-per-A4 printing
  const orderPages = useMemo(() => {
    if (layoutMode === 'one-per-page') {
      return printableOrders.map((ord) => [ord]);
    }
    const pages: Order[][] = [];
    for (let i = 0; i < printableOrders.length; i += 2) {
      const pair: Order[] = [printableOrders[i]];
      if (i + 1 < printableOrders.length) {
        pair.push(printableOrders[i + 1]);
      }
      pages.push(pair);
    }
    return pages;
  }, [printableOrders, layoutMode]);

  const handlePrint = () => {
    document.body.classList.add('printing-invoices-active');
    setTimeout(() => {
      window.print();
    }, 60);
  };

  const handleOpenPrintWindow = () => {
    const printArea = document.getElementById('printable-invoices-container');
    if (!printArea) {
      handlePrint();
      return;
    }

    const printWin = window.open('', '_blank', 'width=950,height=900');
    if (!printWin) {
      handlePrint();
      return;
    }

    const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((node) => node.outerHTML)
      .join('\n');

    printWin.document.open();
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>WEFT Invoices (${printableOrders.length})</title>
          ${stylesheets}
          <style>
            @page {
              size: A4 portrait;
              margin: 5mm 6mm;
            }
            html, body {
              background: #ffffff !important;
              color: #000000 !important;
              margin: 0 !important;
              padding: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print {
              display: none !important;
            }
            .a4-print-page {
              width: 100% !important;
              max-width: 198mm !important;
              height: auto !important;
              min-height: auto !important;
              box-sizing: border-box !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: flex-start !important;
              background: #ffffff !important;
              padding: 0 !important;
              margin: 0 auto 4mm auto !important;
            }
            .a4-page-break {
              page-break-after: always !important;
              break-after: page !important;
              height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              display: block !important;
            }
            .half-a4-slip {
              width: 100% !important;
              height: 130mm !important;
              max-height: 132mm !important;
              min-height: 125mm !important;
              box-sizing: border-box !important;
              border: 1px dashed #64748b !important;
              border-radius: 2mm !important;
              padding: 3mm 4mm !important;
              background: #ffffff !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
            }
            .half-a4-cut-separator {
              display: flex !important;
              height: 5mm !important;
              margin: 1.5mm 0 !important;
              align-items: center !important;
              justify-content: center !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              text-align: center !important;
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="padding: 10px 16px; background: #0f172a; color: white; display: flex; justify-content: space-between; align-items: center; font-family: sans-serif;">
            <span style="font-size: 13px; font-weight: bold;">WEFT Invoices — Dedicated Print Window</span>
            <button onclick="window.print()" style="background: #008236; color: white; border: none; padding: 6px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px;">
              Print Now
            </button>
          </div>
          <div style="padding: 10px;">
            ${printArea.innerHTML}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const toggleOrderSelection = (orderId: string) => {
    setActiveOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const selectAll = () => {
    setActiveOrderIds(orders.map((o) => o.id));
  };

  const deselectAll = () => {
    setActiveOrderIds([]);
  };

  if (!orders || orders.length === 0) return null;

  return createPortal(
    <div
      id="invoice-modal-portal"
      className="invoice-modal-wrapper fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-fade-in"
    >
      <div className="invoice-modal-dialog bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[95vh]">
        {/* Top Control Bar (Never printed) */}
        <div className="no-print bg-slate-900 text-white px-4 sm:px-6 py-3.5 border-b border-slate-800 shrink-0 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#008236]/20 border border-[#008236]/40 flex items-center justify-center text-[#008236]">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base leading-tight flex items-center gap-2">
                  <span>
                    {printableOrders.length === 1
                      ? 'Invoice Slip (Half A4)'
                      : `Bulk Invoices (${printableOrders.length} Selected)`}
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#008236] text-white font-bold">
                    {orderPages.length} A4 {orderPages.length === 1 ? 'Page' : 'Pages'}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Each invoice is strictly formatted as half of an A4 page (A5 size)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                disabled={printableOrders.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#008236] hover:bg-[#00702e] text-white text-xs font-bold shadow-md cursor-pointer transition-all disabled:opacity-50"
                title="Print invoices directly"
              >
                <Printer className="w-4 h-4" />
                <span>
                  Print {printableOrders.length} {printableOrders.length === 1 ? 'Invoice' : 'Invoices'}
                </span>
              </button>

              <button
                onClick={handleOpenPrintWindow}
                disabled={printableOrders.length === 0}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors border border-slate-700 disabled:opacity-50"
                title="Open invoices in a clean separate window to print"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                <span>Open in Clean Tab</span>
              </button>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub-toolbar: Layout Switcher & Order Selector */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
            {/* Layout switch */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-lg">
              <span className="text-slate-400 text-[11px] px-2 font-medium">Layout:</span>
              <button
                type="button"
                onClick={() => setLayoutMode('two-per-a4')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  layoutMode === 'two-per-a4'
                    ? 'bg-[#008236] text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>2 Invoices / A4 (Half-A4 Saver)</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('one-per-page')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  layoutMode === 'one-per-page'
                    ? 'bg-[#008236] text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>1 Invoice / Page (A5 / Half-Page)</span>
              </button>
            </div>

            {/* If multiple orders, show quick selection pills */}
            {orders.length > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Select All ({orders.length})
                </button>
                <span className="text-slate-600">|</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Deselect All
                </button>
              </div>
            )}
          </div>

          {/* Quick Selection Filter Chips for Bulk Print */}
          {orders.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-[11px]">
              <span className="text-slate-400 font-medium shrink-0">Selected Invoices:</span>
              {orders.map((ord) => {
                const isChecked = activeOrderIds.includes(ord.id);
                return (
                  <button
                    key={ord.id}
                    type="button"
                    onClick={() => toggleOrderSelection(ord.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border transition-colors shrink-0 cursor-pointer font-mono ${
                      isChecked
                        ? 'bg-[#008236]/20 border-[#008236] text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 line-through opacity-60'
                    }`}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-3 h-3 text-[#008236]" />
                    ) : (
                      <Square className="w-3 h-3 text-slate-500" />
                    )}
                    <span>{ord.orderNumber}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Print Tip Notice */}
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg">
            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              <strong>Print Setting Tip:</strong> For perfect half-A4 sizing, set{' '}
              <em>Paper Size: A4</em>, <em>Margins: Minimum (or None)</em>, and check{' '}
              <em>"Background graphics"</em> in the browser print window.
            </span>
          </div>
        </div>

        {/* Scrollable Printable Container */}
        <div
          id="printable-invoices-container"
          className="invoice-modal-scroll-area p-4 sm:p-6 overflow-y-auto custom-scrollbar bg-slate-200/70 space-y-8 print:p-0 print:space-y-0 print:bg-white print:overflow-visible"
        >
          {printableOrders.length === 0 ? (
            <div className="bg-white p-12 rounded-xl text-center text-slate-500 text-xs">
              No orders selected for printing. Please select at least one order above.
            </div>
          ) : (
            orderPages.map((pagePair, pageIdx) => {
              const isLastPage = pageIdx === orderPages.length - 1;
              return (
                <div key={`page-${pageIdx}`} className="space-y-4 print:space-y-0">
                  {/* On-screen visual Page Banner */}
                  <div className="no-print flex items-center justify-between text-xs text-slate-500 px-2 font-medium">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <strong>A4 Sheet #{pageIdx + 1}</strong>
                      <span>
                        ({pagePair.length} {pagePair.length === 1 ? 'Invoice' : 'Invoices'} on this sheet)
                      </span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Standard A4 Paper (210mm × 297mm)
                    </span>
                  </div>

                  {/* Physical A4 Print Sheet Container */}
                  <div className="a4-print-page bg-white p-4 sm:p-5 rounded-xl shadow-md border border-slate-300 print:shadow-none print:border-none print:p-0 print:rounded-none">
                    {/* Invoice 1 (Top Half of A4) */}
                    {pagePair[0] && (
                      <SingleHalfA4Invoice
                        order={pagePair[0]}
                        storeSettings={storeSettings}
                        slipPosition="top"
                      />
                    )}

                    {/* Cut Line between Top & Bottom Invoices */}
                    {layoutMode === 'two-per-a4' && (
                      <div className="half-a4-cut-separator my-3 flex items-center justify-center text-slate-400 text-[10px] select-none">
                        <div className="flex-1 border-b border-dashed border-slate-400" />
                        <span className="px-3 flex items-center gap-1.5 font-mono text-[10px] text-slate-500 font-semibold bg-white">
                          <Scissors className="w-3.5 h-3.5 text-slate-600" />
                          <span>CUT HERE (HALF OF A4 PAPER - A5 SIZE)</span>
                        </span>
                        <div className="flex-1 border-b border-dashed border-slate-400" />
                      </div>
                    )}

                    {/* Invoice 2 (Bottom Half of A4, if available in pair) */}
                    {layoutMode === 'two-per-a4' && pagePair[1] && (
                      <SingleHalfA4Invoice
                        order={pagePair[1]}
                        storeSettings={storeSettings}
                        slipPosition="bottom"
                      />
                    )}

                    {/* If only 1 invoice on this A4 sheet, show blank bottom placeholder in screen mode */}
                    {layoutMode === 'two-per-a4' && !pagePair[1] && (
                      <div className="no-print h-[130mm] border border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 text-xs gap-1 bg-slate-50/50">
                        <span className="font-semibold">Half-A4 Space Available</span>
                        <span className="text-[11px] text-slate-400">
                          (This single invoice occupies only the top half of the A4 paper)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Page break marker for printer */}
                  {!isLastPage && <div className="a4-page-break" />}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

// ============================================================================
// SINGLE HALF-A4 INVOICE COMPONENT
// Carefully formatted to fit strictly inside ~138mm height on A4 paper
// ============================================================================
interface SingleHalfA4InvoiceProps {
  order: Order;
  storeSettings: StoreSettings;
  slipPosition: 'top' | 'bottom';
}

const SingleHalfA4Invoice: React.FC<SingleHalfA4InvoiceProps> = ({
  order,
  storeSettings,
  slipPosition,
}) => {
  const storePhone = storeSettings?.phone || '+8801909999079';
  const storeAddress = storeSettings?.address || 'Road #11, Banani, Dhaka-1213, Bangladesh';
  const storeEmail = storeSettings?.email || 'weftbd247@gmail.com';
  const storeName = storeSettings?.storeName || 'WEFT';

  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-GB');

  return (
    <div
      className="half-a4-slip w-full bg-white border border-slate-300 rounded-lg p-3 sm:p-3.5 flex flex-col justify-between text-slate-800"
      data-position={slipPosition}
    >
      {/* 1. Header Row (Logo, Store Contacts, Invoice #, Date & Badge) */}
      <div className="border-b border-slate-300 pb-2 flex items-start justify-between gap-3">
        {/* Left: Brand info */}
        <div className="flex items-center gap-2.5">
          <div className="bg-[#071426] px-2 py-1 rounded shadow-xs flex items-center justify-center shrink-0">
            <img
              src="https://i.ibb.co.com/5hcdCy8k/Chat-GPT-Image-Aug-29-2026-01-41-24-PM.png"
              alt={storeName}
              className="h-5 w-auto max-w-[70px] object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <h2 className="text-sm font-black text-slate-900 tracking-tight leading-none">
                {storeName}
              </h2>
              <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wide">
                Knitwear
              </span>
            </div>
            <p className="text-[10px] text-slate-600 font-medium leading-tight mt-0.5">
              Hotline: <strong className="text-slate-900">{storePhone}</strong> | {storeAddress}
            </p>
          </div>
        </div>

        {/* Right: Invoice #, Date, Status */}
        <div className="text-right shrink-0">
          <div className="flex items-center justify-end gap-1.5">
            <span className="inline-block px-2 py-0.5 bg-emerald-50 border border-emerald-300 text-[#008236] font-bold text-[9px] rounded uppercase tracking-wider">
              Cash on Delivery (COD)
            </span>
            <span className="font-mono text-xs font-black text-slate-900">
              INVOICE
            </span>
          </div>
          <div className="text-[10px] text-slate-600 mt-0.5 space-y-0.5">
            <p>
              Order: <strong className="text-slate-900 font-mono text-[11px]">{order.orderNumber}</strong>
            </p>
            <p>
              Date: <strong className="text-slate-800">{formattedDate}</strong> | Status:{' '}
              <strong className="text-slate-900 uppercase font-mono">{order.orderStatus}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* 2. Customer & Delivery Information Block */}
      <div className="my-1.5 bg-slate-50/80 border border-slate-200 rounded p-2 text-[10px] grid grid-cols-12 gap-2">
        <div className="col-span-8">
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block leading-none mb-1">
            Deliver To:
          </span>
          <div className="flex items-baseline gap-2 flex-wrap">
            <strong className="text-slate-900 text-[11px] font-bold">{order.customer.name}</strong>
            <span className="text-emerald-700 font-mono font-bold text-[11px]">
              {order.customer.phone}
            </span>
          </div>
          <p className="text-slate-700 text-[10px] leading-tight mt-0.5 line-clamp-2">
            {order.customer.address}
          </p>
        </div>

        <div className="col-span-4 text-right flex flex-col justify-between border-l border-slate-200 pl-2">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block leading-none mb-0.5">
              Area / Courier:
            </span>
            <p className="font-semibold text-slate-800 text-[10px]">
              {order.customer.city || 'Inside Dhaka'}
            </p>
          </div>
          {order.customer.note && (
            <p className="text-[9px] text-amber-800 italic truncate" title={order.customer.note}>
              Note: "{order.customer.note}"
            </p>
          )}
        </div>
      </div>

      {/* 3. Items Ordered Table (Dense, Clean, Compact) */}
      <div className="flex-1 my-1 overflow-hidden">
        <table className="w-full text-left border-collapse text-[10px]">
          <thead>
            <tr className="border-b border-slate-300 bg-slate-100/70 text-slate-700 uppercase font-bold text-[9px] tracking-wider">
              <th className="py-1 px-1.5 w-6">#</th>
              <th className="py-1 px-1.5">Item Description</th>
              <th className="py-1 px-1.5 text-center w-12">Size</th>
              <th className="py-1 px-1.5 text-center w-14">Price</th>
              <th className="py-1 px-1.5 text-center w-10">Qty</th>
              <th className="py-1 px-1.5 text-right w-16">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.items.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/40">
                <td className="py-1 px-1.5 text-slate-400 font-mono text-[9px]">{idx + 1}</td>
                <td className="py-1 px-1.5">
                  <span className="font-bold text-slate-900 leading-tight">{item.productName}</span>
                </td>
                <td className="py-1 px-1.5 text-center font-bold text-slate-800">
                  <span className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-[9px]">
                    {item.size}
                  </span>
                </td>
                <td className="py-1 px-1.5 text-center font-mono text-slate-600">৳{item.unitPrice}</td>
                <td className="py-1 px-1.5 text-center font-bold text-slate-900">×{item.quantity}</td>
                <td className="py-1 px-1.5 text-right font-bold text-slate-900 font-mono">
                  ৳{item.subtotal}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 4. Financial Totals & Policy Note */}
      <div className="border-t border-slate-300 pt-1.5 flex items-end justify-between gap-4 text-[10px]">
        {/* Left: Thank you & Policy note */}
        <div className="space-y-1 max-w-[320px]">
          <p className="text-[10px] text-slate-600 leading-tight">
            Thank you for shopping with <strong>{storeName}</strong>! Please verify product size with the courier delivery agent. 48-hr exchange guarantee.
          </p>
        </div>

        {/* Right: Calculated Totals */}
        <div className="w-48 space-y-0.5 text-right font-medium">
          <div className="flex justify-between text-slate-600 text-[10px]">
            <span>Subtotal:</span>
            <span className="font-mono">৳{order.subtotal}</span>
          </div>
          <div className="flex justify-between text-slate-600 text-[10px]">
            <span>Delivery:</span>
            <span className="font-mono">
              {order.shipping === 0 ? '৳0 (Free)' : `৳${order.shipping}`}
            </span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-700 text-[10px]">
              <span>Discount:</span>
              <span className="font-mono">-৳{order.discount}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-xs font-black text-slate-900 pt-1 border-t border-slate-300">
            <span>Total Payable:</span>
            <span className="text-[#008236] font-mono text-sm">৳{order.total}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
