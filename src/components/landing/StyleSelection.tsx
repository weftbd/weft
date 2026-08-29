import React from 'react';
import { ShoppingCart, Check, Tag } from 'lucide-react';
import { Product, SelectedProductSelection } from '../../types';

interface StyleSelectionProps {
  title?: string;
  subtitle?: string;
  styleSettings?: {
    title?: string;
    subtitle?: string;
  };
  products?: Product[];
  selectedItems?: SelectedProductSelection[];
  onSelectProduct?: (productId: string) => void;
  onQuickOrder?: (productId: string) => void;
  onAddItem?: (productId: string, size?: string, quantity?: number) => void;
  onUpdateQuantity?: (productId: string, delta: number) => void;
  onRemoveItem?: (productId: string, size?: string) => void;
  onScrollToOrder?: () => void;
}

export const StyleSelection: React.FC<StyleSelectionProps> = ({
  title,
  subtitle,
  styleSettings,
  products = [],
  selectedItems = [],
  onSelectProduct,
  onQuickOrder,
  onAddItem,
  onScrollToOrder,
}) => {
  const activeProducts = products.filter((p) => p.active);
  const displayTitle = title || styleSettings?.title || 'Choose Your Style';
  const displaySubtitle =
    subtitle || styleSettings?.subtitle || '১০+ প্রিমিয়াম কালার কালেকশন থেকে আপনার পছন্দের শার্টটি বেছে নিন';

  const handleProductClick = (productId: string) => {
    if (onSelectProduct) {
      onSelectProduct(productId);
    } else if (onAddItem) {
      onAddItem(productId, 'L', 1);
    }
  };

  const handleQuickOrder = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    if (onQuickOrder) {
      onQuickOrder(productId);
    } else {
      handleProductClick(productId);
      if (onScrollToOrder) {
        onScrollToOrder();
      } else {
        const el = document.getElementById('order-form');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section id="products" className="py-8 sm:py-16 max-w-6xl mx-auto px-3 sm:px-6">
      {/* Section Header */}
      <div className="text-center mb-6 sm:mb-12">
        <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight relative inline-block pb-2 sm:pb-3">
          {displayTitle}
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 sm:w-16 h-1 bg-[#008236] rounded-full" />
        </h2>
        {displaySubtitle && (
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-base text-slate-600 max-w-xl mx-auto font-normal px-2">
            {displaySubtitle}
          </p>
        )}
      </div>

      {/* Product Cards Grid: 2 columns on mobile & tablet, 3 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6">
        {activeProducts.map((product) => {
          const isSelected = selectedItems.some((item) => item.productId === product.id);
          const discount =
            product.originalPrice > product.price ? product.originalPrice - product.price : 0;

          return (
            <div
              key={product.id}
              onClick={() => handleProductClick(product.id)}
              className={`group relative bg-white rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col ${
                isSelected
                  ? 'border-[#008236] shadow-sm ring-1.5 ring-[#008236]'
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              {/* Top Badges */}
              <div className="absolute top-2 left-2 right-2 sm:top-3 sm:left-3 sm:right-3 flex items-center justify-between z-10 pointer-events-none">
                {discount > 0 ? (
                  <span className="inline-flex items-center gap-0.5 sm:gap-1 bg-rose-500 text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded shadow-xs">
                    <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3" />৳{discount} OFF
                  </span>
                ) : (
                  <span />
                )}

                {/* Selection indicator checkbox */}
                <div
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-[#008236] text-white shadow-xs'
                      : 'bg-white/90 text-slate-300 border border-slate-300 shadow-xs'
                  }`}
                >
                  <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
                </div>
              </div>

              {/* Product Image */}
              <div className="relative aspect-4/5 w-full bg-slate-100 overflow-hidden">
                <img
                  src={product.image.url}
                  alt={product.image.alt || product.name}
                  className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500"
                  loading="lazy"
                />
              </div>

              {/* Card Details */}
              <div className="p-2.5 sm:p-4 flex flex-col grow justify-between">
                <div>
                  <h3 className="font-bold text-xs sm:text-base text-slate-900 line-clamp-1 mb-0.5 sm:mb-1">
                    {product.name}
                  </h3>

                  {/* Pricing line */}
                  <div className="flex items-baseline gap-1 sm:gap-2 mb-2.5 sm:mb-3.5">
                    <span className="text-sm sm:text-lg font-bold text-slate-900">
                      ৳{product.price}
                    </span>
                    {product.originalPrice > product.price && (
                      <span className="text-[10px] sm:text-sm font-medium text-slate-400 line-through">
                        ৳{product.originalPrice}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Action Button */}
                <button
                  onClick={(e) => handleQuickOrder(e, product.id)}
                  className={`w-full py-2 sm:py-2.5 px-2 rounded-lg font-bold text-[11px] sm:text-sm inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#008236] text-white shadow-sm'
                      : 'bg-slate-900 hover:bg-[#008236] text-white shadow-xs'
                  } active:scale-95`}
                >
                  <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                  <span className="truncate">{isSelected ? 'সিলেক্টেড ✓' : 'অর্ডার করুন'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
