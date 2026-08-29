import React from 'react';
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
  Eye,
} from 'lucide-react';
import { Order, Product } from '../types';

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
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.orderStatus === 'PENDING').length;
  const confirmedOrders = orders.filter((o) => o.orderStatus === 'CONFIRMED').length;
  const deliveredOrders = orders.filter((o) => o.orderStatus === 'DELIVERED').length;

  const totalRevenue = orders
    .filter((o) => o.orderStatus !== 'CANCELLED' && o.orderStatus !== 'RETURNED')
    .reduce((acc, o) => acc + (o.total || 0), 0);

  // Today's orders
  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter((o) => o.createdAt && o.createdAt.startsWith(todayStr)).length;

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

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Operational Overview</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time e-commerce performance metrics, revenue analytics and inventory health
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToOrders}
            className="px-3.5 py-2 rounded-lg bg-[#008236] hover:bg-[#006e2e] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            Review Orders
          </button>
          <button
            onClick={onNavigateToProducts}
            className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            Update Catalog
          </button>
        </div>
      </div>

      {/* Metric Cards Grid - Exact Professional Polish Theme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Total Revenue</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-slate-900">৳{totalRevenue.toLocaleString()}</h3>
            <span className="text-[#008236] text-xs font-bold bg-[#008236]/10 px-2 py-0.5 rounded-full border border-[#008236]/20">
              Active
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-[#008236] h-full w-[85%]" />
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Total Orders Placed</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-slate-900">{totalOrders}</h3>
            <span className="text-[#008236] text-xs font-bold bg-[#008236]/10 px-2 py-0.5 rounded-full border border-[#008236]/20">
              +{todayOrders} Today
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-[#008236] h-full w-[70%]" />
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Pending Orders</p>
          <div className="flex items-baseline gap-2">
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
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Low Stock Items (&lt;10)</p>
          <div className="flex items-baseline gap-2">
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

      {/* Secondary Status Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
            <span className="text-xs font-semibold text-slate-500">Active Shirt Colors</span>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{products.length}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center">
            <Shirt className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Today's Inflow</span>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{todayOrders}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Recent Orders & Low Stock Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Orders Table (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900">Recent Customer Orders</h3>
              <p className="text-slate-400 text-xs mt-0.5">Latest real-time transactions</p>
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
            <div className="p-8 text-center text-xs text-slate-500">
              No orders placed yet. New customer orders will appear here automatically.
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
                      <td className="p-4 pl-6 font-semibold font-mono text-slate-900">
                        {o.orderNumber}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-900">{o.customer?.name}</div>
                        <div className="text-xs text-slate-500">{o.customer?.phone}</div>
                      </td>
                      <td className="p-4 text-xs text-slate-500 max-w-[200px] truncate">
                        {o.items?.map((it) => `${it.productName} (${it.size}) x${it.quantity}`).join(', ')}
                      </td>
                      <td className="p-4 font-bold text-slate-900">৳{o.total}</td>
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
