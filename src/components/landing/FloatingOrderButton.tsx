import React from 'react';
import { ShoppingCart, ArrowRight } from 'lucide-react';

interface FloatingOrderButtonProps {
  offerPrice: number;
  onScrollToOrder: () => void;
}

export const FloatingOrderButton: React.FC<FloatingOrderButtonProps> = ({
  offerPrice,
  onScrollToOrder,
}) => {
  return (
    <div className="fixed bottom-3 left-3 right-3 z-40 sm:hidden animate-slide-up pb-[env(safe-area-inset-bottom,0px)]">
      <button
        onClick={onScrollToOrder}
        className="relative overflow-hidden w-full bg-gradient-to-r from-[#008236] via-[#009b40] to-[#008236] hover:from-[#006e2e] hover:to-[#005a26] active:scale-[0.98] text-white py-3.5 px-4 rounded-xl font-bold text-sm shadow-xl shadow-[#008236]/40 flex items-center justify-between transition-all cursor-pointer border border-white/20 animate-order-pulse"
      >
        {/* Shimmer sweep */}
        <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer pointer-events-none" />

        <span className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center">
            <ShoppingCart className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-extrabold tracking-tight">এখনই অর্ডার করুন</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="bg-black/30 px-2.5 py-0.5 rounded-lg text-xs font-bold text-emerald-200 border border-white/10">
            ৳{offerPrice}
          </span>
          <ArrowRight className="w-4 h-4 text-white" />
        </span>
      </button>
    </div>
  );
};
