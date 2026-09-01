import React from 'react';
import { Sparkles } from 'lucide-react';

interface PromotionalImageProps {
  image?: {
    url: string;
    alt: string;
    badge?: string;
    title?: string;
  };
  promotionalImage?: {
    url: string;
    alt: string;
    badge?: string;
    title?: string;
  };
  onScrollToOrder?: () => void;
}

export const PromotionalImage: React.FC<PromotionalImageProps> = ({
  image,
  promotionalImage,
  onScrollToOrder,
}) => {
  const effectiveImage = image || promotionalImage;
  if (!effectiveImage || !effectiveImage.url) return null;

  return (
    <section className="py-6 sm:py-10 max-w-5xl mx-auto px-4 sm:px-6">
      <div
        onClick={onScrollToOrder}
        className={`relative rounded-2xl overflow-hidden shadow-sm border border-[#0f2b4c] bg-[#071426] group ${
          onScrollToOrder ? 'cursor-pointer' : ''
        }`}
      >
        <img
          src={effectiveImage.url}
          alt={effectiveImage.alt || 'WEFT Premium Cotton Shirt Banner'}
          className="w-full h-auto max-h-[500px] object-cover object-center group-hover:scale-101 transition-transform duration-700 ease-out"
          loading="eager"
          decoding="async"
          referrerPolicy="no-referrer"
        />

        {/* Subtle overlay gradient & badge */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#071426]/90 via-transparent to-transparent flex flex-col justify-end p-6 sm:p-8 pointer-events-none">
          {effectiveImage.badge && (
            <div className="inline-flex items-center gap-1.5 self-start px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-neutral-700 text-white text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              {effectiveImage.badge}
            </div>
          )}
          {effectiveImage.title && (
            <h2 className="text-white text-lg sm:text-2xl md:text-3xl font-bold tracking-tight drop-shadow-md">
              {effectiveImage.title}
            </h2>
          )}
        </div>
      </div>
    </section>
  );
};
