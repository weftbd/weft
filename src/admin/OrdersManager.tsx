import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Eye,
  CheckCircle2,
  Phone,
  X,
  MessageCircle,
  Clock,
  Printer,
  Edit,
  Trash2,
  Calendar,
  Layers,
  CheckSquare,
  Square,
  AlertTriangle,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { Order, OrderStatus, Product, ShippingMethod, StoreSettings } from '../types';
import {
  updateOrderStatus,
  bulkUpdateOrderStatus,
  deleteOrder,
  bulkDeleteOrders,
  exportOrdersToCSV,
} from '../services/orders';
import { OrderInvoiceModal } from '../components/admin/OrderInvoiceModal';
import { OrderEditModal } from '../components/admin/OrderEditModal';

interface OrdersManagerProps {
  orders: Order[];
  products: Product[];
  shippingMethods: ShippingMethod[];
  storeSettings: StoreSettings;
  onOrderUpdated: () => void;
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  PENDING: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  CONFIRMED: { label: 'Confirmed', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  PROCESSING: { label: 'Processing', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  SHIPPED: { label: 'Shipped', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  DELIVERED: { label: 'Delivered', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  RETURNED: { label: 'Returned', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
};

type DateFilterType = 'all' | 'today' | 'yesterday' | 'last7days' | 'last30days' | 'custom';

export const OrdersManager: React.FC<OrdersManagerProps> = ({
  orders,
  products,
  shippingMethods,
  storeSettings,
  onOrderUpdated,
}) => {
  const [localOrders, setLocalOrders] = useState<Order[]>(orders);

  // Keep local optimistic state synchronized whenever parent orders prop changes
  React.useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected orders for bulk operations (like WordPress bulk action)
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');

  // Modals state
  const [inspectOrder, setInspectOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [invoiceOrders, setInvoiceOrders] = useState<Order[] | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isBulkExecuting, setIsBulkExecuting] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3000);
  };

  // Helper date match
  const matchesDateFilter = (orderDateStr: string): boolean => {
    if (dateFilter === 'all') return true;

    const orderDate = new Date(orderDateStr);
    const now = new Date();

    if (dateFilter === 'today') {
      return (
        orderDate.getFullYear() === now.getFullYear() &&
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getDate() === now.getDate()
      );
    }

    if (dateFilter === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      return (
        orderDate.getFullYear() === yesterday.getFullYear() &&
        orderDate.getMonth() === yesterday.getMonth() &&
        orderDate.getDate() === yesterday.getDate()
      );
    }

    if (dateFilter === 'last7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      return orderDate >= sevenDaysAgo;
    }

    if (dateFilter === 'last30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      return orderDate >= thirtyDaysAgo;
    }

    if (dateFilter === 'custom') {
      if (!startDate && !endDate) return true;
      const orderTime = orderDate.getTime();

      if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return orderTime >= start.getTime() && orderTime <= end.getTime();
      }

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        return orderTime >= start.getTime();
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return orderTime <= end.getTime();
      }
    }

    return true;
  };

  // Filter orders
  const filteredOrders = useMemo(() => {
    return localOrders.filter((order) => {
      if (statusFilter !== 'ALL' && order.orderStatus !== statusFilter) {
        return false;
      }
      if (!matchesDateFilter(order.createdAt)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNum = order.orderNumber?.toLowerCase().includes(q);
        const matchName = order.customer?.name?.toLowerCase().includes(q);
        const matchPhone = order.customer?.phone?.includes(q);
        const matchCity = order.customer?.city?.toLowerCase().includes(q);
        const matchItem = order.items?.some((it) => it.productName?.toLowerCase().includes(q));
        return matchNum || matchName || matchPhone || matchCity || matchItem;
      }
      return true;
    });
  }, [localOrders, statusFilter, dateFilter, startDate, endDate, searchQuery]);

  // Select all visible
  const isAllVisibleSelected =
    filteredOrders.length > 0 &&
    filteredOrders.every((o) => selectedOrderIds.includes(o.id));

  const handleToggleSelectAll = () => {
    if (isAllVisibleSelected) {
      const visibleIds = new Set(filteredOrders.map((o) => o.id));
      setSelectedOrderIds(selectedOrderIds.filter((id) => !visibleIds.has(id)));
    } else {
      const newSelected = Array.from(
        new Set([...selectedOrderIds, ...filteredOrders.map((o) => o.id)])
      );
      setSelectedOrderIds(newSelected);
    }
  };

  const handleToggleSingleSelect = (orderId: string) => {
    if (selectedOrderIds.includes(orderId)) {
      setSelectedOrderIds(selectedOrderIds.filter((id) => id !== orderId));
    } else {
      setSelectedOrderIds([...selectedOrderIds, orderId]);
    }
  };

  // Single status change - immediate 1-click optimistic update + persisted to Firestore & local storage
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);

    // Instant zero-latency UI update on the very first click
    setLocalOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              orderStatus: newStatus,
              updatedAt: new Date().toISOString(),
              statusHistory: [
                ...(o.statusHistory || []),
                { status: newStatus, timestamp: new Date().toISOString() },
              ],
            }
          : o
      )
    );

    if (inspectOrder && inspectOrder.id === orderId) {
      setInspectOrder((prev) =>
        prev
          ? {
              ...prev,
              orderStatus: newStatus,
              updatedAt: new Date().toISOString(),
              statusHistory: [
                ...(prev.statusHistory || []),
                { status: newStatus, timestamp: new Date().toISOString() },
              ],
            }
          : null
      );
    }

    try {
      await updateOrderStatus(orderId, newStatus);
      onOrderUpdated();
      showToast(`Order status updated to "${newStatus}"`);
    } catch (e) {
      console.error('Status change error:', e);
    } finally {
      setUpdatingId(null);
    }
  };

  // Bulk action trigger
  const handleApplyBulkAction = async () => {
    if (!bulkAction || selectedOrderIds.length === 0) return;

    if (bulkAction === 'DELETE') {
      setShowBulkDeleteConfirm(true);
      return;
    }

    if (bulkAction === 'PRINT_INVOICE') {
      const selected = localOrders.filter((o) => selectedOrderIds.includes(o.id));
      setInvoiceOrders(selected);
      return;
    }

    if (bulkAction === 'EXPORT_CSV') {
      const selected = localOrders.filter((o) => selectedOrderIds.includes(o.id));
      exportOrdersToCSV(selected);
      return;
    }

    // Status change bulk
    const targetStatus = bulkAction as OrderStatus;
    setLocalOrders((prev) =>
      prev.map((o) =>
        selectedOrderIds.includes(o.id)
          ? {
              ...o,
              orderStatus: targetStatus,
              updatedAt: new Date().toISOString(),
            }
          : o
      )
    );

    setIsBulkExecuting(true);
    try {
      await bulkUpdateOrderStatus(selectedOrderIds, targetStatus);
      onOrderUpdated();
      showToast(`Bulk updated ${selectedOrderIds.length} orders to ${targetStatus}`);
      setSelectedOrderIds([]);
      setBulkAction('');
    } catch (e) {
      console.error('Bulk update error:', e);
    } finally {
      setIsBulkExecuting(false);
    }
  };

  // Delete single order confirmation
  const handleConfirmSingleDelete = async () => {
    if (!orderToDelete) return;
    const delId = orderToDelete.id;
    setLocalOrders((prev) => prev.filter((o) => o.id !== delId));
    setSelectedOrderIds((prev) => prev.filter((id) => id !== delId));
    setOrderToDelete(null);
    if (inspectOrder?.id === delId) setInspectOrder(null);

    try {
      await deleteOrder(delId);
      onOrderUpdated();
      showToast(`Order ${orderToDelete.orderNumber} deleted`);
    } catch (e) {
      console.error('Delete error:', e);
    }
  };

  // Confirm bulk delete
  const handleConfirmBulkDelete = async () => {
    const toDeleteIds = [...selectedOrderIds];
    setLocalOrders((prev) => prev.filter((o) => !toDeleteIds.includes(o.id)));
    setSelectedOrderIds([]);
    setBulkAction('');
    setShowBulkDeleteConfirm(false);
    setIsBulkExecuting(true);

    try {
      await bulkDeleteOrders(toDeleteIds);
      onOrderUpdated();
      showToast(`Deleted ${toDeleteIds.length} orders`);
    } catch (e) {
      console.error('Bulk delete error:', e);
    } finally {
      setIsBulkExecuting(false);
    }
  };

  // Summary counts
  const statusList: { label: string; value: string; count: number }[] = [
    { label: 'All Orders', value: 'ALL', count: localOrders.length },
    { label: 'Pending', value: 'PENDING', count: localOrders.filter((o) => o.orderStatus === 'PENDING').length },
    { label: 'Confirmed', value: 'CONFIRMED', count: localOrders.filter((o) => o.orderStatus === 'CONFIRMED').length },
    { label: 'Processing', value: 'PROCESSING', count: localOrders.filter((o) => o.orderStatus === 'PROCESSING').length },
    { label: 'Shipped', value: 'SHIPPED', count: localOrders.filter((o) => o.orderStatus === 'SHIPPED').length },
    { label: 'Delivered', value: 'DELIVERED', count: localOrders.filter((o) => o.orderStatus === 'DELIVERED').length },
    { label: 'Cancelled', value: 'CANCELLED', count: localOrders.filter((o) => o.orderStatus === 'CANCELLED').length },
    { label: 'Returned', value: 'RETURNED', count: localOrders.filter((o) => o.orderStatus === 'RETURNED').length },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-700 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Orders Management</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review incoming orders, verify customers, update dispatch stages, edit items, and print invoices
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {selectedOrderIds.length > 0 && (
            <button
              onClick={() => {
                const selected = orders.filter((o) => selectedOrderIds.includes(o.id));
                setInvoiceOrders(selected);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Print Selected Invoices ({selectedOrderIds.length})</span>
            </button>
          )}

          <button
            onClick={() => exportOrdersToCSV(filteredOrders)}
            disabled={filteredOrders.length === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-all border border-slate-200 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-[#008236]" />
            <span>Export CSV ({filteredOrders.length})</span>
          </button>
        </div>
      </div>

      {/* Status Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {statusList.map((st) => (
          <button
            key={st.value}
            onClick={() => setStatusFilter(st.value)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === st.value
                ? 'bg-[#008236] text-white shadow-sm shadow-[#008236]/20'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <span>{st.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                statusFilter === st.value ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {st.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filters Bar: Search, Date Filter, and Date Range Picker */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order # (e.g. WEFT-2026...), customer name, phone, item..."
              className="bg-transparent border-none text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-full font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 custom-scrollbar">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Date:
            </span>
            {(
              [
                { label: 'All Time', value: 'all' },
                { label: 'Today', value: 'today' },
                { label: 'Yesterday', value: 'yesterday' },
                { label: 'Last 7 Days', value: 'last7days' },
                { label: 'Last 30 Days', value: 'last30days' },
                { label: 'Custom Range', value: 'custom' },
              ] as { label: string; value: DateFilterType }[]
            ).map((df) => (
              <button
                key={df.value}
                onClick={() => setDateFilter(df.value)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-colors ${
                  dateFilter === df.value
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {df.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date to Date Inputs (shown when Custom Range selected) */}
        {dateFilter === 'custom' && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3 animate-fade-in">
            <span className="text-xs font-bold text-slate-700">From Date:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs p-1.5 rounded-lg border border-slate-300 bg-white font-medium focus:outline-none focus:border-[#008236]"
            />
            <span className="text-xs font-bold text-slate-700">To Date:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs p-1.5 rounded-lg border border-slate-300 bg-white font-medium focus:outline-none focus:border-[#008236]"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
              >
                Reset Dates
              </button>
            )}
          </div>
        )}
      </div>

      {/* WordPress-Style Bulk Actions Toolbar */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="selectAllOrders"
              checked={isAllVisibleSelected}
              onChange={handleToggleSelectAll}
              className="w-4 h-4 rounded text-[#008236] focus:ring-[#008236] cursor-pointer"
            />
            <label
              htmlFor="selectAllOrders"
              className="font-bold text-slate-700 cursor-pointer select-none"
            >
              Select All Visible ({filteredOrders.length})
            </label>
          </div>

          {selectedOrderIds.length > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-[#008236]/10 text-[#008236] font-bold">
              {selectedOrderIds.length} Selected
            </span>
          )}
        </div>

        {/* Bulk Action Select + Apply */}
        <div className="flex items-center gap-2">
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            disabled={selectedOrderIds.length === 0}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#008236] disabled:opacity-50"
          >
            <option value="">-- Bulk Actions --</option>
            <optgroup label="Change Status To">
              <option value="PENDING">Mark as Pending</option>
              <option value="CONFIRMED">Mark as Confirmed</option>
              <option value="PROCESSING">Mark as Processing</option>
              <option value="SHIPPED">Mark as Shipped</option>
              <option value="DELIVERED">Mark as Delivered</option>
              <option value="CANCELLED">Mark as Cancelled</option>
              <option value="RETURNED">Mark as Returned</option>
            </optgroup>
            <optgroup label="Documents & Exports">
              <option value="PRINT_INVOICE">Print Invoices</option>
              <option value="EXPORT_CSV">Export CSV</option>
            </optgroup>
            <optgroup label="Danger">
              <option value="DELETE">Delete Selected Orders</option>
            </optgroup>
          </select>

          <button
            onClick={handleApplyBulkAction}
            disabled={!bulkAction || selectedOrderIds.length === 0 || isBulkExecuting}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer transition-colors disabled:opacity-50"
          >
            {isBulkExecuting ? 'Applying...' : 'Apply'}
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs sm:text-sm">
            No orders found matching the filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead className="bg-slate-50/70 border-b border-slate-200">
                <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4 pl-5 w-10">
                    <input
                      type="checkbox"
                      checked={isAllVisibleSelected}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded text-[#008236] focus:ring-[#008236] cursor-pointer"
                    />
                  </th>
                  <th className="p-4">Order ID & Date</th>
                  <th className="p-4">Customer Info</th>
                  <th className="p-4">Items & Variations</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Status Selector</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100 font-medium">
                {filteredOrders.map((order) => {
                  const cfg = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.PENDING;
                  const isUpdating = updatingId === order.id;
                  const isSelected = selectedOrderIds.includes(order.id);

                  return (
                    <tr
                      key={order.id}
                      className={`transition-colors ${
                        isSelected ? 'bg-emerald-50/40' : 'hover:bg-slate-50/50'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-4 pl-5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSingleSelect(order.id)}
                          className="w-4 h-4 rounded text-[#008236] focus:ring-[#008236] cursor-pointer"
                        />
                      </td>

                      {/* Order ID & Date */}
                      <td className="p-4">
                        <div className="font-mono font-bold text-slate-900 text-xs">
                          {order.orderNumber}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString()}{' '}
                          {new Date(order.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="p-4">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">
                          {order.customer?.name}
                        </div>
                        <div className="text-[11px] text-[#008236] flex items-center gap-1 mt-0.5 font-mono font-semibold">
                          <Phone className="w-3 h-3 shrink-0" />
                          <a href={`tel:${order.customer?.phone}`} className="hover:underline">
                            {order.customer?.phone}
                          </a>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                          {order.customer?.address}
                        </div>
                      </td>

                      {/* Items */}
                      <td className="p-4">
                        <div className="space-y-1">
                          {order.items?.map((it, idx) => (
                            <div key={idx} className="text-[11px] text-slate-700 flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900">{it.productName}</span>
                              <span className="px-1.5 py-0.2 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold text-slate-700">
                                {it.size}
                              </span>
                              <span className="text-slate-500">×{it.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Total & Delivery */}
                      <td className="p-4">
                        <div className="font-bold text-slate-900 text-sm">৳{order.total}</div>
                        <div className="text-[10px] text-slate-400">
                          {order.shipping === 0 ? 'Free Shipping' : `৳${order.shipping} Delivery`}
                        </div>
                      </td>

                      {/* Quick Inline Status Dropdown */}
                      <td className="p-4">
                        <select
                          disabled={isUpdating}
                          value={order.orderStatus}
                          onChange={(e) =>
                            handleStatusChange(order.id, e.target.value as OrderStatus)
                          }
                          className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#008236]/30 transition-all ${
                            cfg.bg
                          } ${cfg.text} ${cfg.border} ${isUpdating ? 'opacity-50' : ''}`}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="PROCESSING">PROCESSING</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                          <option value="RETURNED">RETURNED</option>
                        </select>
                      </td>

                      {/* Actions: View / Edit / Print Invoice / Delete */}
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Invoice Print Button */}
                          <button
                            onClick={() => setInvoiceOrders([order])}
                            title="Generate & Print Invoice"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Order Button */}
                          <button
                            onClick={() => setEditingOrder(order)}
                            title="Edit Order (Change Size, Color, Items, Customer Info)"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Details Modal Button */}
                          <button
                            onClick={() => setInspectOrder(order)}
                            title="Order Details"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-800 hover:text-white text-slate-700 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Order Button */}
                          <button
                            onClick={() => setOrderToDelete(order)}
                            title="Delete Order"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-600 hover:text-white text-slate-700 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ----------------- MODALS ----------------- */}

      {/* 1. Print Invoice Modal */}
      {invoiceOrders && (
        <OrderInvoiceModal
          orders={invoiceOrders}
          storeSettings={storeSettings}
          onClose={() => setInvoiceOrders(null)}
        />
      )}

      {/* 2. Order Edit Modal */}
      {editingOrder && (
        <OrderEditModal
          order={editingOrder}
          products={products}
          shippingMethods={shippingMethods}
          storeSettings={storeSettings}
          onClose={() => setEditingOrder(null)}
          onOrderSaved={() => {
            onOrderUpdated();
            showToast('Order details modified successfully');
          }}
        />
      )}

      {/* 3. Delete Confirmation Dialog */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Delete Customer Order?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to permanently delete order{' '}
                <strong className="font-mono text-slate-800">{orderToDelete.orderNumber}</strong>?
                This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSingleDelete}
                className="flex-1 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Bulk Delete Confirmation Dialog */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Bulk Delete Orders</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to permanently delete all{' '}
                <strong className="text-rose-600 font-bold">{selectedOrderIds.length}</strong>{' '}
                selected orders?
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                disabled={isBulkExecuting}
                className="flex-1 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer transition-colors disabled:opacity-50"
              >
                {isBulkExecuting ? 'Deleting...' : 'Delete Selected'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Detailed Order Inspection Modal */}
      {inspectOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl relative my-8 space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src="https://i.ibb.co.com/5hcdCy8k/Chat-GPT-Image-Aug-29-2026-01-41-24-PM.png"
                  alt="WEFT Logo"
                  className="h-8 w-auto max-w-[100px] object-contain"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-500">Order Inspection</span>
                  <h3 className="font-mono text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                    {inspectOrder.orderNumber}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setInvoiceOrders([inspectOrder]);
                  }}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  title="Print Invoice"
                >
                  <Printer className="w-3.5 h-3.5 text-[#008236]" />
                  <span>Invoice</span>
                </button>
                <button
                  onClick={() => {
                    const ord = inspectOrder;
                    setInspectOrder(null);
                    setEditingOrder(ord);
                  }}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  title="Edit Order"
                >
                  <Edit className="w-3.5 h-3.5 text-blue-600" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setInspectOrder(null)}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Status Changers */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  Update Stage (Current:{' '}
                  <span className="text-[#008236] font-bold">{inspectOrder.orderStatus}</span>):
                </span>
                {updatingId === inspectOrder.id && (
                  <span className="text-[11px] text-emerald-600 font-semibold">Updating...</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    'PENDING',
                    'CONFIRMED',
                    'PROCESSING',
                    'SHIPPED',
                    'DELIVERED',
                    'CANCELLED',
                    'RETURNED',
                  ] as OrderStatus[]
                ).map((st) => {
                  const isCurrent = inspectOrder.orderStatus === st;
                  return (
                    <button
                      key={st}
                      disabled={updatingId === inspectOrder.id}
                      onClick={() => handleStatusChange(inspectOrder.id, st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#008236] text-white shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                      } disabled:opacity-50`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Customer Snapshot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50/50 p-4 rounded-xl border border-slate-200">
              <div className="space-y-1.5">
                <span className="font-bold text-slate-400 block uppercase tracking-wider text-[10px]">
                  Customer Information
                </span>
                <p className="font-bold text-slate-900 text-sm">{inspectOrder.customer.name}</p>
                <p className="flex items-center gap-1.5 text-[#008236] font-mono font-semibold">
                  <Phone className="w-3.5 h-3.5" />
                  <a href={`tel:${inspectOrder.customer?.phone}`}>
                    {inspectOrder.customer?.phone}
                  </a>
                </p>
                <p className="text-slate-600 leading-relaxed font-medium">
                  {inspectOrder.customer.address}
                </p>
                <p className="text-slate-500 font-semibold">
                  Area: {inspectOrder.customer.city || 'Dhaka'}
                </p>
                {inspectOrder.customer.note && (
                  <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200 text-amber-900 text-[11px]">
                    <span className="font-bold">Customer Note:</span>{' '}
                    {inspectOrder.customer.note}
                  </div>
                )}
              </div>

              {/* Direct Actions */}
              <div className="flex flex-col justify-between border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-4 space-y-2">
                <div>
                  <span className="font-bold text-slate-400 block uppercase tracking-wider text-[10px] mb-2">
                    Direct Customer Verification
                  </span>
                  <div className="flex flex-col gap-2">
                    <a
                      href={`tel:${inspectOrder.customer?.phone}`}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Customer Now</span>
                    </a>
                    <a
                      href={`https://wa.me/${inspectOrder.customer?.phone?.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#075E54] hover:bg-[#128C7E] text-white text-xs font-semibold transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp Customer</span>
                    </a>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                  <span>Payment Method:</span>{' '}
                  <span className="font-bold text-slate-900">{inspectOrder.paymentMethod}</span>
                </div>
              </div>
            </div>

            {/* Ordered Items List */}
            <div className="space-y-2">
              <span className="font-bold text-slate-400 block uppercase tracking-wider text-[10px]">
                Ordered Items ({inspectOrder.items.length})
              </span>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                {inspectOrder.items.map((it, idx) => (
                  <div
                    key={idx}
                    className="p-3 flex items-center justify-between text-xs bg-white"
                  >
                    <div className="flex items-center gap-3">
                      {it.image && (
                        <img
                          src={it.image}
                          alt={it.productName}
                          className="w-10 h-10 rounded object-cover border border-slate-200"
                        />
                      )}
                      <div>
                        <span className="font-bold text-slate-900 block">{it.productName}</span>
                        <span className="text-slate-500">
                          Size: <strong className="text-slate-800">{it.size}</strong> ×{' '}
                          {it.quantity}
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 font-mono">৳{it.subtotal}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Totals Breakdown */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-medium">৳{inspectOrder.subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Charge:</span>
                <span className="font-mono font-medium">
                  {inspectOrder.shipping === 0 ? '৳0 (Free)' : `৳${inspectOrder.shipping}`}
                </span>
              </div>
              {inspectOrder.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <span className="font-mono font-medium">-৳{inspectOrder.discount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount:</span>
                <span className="text-[#008236] font-mono text-base">৳{inspectOrder.total}</span>
              </div>
            </div>

            {/* Status History Logs */}
            {inspectOrder.statusHistory && inspectOrder.statusHistory.length > 0 && (
              <div className="space-y-2">
                <span className="font-bold text-slate-400 block uppercase tracking-wider text-[10px]">
                  Status Audit Log
                </span>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 max-h-36 overflow-y-auto custom-scrollbar">
                  {inspectOrder.statusHistory.map((hist, idx) => (
                    <div key={idx} className="text-[11px] flex items-start gap-2 text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-800 uppercase">{hist.status}</span> —{' '}
                        <span>{hist.note}</span>
                        <span className="text-slate-400 block text-[10px]">
                          {new Date(hist.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
