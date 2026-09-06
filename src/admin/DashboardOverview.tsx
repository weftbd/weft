import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Clock,
  CheckCircle2,
  Truck,
  TrendingUp,
  Shirt,
  AlertTriangle,
  Calendar,
  ArrowRight,
  RotateCcw,
  CalendarRange,
  XCircle,
} from 'lucide-react';
import { Order, Product } from '../types';

export type DashboardDateFilterType =
  | 'all'
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'thisMonth'
  | 'custom';

interface DashboardOverviewProps {
  orders: Order[];
  products: Product[];
  onNavigateToOrders: () => void;
  onNavigateToProducts: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  orders,
  products,
  onNavigateToOrders,
  onNavigateToProducts,
}) => {
  const [dateFilter, setDateFilter] = useState<DashboardDateFilterType>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  // Helper date match
  const matchesDateFilter = (orderDateStr?: string): boolean => {
    if (!orderDateStr) return true;
    if (dateFilter === 'all') return true;

    const orderDate = new Date(orderDateStr);
    if (isNaN(orderDate.getTime())) return true;
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

    if (dateFilter === 'thisMonth') {
      return (
        orderDate.getFullYear() === now.getFullYear() &&
        orderDate.getMonth() === now.getMonth()
      );
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

  // Filtered orders for the chosen period
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => matchesDateFilter(o.createdAt));
  }, [orders, dateFilter, startDate, endDate]);

  const totalOrders = filteredOrders.length;
  const pendingOrders = filteredOrders.filter((o) => o.orderStatus === 'PENDING').length;
  const confirmedOrders = filteredOrders.filter((o) => o.orderStatus === 'CONFIRMED').length;
  const processingOrders = filteredOrders.filter((o) => o.orderStatus === 'PROCESSING').length;
  const shippedOrders = filteredOrders.filter((o) => o.orderStatus === 'SHIPPED').length;
  const deliveredOrders = filteredOrders.filter((o) => o.orderStatus === 'DELIVERED').length;
  const cancelledOrders = filteredOrders.filter((o) => o.orderStatus === 'CANCELLED').length;
  const returnedOrders = filteredOrders.filter((o) => o.orderStatus === 'RETURNED').length;

  const totalRevenue = filteredOrders
    .filter((o) => o.orderStatus !== 'CANCELLED' && o.orderStatus !== 'RETURNED')
    .reduce((acc, o) => acc + (o.total || 0), 0);

  // Today's orders count for sub-badge
  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrdersCount = orders.filter((o) => o.createdAt && o.createdAt.startsWith(todayStr)).length;

  // Low stock products check (any size stock < 10)
  const lowStockItems: { product: Product; size: string; count: number }[] = [];
  products.forEach((p) => {
    Object.entries(p.stock || {}).forEach(([sz, qty]) => {
      const num = typeof qty === 'number' ? qty : Number(qty || 0);
      if (num < 10) {
        lowStockItems.push({ product: p, size: sz, count: num });
      }
    });
  });

  const recentOrders = filteredOrders.slice(0, 7);

  // Active filter label
  const getFilterLabel = () => {
    switch (dateFilter) {
      case 'today':
        return 'Today (আজকে)';
      case 'yesterday':
        return 'Yesterday (গতকাল)';
      case 'last7days':
        return 'Last 7 Days (গত ৭ দিন)';
      case 'last30days':
        return 'Last 30 Days (গত ৩০ দিন)';
      case 'thisMonth':
        return 'This Month (চলতি মাস)';
      case 'custom':
        if (startDate && endDate) return `${startDate} to ${endDate}`;
        if (startDate) return `From ${startDate}`;
        if (endDate) return `Until ${endDate}`;
        return 'Custom Date Range';
      case 'all':
      default:
        return 'All Time (সব সময়)';
    }
  };

  const filterOptions: { key: DashboardDateFilterType; label: string }[] = [
    { key: 'all', label: 'All Time' },
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'last7days', label: 'Last 7 Days' },
    { key: 'last30days', label: 'Last 30 Days' },
    { key: 'thisMonth', label: 'This Month' },
    { key: 'custom', label: 'Custom' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Operational Overview</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time e-commerce performance metrics, revenue analytics and inventory health
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToOrders}
            className="px-3.5 py-2 rounded-lg bg-[#008236] hover:bg-[#006e2e] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Review Orders</span>
          </button>
          <button
            onClick={onNavigateToProducts}
            className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Shirt className="w-3.5 h-3.5" />
            <span>Update Catalog</span>
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <div className="w-6 h-6 rounded-md bg-[#008236]/10 text-[#008236] flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <span>Time Period:</span>
            <span className="text-[#008236] font-semibold bg-[#008236]/10 px-2 py-0.5 rounded-full border border-[#008236]/20">
              {getFilterLabel()}
            </span>
            {dateFilter !== 'all' && (
              <span className="text-slate-400 font-normal">
                ({filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} found)
              </span>
            )}
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {filterOptions.map((opt) => {
              const isActive = dateFilter === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => {
                    setDateFilter(opt.key);
                    if (opt.key === 'custom') {
                      setShowCustomPicker(true);
                    } else {
                      setShowCustomPicker(false);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#008236] text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}

            {dateFilter !== 'all' && (
              <button
                onClick={() => {
                  setDateFilter('all');
                  setStartDate('');
                  setEndDate('');
                  setShowCustomPicker(false);
                }}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center gap-1 transition-colors cursor-pointer"
                title="Reset to all time"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Custom Date Range Picker Container */}
        {(showCustomPicker || dateFilter === 'custom') && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 animate-fade-in text-xs">
            <span className="font-medium text-slate-600 flex items-center gap-1">
              <CalendarRange className="w-3.5 h-3.5 text-slate-400" />
              Custom Date Range:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDateFilter('custom');
                }}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#008236]"
                placeholder="Start date"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDateFilter('custom');
                }}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#008236]"
                placeholder="End date"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-rose-600 hover:underline text-[11px] font-medium cursor-pointer"
              >
                Clear Dates
              </button>
            )}
          </div>
        )}
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Revenue */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <p className="text-slate-500 text-xs sm:text-sm font-medium">Revenue ({getFilterLabel()})</p>
            <div className="w-7 h-7 rounded-md bg-[#008236]/10 text-[#008236] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-bold text-slate-900">৳{totalRevenue.toLocaleString()}</h3>
            <span className="text-[#008236] text-xs font-bold bg-[#008236]/10 px-2 py-0.5 rounded-full border border-[#008236]/20">
              {dateFilter === 'all' ? 'All Time' : 'Period'}
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-[#008236] h-full w-[85%]" />
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <p className="text-slate-500 text-xs sm:text-sm font-medium">Orders Placed</p>
            <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-bold text-slate-900">{totalOrders}</h3>
            {dateFilter === 'all' ? (
              <span className="text-[#008236] text-xs font-bold bg-[#008236]/10 px-2 py-0.5 rounded-full border border-[#008236]/20">
                +{todayOrdersCount} Today
              </span>
            ) : (
              <span className="text-blue-600 text-xs font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                Selected Period
              </span>
            )}
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-blue-600 h-full w-[70%]" />
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <p className="text-slate-500 text-xs sm:text-sm font-medium">Pending Orders</p>
            <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-bold text-slate-900">{pendingOrders}</h3>
            {pendingOrders > 0 ? (
              <span className="text-amber-600 text-xs font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                Action Required
              </span>
            ) : (
              <span className="text-slate-400 text-xs font-medium">All Clear</span>
            )}
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-amber-400 h-full transition-all"
              style={{ width: `${Math.min(100, Math.max(10, pendingOrders * 20))}%` }}
            />
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <p className="text-slate-500 text-xs sm:text-sm font-medium">Low Stock Items (&lt;10)</p>
            <div className="w-7 h-7 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-bold text-slate-900">{lowStockItems.length}</h3>
            {lowStockItems.length > 0 ? (
              <span className="text-rose-600 text-xs font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                Attention
              </span>
            ) : (
              <span className="text-[#008236] text-xs font-bold bg-[#008236]/10 px-2 py-0.5 rounded-full border border-[#008236]/20">
                Healthy
              </span>
            )}
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className={`h-full ${lowStockItems.length > 0 ? 'bg-rose-500 w-[45%]' : 'bg-[#008236] w-[100%]'}`}
            />
          </div>
        </div>
      </div>

      {/* Secondary Status Strip (Period-Aware) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Confirmed Orders</span>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{confirmedOrders}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#008236]/10 text-[#008236] flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Delivered Orders</span>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{deliveredOrders}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Truck className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Shipped / Processing</span>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{shippedOrders + processingOrders}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Cancelled / Returned</span>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{cancelledOrders + returnedOrders}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <XCircle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Recent Orders & Low Stock Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Orders Table (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900">Orders ({getFilterLabel()})</h3>
              <p className="text-slate-400 text-xs mt-0.5">
                {filteredOrders.length === 0
                  ? 'No orders found for this period'
                  : `Showing ${recentOrders.length} of ${filteredOrders.length} matching transactions`}
              </p>
            </div>
            <button
              onClick={onNavigateToOrders}
              className="text-[#008236] text-xs font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Manage All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 space-y-2">
              <p>No orders found for the selected time filter.</p>
              {dateFilter !== 'all' && (
                <button
                  onClick={() => {
                    setDateFilter('all');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
                >
                  Show All Time Orders
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 border-b border-slate-200">
                  <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="p-4 pl-6">Order ID</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Items</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 pr-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50/40 transition-colors">
                      <td className="p-4 pl-6 font-semibold font-mono text-slate-900 text-xs">
                        {o.orderNumber}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-900 text-xs sm:text-sm">{o.customer?.name}</div>
                        <div className="text-xs text-slate-500">{o.customer?.phone}</div>
                      </td>
                      <td className="p-4 text-xs text-slate-500 max-w-[200px] truncate">
                        {o.items?.map((it) => `${it.productName} (${it.size}) x${it.quantity}`).join(', ')}
                      </td>
                      <td className="p-4 font-bold text-slate-900 text-xs sm:text-sm">৳{o.total}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                            o.orderStatus === 'CONFIRMED' || o.orderStatus === 'DELIVERED'
                              ? 'bg-[#008236]/15 text-[#008236]'
                              : o.orderStatus === 'CANCELLED'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {o.orderStatus}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <button
                          onClick={onNavigateToOrders}
                          className="text-[#008236] font-bold text-xs hover:underline cursor-pointer"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low Stock Warning Box (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Inventory Alerts</span>
              </h3>
              <button
                onClick={onNavigateToProducts}
                className="text-xs font-bold text-[#008236] hover:underline cursor-pointer"
              >
                Catalog
              </button>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                All sizes and products are currently well-stocked.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {lowStockItems.slice(0, 6).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{item.product.name}</div>
                      <div className="text-[11px] text-slate-500">Size: {item.size}</div>
                    </div>
                    <span className="font-bold px-2 py-0.5 rounded text-[10px] uppercase bg-rose-100 text-rose-700 border border-rose-200">
                      {item.count} Left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={onNavigateToProducts}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
            >
              Update Inventory Stock Levels
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
