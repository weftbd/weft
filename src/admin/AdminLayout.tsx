import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Shirt,
  TableProperties,
  Sparkles,
  Truck,
  HelpCircle,
  Footprints,
  Settings,
  LogOut,
  ExternalLink,
  Eye,
  Menu,
  X,
  Bell,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { AdminUser, logoutAdmin } from '../services/auth';

export type AdminTab =
  | 'dashboard'
  | 'orders'
  | 'products'
  | 'homepage'
  | 'size-chart'
  | 'shipping'
  | 'faqs'
  | 'footer'
  | 'settings';

interface AdminLayoutProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  adminUser: AdminUser;
  onLogout: () => void;
  onViewSite: () => void;
  onToggleLivePreview: () => void;
  pendingOrderCount: number;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  activeTab,
  onTabChange,
  adminUser,
  onLogout,
  onViewSite,
  onToggleLivePreview,
  pendingOrderCount,
  children,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: { id: AdminTab; label: string; icon: any; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders Management', icon: ShoppingCart, badge: pendingOrderCount },
    { id: 'products', label: 'Products & Inventory', icon: Shirt },
    { id: 'homepage', label: 'Homepage & Hero CMS', icon: Sparkles },
    { id: 'size-chart', label: 'Size Chart CMS', icon: TableProperties },
    { id: 'shipping', label: 'Shipping & Delivery', icon: Truck },
    { id: 'faqs', label: 'FAQ Manager', icon: HelpCircle },
    { id: 'footer', label: 'Footer CMS', icon: Footprints },
    { id: 'settings', label: 'Store Settings', icon: Settings },
  ];

  const handleLogoutClick = async () => {
    await logoutAdmin();
    onLogout();
  };

  const getPageTitle = (tab: AdminTab) => {
    switch (tab) {
      case 'dashboard':
        return 'Operational Overview';
      case 'orders':
        return 'Orders Management';
      case 'products':
        return 'Product Catalog & Inventory';
      case 'homepage':
        return 'Homepage & Promotional Hero';
      case 'size-chart':
        return 'Size Chart & Fit Guide';
      case 'shipping':
        return 'Shipping Zones & Rules';
      case 'faqs':
        return 'Frequently Asked Questions';
      case 'footer':
        return 'Footer & Social Branding';
      case 'settings':
        return 'Store Configuration';
      default:
        return 'Admin Portal';
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[#1E293B] flex font-sans antialiased">
      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[270px] lg:w-[280px] bg-[#071426] flex flex-col h-full border-r border-[#0f2b4c] transition-transform duration-300 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 sm:p-5 flex flex-col h-full overflow-hidden">
          {/* Logo Brand */}
          <div className="flex items-center justify-between mb-5 px-1 pt-1 shrink-0">
            <div className="flex items-center gap-3">
              <img
                src="https://i.ibb.co.com/5hcdCy8k/Chat-GPT-Image-Aug-29-2026-01-41-24-PM.png"
                alt="WEFT Logo"
                className="h-9 w-auto max-w-[130px] object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden text-neutral-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden space-y-1 custom-scrollbar pr-1 py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setMobileOpen(false);
                  }}
                  className={`px-3 py-2.5 rounded-lg flex items-center justify-between text-xs sm:text-[13px] font-medium cursor-pointer transition-all ${
                    isActive
                      ? 'bg-[#008236]/20 text-[#008236] font-semibold shadow-xs'
                      : 'text-neutral-300 hover:text-white hover:bg-[#0b1f3a]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isActive ? (
                      <div className="w-1.5 h-1.5 bg-[#008236] rounded-full shrink-0" />
                    ) : (
                      <Icon className="w-4 h-4 text-neutral-400 shrink-0" />
                    )}
                    <span className="whitespace-nowrap font-medium">{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#008236]/20 text-[#008236] border border-[#008236]/30 shrink-0 ml-2">
                      {item.badge}
                    </span>
                  )}
                </div>
              );
            })}
          </nav>

          {/* User Profile & Footer Actions */}
          <div className="mt-auto pt-4 border-t border-[#0f2b4c] shrink-0">
            <div className="flex items-center gap-3 mb-3.5 px-1">
              <div className="w-9 h-9 bg-[#0b1f3a] rounded-full border border-[#163761] flex items-center justify-center text-white font-bold text-xs shrink-0">
                {(adminUser.displayName || adminUser.email || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold truncate">
                  {adminUser.displayName || adminUser.email || 'Admin Executive'}
                </p>
                <p className="text-neutral-400 text-[11px] truncate">Store Administrator</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onViewSite}
                className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-[#0b1f3a] hover:bg-[#112a4d] text-neutral-200 text-xs font-semibold transition-colors cursor-pointer border border-[#163761]"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Live Site</span>
              </button>
              <button
                onClick={handleLogoutClick}
                className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-[#0b1f3a] hover:bg-rose-950/60 text-neutral-300 hover:text-rose-300 text-xs font-semibold transition-colors cursor-pointer border border-[#163761]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 md:pl-[270px] lg:pl-[280px]">
        {/* Executive Header Bar */}
        <header className="h-[70px] bg-[#071426] border-b border-[#0f2b4c] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-lg bg-[#0b1f3a] text-neutral-200 hover:bg-[#112a4d]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">
                {getPageTitle(activeTab)}
              </h1>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-400">
                <span>WEFT Management</span>
                <span>/</span>
                <span className="capitalize text-neutral-300 font-medium">
                  {activeTab.replace('-', ' ')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 bg-[#0b1f3a] rounded-full border border-[#163761] text-neutral-400 text-xs">
              <Search className="w-3.5 h-3.5 text-neutral-400" />
              <span>Search management...</span>
              <span className="text-[10px] bg-[#071426] px-1.5 py-0.5 border border-[#163761] rounded font-mono text-neutral-400">
                ⌘K
              </span>
            </div>

            <button
              onClick={onToggleLivePreview}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#0b1f3a] hover:bg-[#112a4d] text-neutral-200 text-xs font-semibold transition-colors cursor-pointer border border-[#163761]"
            >
              <Eye className="w-4 h-4 text-[#008236]" />
              <span className="hidden sm:inline">Customer Preview</span>
            </button>

            <button
              onClick={onViewSite}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#008236] hover:bg-[#006e2e] text-white text-xs font-semibold transition-all cursor-pointer shadow-sm shadow-[#008236]/20"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Storefront</span>
            </button>

            <div className="w-9 h-9 flex items-center justify-center rounded-full bg-[#0b1f3a] border border-[#163761] cursor-pointer text-neutral-400 hover:text-white relative">
              <Bell className="w-4 h-4" />
              {pendingOrderCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#008236] absolute top-2 right-2 ring-2 ring-[#071426]" />
              )}
            </div>
          </div>
        </header>

        {/* Tab Content Container */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 content-start">{children}</main>
      </div>
    </div>
  );
};

