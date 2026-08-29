import React from 'react';
import { ShoppingBag, PhoneCall, Sparkles, ShieldCheck } from 'lucide-react';
import { StoreSettings } from '../../types';

interface NavbarProps {
  storeSettings?: StoreSettings;
  storeName?: string;
  phone?: string;
  itemCount?: number;
  onScrollToOrder?: () => void;
  onScrollToSizes?: () => void;
  onOpenAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  storeSettings,
  storeName,
  phone,
  itemCount = 0,
  onScrollToOrder,
  onOpenAdmin,
}) => {
  const effectiveStoreName = storeName || storeSettings?.storeName || 'WEFT';
  const effectivePhone = phone || storeSettings?.phone || '';
  const logoSrc = 'https://i.ibb.co.com/5hcdCy8k/Chat-GPT-Image-Aug-29-2026-01-41-24-PM.png';

  const scrollToOrder = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onScrollToOrder) {
      onScrollToOrder();
      return;
    }
    const el = document.getElementById('order-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="relative w-full bg-[#071426] border-b border-[#0f2b4c] shadow-sm sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <a href="#top" className="flex items-center gap-2 sm:gap-3 group shrink-0">
          <img
            src={logoSrc}
            alt={`${effectiveStoreName} Logo`}
            className="h-8 sm:h-11 w-auto max-w-[110px] sm:max-w-[160px] object-contain"
            referrerPolicy="no-referrer"
            onError={(e) => {
              // Fallback in case of image load delay
              e.currentTarget.style.display = 'none';
              const fallback = document.getElementById('navbar-text-fallback');
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          <div id="navbar-text-fallback" className="hidden flex-col">
            <span className="font-serif font-black text-xl sm:text-2xl tracking-[0.18em] text-white leading-none">
              {effectiveStoreName}
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-[0.25em] text-[#008236]">
              Premium Oxford
            </span>
          </div>
        </a>

        {/* Right Action: Order Now Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={scrollToOrder}
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-[#008236] hover:bg-[#006e2e] active:scale-95 text-white px-3 sm:px-4.5 py-2 sm:py-2.5 min-h-[40px] sm:min-h-[44px] rounded-lg font-semibold text-xs sm:text-sm shadow-sm shadow-[#008236]/25 transition-all cursor-pointer whitespace-nowrap"
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>এখনই অর্ডার করুন</span>
            {itemCount > 0 && (
              <span className="ml-0.5 bg-black/30 text-white text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-full font-bold">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
