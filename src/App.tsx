import React, { useState, useEffect } from 'react';
import { useData } from './hooks/useData';
import { Navbar } from './components/landing/Navbar';
import { Hero } from './components/landing/Hero';
import { PromotionalImage } from './components/landing/PromotionalImage';
import { StyleSelection } from './components/landing/StyleSelection';
import { SizeChartSection } from './components/landing/SizeChartSection';
import { OrderFormSection } from './components/landing/OrderFormSection';
import { OrderSuccessModal } from './components/landing/OrderSuccessModal';
import { TrustSection } from './components/landing/TrustSection';
import { FAQSection } from './components/landing/FAQSection';
import { Footer } from './components/landing/Footer';

// Admin components
import { AdminLogin } from './admin/AdminLogin';
import { ForgotPassword } from './admin/ForgotPassword';
import { AdminLayout, AdminTab } from './admin/AdminLayout';
import { DashboardOverview } from './admin/DashboardOverview';
import { OrdersManager } from './admin/OrdersManager';
import { ProductsManager } from './admin/ProductsManager';
import { HomepageCMS } from './admin/HomepageCMS';
import { SizeChartCMS } from './admin/SizeChartCMS';
import { ShippingCMS } from './admin/ShippingCMS';
import { FAQSCMS } from './admin/FAQSCMS';
import { FooterCMS } from './admin/FooterCMS';
import { StoreSettingsCMS } from './admin/StoreSettingsCMS';
import { LivePreviewModal } from './admin/LivePreviewModal';

import { getCurrentAdmin, AdminUser } from './services/auth';
import { Order } from './types';
import { initMetaPixel, trackPageView } from './services/metaPixel';

export function App() {
  const {
    products,
    orders,
    homepage,
    sizeChart,
    shippingMethods,
    faqs,
    footer,
    storeSettings,
    selectedItems,
    addItem,
    updateItemQuantity,
    removeItem,
    clearSelectedItems,
    toggleProductSelection,
    updateItemSize,
    selectSingleProductAndScroll,
    refreshAll,
  } = useData();

  // Navigation view state: 'store' | 'admin-login' | 'admin-forgot-password' | 'admin-dashboard'
  const [view, setView] = useState<'store' | 'admin-login' | 'admin-forgot-password' | 'admin-dashboard'>('store');
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');
  const [adminUser, setAdminUser] = useState<AdminUser | null>(getCurrentAdmin());
  const [showLivePreview, setShowLivePreview] = useState(false);

  // Placed Order modal state
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  // Initialize Meta Pixel with store settings and handle URL hash routing (/admin or #admin)
  useEffect(() => {
    if (storeSettings?.metaTrackingEnabled !== false) {
      initMetaPixel(storeSettings?.metaPixelId);
    }

    const handleLocation = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;

      if (path.startsWith('/admin') || hash === '#admin') {
        const current = getCurrentAdmin();
        if (current) {
          setAdminUser(current);
          setView('admin-dashboard');
        } else {
          setView('admin-login');
        }
      } else {
        setView('store');
        trackPageView();
      }
    };

    handleLocation();
    window.addEventListener('popstate', handleLocation);
    window.addEventListener('hashchange', handleLocation);
    return () => {
      window.removeEventListener('popstate', handleLocation);
      window.removeEventListener('hashchange', handleLocation);
    };
  }, [storeSettings?.metaPixelId, storeSettings?.metaTrackingEnabled]);

  const handleScrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleOpenAdmin = () => {
    const current = getCurrentAdmin();
    if (current) {
      setAdminUser(current);
      setView('admin-dashboard');
    } else {
      setView('admin-login');
    }
    window.history.pushState({}, '', '#admin');
  };

  const handleBackToStore = () => {
    setView('store');
    window.history.pushState({}, '', '/');
  };

  const handleAdminLoginSuccess = (user: AdminUser) => {
    setAdminUser(user);
    setView('admin-dashboard');
  };

  const handleAdminLogout = () => {
    setAdminUser(null);
    setView('store');
    window.history.pushState({}, '', '/');
  };

  // ----------------------------------------------------
  // ADMIN VIEWS
  // ----------------------------------------------------
  if (view === 'admin-forgot-password') {
    return (
      <ForgotPassword onBackToLogin={() => setView('admin-login')} />
    );
  }

  if (view === 'admin-login') {
    return (
      <AdminLogin
        onSuccess={handleAdminLoginSuccess}
        onForgotPassword={() => setView('admin-forgot-password')}
        onBackToSite={handleBackToStore}
      />
    );
  }

  if (view === 'admin-dashboard' && adminUser) {
    const pendingOrdersCount = orders.filter((o) => o.orderStatus === 'PENDING').length;

    return (
      <>
        <AdminLayout
          activeTab={adminTab}
          onTabChange={setAdminTab}
          adminUser={adminUser}
          onLogout={handleAdminLogout}
          onViewSite={handleBackToStore}
          onToggleLivePreview={() => setShowLivePreview(true)}
          pendingOrderCount={pendingOrdersCount}
        >
          {adminTab === 'dashboard' && (
            <DashboardOverview
              orders={orders}
              products={products}
              onNavigateToOrders={() => setAdminTab('orders')}
              onNavigateToProducts={() => setAdminTab('products')}
            />
          )}

          {adminTab === 'orders' && (
            <OrdersManager
              orders={orders}
              products={products}
              shippingMethods={shippingMethods}
              storeSettings={storeSettings}
              onOrderUpdated={refreshAll}
            />
          )}

          {adminTab === 'products' && (
            <ProductsManager products={products} onProductsUpdated={refreshAll} />
          )}

          {adminTab === 'homepage' && (
            <HomepageCMS homepage={homepage} onUpdated={refreshAll} />
          )}

          {adminTab === 'size-chart' && (
            <SizeChartCMS sizeChart={sizeChart} onUpdated={refreshAll} />
          )}

          {adminTab === 'shipping' && (
            <ShippingCMS
              shippingMethods={shippingMethods}
              storeSettings={storeSettings}
              onUpdated={refreshAll}
            />
          )}

          {adminTab === 'faqs' && (
            <FAQSCMS faqs={faqs} onUpdated={refreshAll} />
          )}

          {adminTab === 'footer' && (
            <FooterCMS footerSettings={footer} onUpdated={refreshAll} />
          )}

          {adminTab === 'settings' && (
            <StoreSettingsCMS storeSettings={storeSettings} onUpdated={refreshAll} />
          )}
        </AdminLayout>

        {showLivePreview && (
          <LivePreviewModal onClose={() => setShowLivePreview(false)} />
        )}
      </>
    );
  }

  // ----------------------------------------------------
  // PUBLIC STOREFRONT LANDING PAGE
  // ----------------------------------------------------
  const activeProducts = products.filter((p) => p.active);
  const offerPrice = homepage.hero?.offerPrice || 990;
  const totalItemCount = selectedItems.reduce((acc, it) => acc + it.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 font-sans">
      {/* 1. Header / Navbar */}
      <Navbar
        storeSettings={storeSettings}
        storeName={storeSettings?.storeName}
        phone={storeSettings?.phone}
        itemCount={totalItemCount}
        onScrollToOrder={() => handleScrollToSection('order-form')}
        onScrollToSizes={() => handleScrollToSection('size-chart')}
        onOpenAdmin={handleOpenAdmin}
      />

      {/* 2. Hero Section */}
      <Hero
        hero={homepage.hero}
        onScrollToOrder={() => handleScrollToSection('order-form')}
        onScrollToStyles={() => handleScrollToSection('products')}
      />

      {/* 3. Promotional Full-Width / Showcase Image */}
      <PromotionalImage
        promotionalImage={homepage.promotionalImage}
        onScrollToOrder={() => handleScrollToSection('order-form')}
      />

      {/* 4. Choose Your Style / Product Catalog Section */}
      <StyleSelection
        title={homepage.styleSection?.title}
        subtitle={homepage.styleSection?.subtitle}
        products={activeProducts}
        selectedItems={selectedItems}
        onSelectProduct={toggleProductSelection}
        onQuickOrder={selectSingleProductAndScroll}
        onScrollToOrder={() => handleScrollToSection('order-form')}
      />

      {/* 5. Size Chart Section */}
      <SizeChartSection sizeChart={sizeChart} />

      {/* 6. Checkout / Order Form Section */}
      <OrderFormSection
        products={activeProducts}
        selectedItems={selectedItems}
        shippingMethods={shippingMethods}
        storeSettings={storeSettings}
        onToggleProduct={toggleProductSelection}
        onUpdateSize={updateItemSize}
        onUpdateQuantity={updateItemQuantity}
        onOrderSuccess={(newOrder) => {
          setPlacedOrder(newOrder);
          clearSelectedItems();
          refreshAll();
        }}
      />

      {/* 7. Trust & Guarantee Section */}
      <TrustSection />

      {/* 8. Frequently Asked Questions (FAQ) Section */}
      <FAQSection faqs={faqs} />

      {/* 9. Luxury Dark Navy Footer */}
      <Footer
        footerSettings={footer}
        storeSettings={storeSettings}
        onOpenAdmin={handleOpenAdmin}
      />

      {/* Placed Order Confirmation Modal */}
      {placedOrder && (
        <OrderSuccessModal
          order={placedOrder}
          storeSettings={storeSettings}
          whatsappPhone={footer?.whatsapp || storeSettings?.whatsapp || '8801909999079'}
          onClose={() => setPlacedOrder(null)}
        />
      )}
    </div>
  );
}

export default App;
