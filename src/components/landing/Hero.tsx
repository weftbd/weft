import React from 'react';
import { ShoppingCart, Check, Star, Users, Truck } from 'lucide-react';
import { HeroSettings } from '../../types';

interface HeroProps {
  hero?: HeroSettings;
  onCtaClick?: () => void;
  onScrollToOrder?: () => void;
  onScrollToStyles?: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  hero,
  onCtaClick,
  onScrollToOrder,
  onScrollToStyles,
}) => {
  if (!hero || hero.enabled === false) return null;

  const handleCta = () => {
    if (onCtaClick) {
      onCtaClick();
    } else if (onScrollToOrder) {
      onScrollToOrder();
    } else {
      const el = document.getElementById('order-form');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative pt-6 pb-10 sm:pt-12 sm:pb-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-3.5 sm:px-6 text-center">
        {/* Promotional Top Badge */}
        {hero.badge && (
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-[#008236]/10 border border-[#008236]/30 shadow-xs mb-3.5 sm:mb-5 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-[#008236] animate-pulse" />
            <span className="text-[11px] sm:text-sm font-bold tracking-wider text-[#008236] uppercase">
              {hero.badge}
            </span>
          </div>
        )}

        {/* Large Hero Headline */}
        <h1 className="text-xl sm:text-3xl md:text-5xl font-bold text-slate-900 tracking-tight leading-snug sm:leading-[1.2] mb-3 sm:mb-4 px-1">
          {hero.title || 'প্রিমিয়াম অক্সফোর্ড কটন শার্ট'}
        </h1>

        {/* Hero Subtitle if exists */}
        {hero.subtitle && (
          <p className="max-w-2xl mx-auto text-xs sm:text-base text-slate-600 leading-relaxed mb-5 sm:mb-6 font-normal px-2">
            {hero.subtitle}
          </p>
        )}

        {/* Pricing Cards Box */}
        <div className="flex flex-row flex-wrap items-center justify-center gap-2.5 sm:gap-4 mb-4 sm:mb-5">
          {/* Regular Price */}
          {hero.regularPrice && (
            <div className="bg-white px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-1.5 sm:gap-2 text-slate-500">
              <span className="text-xs sm:text-sm font-medium">Regular:</span>
              <span className="text-xs sm:text-base font-semibold line-through text-slate-400">
                ৳{hero.regularPrice}
              </span>
            </div>
          )}

          {/* Offer Price Highlight Card */}
          <div className="bg-white px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl border-2 border-[#008236] shadow-sm flex items-center gap-2 text-slate-900">
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#008236] flex items-center justify-center text-white shrink-0">
              <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
            </div>
            <div className="flex items-baseline gap-1 sm:gap-1.5">
              <span className="text-xs sm:text-sm font-semibold text-[#008236]">
                {hero.offerLabel || 'Offer Price'}
              </span>
              <span className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">
                ৳{hero.offerPrice || 990}
              </span>
            </div>
          </div>
        </div>

        {/* Free Delivery Banner Alert */}
        {hero.deliveryText && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-[#008236]/10 border border-[#008236]/25 text-slate-900 text-xs sm:text-sm font-semibold mb-6 sm:mb-8 max-w-xl mx-auto shadow-xs">
            <Truck className="w-4 h-4 text-[#008236] shrink-0" />
            <span className="text-left sm:text-center leading-tight">{hero.deliveryText}</span>
          </div>
        )}

        {/* CTA & Social Proof Line */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 pt-1 sm:pt-2">
          {/* Green CTA Button */}
          <button
            onClick={handleCta}
            className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2.5 bg-[#008236] hover:bg-[#006e2e] active:scale-98 text-white px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl font-bold text-sm sm:text-base shadow-sm shadow-[#008236]/25 transition-all cursor-pointer group"
          >
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-105" />
            <span>{hero.ctaText || 'এখনই অর্ডার করুন'}</span>
          </button>

          {/* Social Proof badge */}
          <div className="w-full sm:w-auto justify-center inline-flex items-center gap-3 px-4 py-2 sm:py-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
            {/* Small Avatar stack */}
            <div className="flex -space-x-2">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"
                alt="Customer"
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 border-white object-cover"
                loading="lazy"
              />
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80"
                alt="Customer"
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 border-white object-cover"
                loading="lazy"
              />
              <img
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop&q=80"
                alt="Customer"
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 border-white object-cover"
                loading="lazy"
              />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-0.5 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
                ))}
              </div>
              <div className="text-[11px] sm:text-xs font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                <span className="font-bold">{hero.customerCount || '৫০০+'}</span>
                <span className="text-slate-500">{hero.customerText || 'খুশি গ্রাহক'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
