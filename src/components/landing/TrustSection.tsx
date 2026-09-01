import React from 'react';
import { ShieldCheck, Truck, Banknote, RefreshCw, Award, HeartHandshake } from 'lucide-react';
import { TrustItem } from '../../types';

interface TrustSectionProps {
  title?: string;
  items?: TrustItem[];
}

const DEFAULT_TRUST_ITEMS: TrustItem[] = [
  {
    icon: 'banknote',
    title: 'ক্যাশ অন ডেলিভারি',
    description: 'কোনো অগ্রিম টাকা ছাড়াই সম্পূর্ণ ক্যাশ অন ডেলিভারিতে শার্ট বুঝে নিন।',
  },
  {
    icon: 'refresh-cw',
    title: '৭ দিনে সহজ এক্সচেঞ্জ',
    description: 'সাইজ বা ফিটিংসে সমস্যা হলে দ্রুত ও সহজে ফ্রি সাইজ এক্সচেঞ্জ সুবিধা।',
  },
  {
    icon: 'award',
    title: '১০০% এক্সপোর্ট কটন',
    description: 'উচ্চমানের ১০০% প্রিমিয়াম সুতি অক্সফোর্ড কাপড়, যা দীর্ঘস্থায়ী ও আরামদায়ক।',
  },
  {
    icon: 'truck',
    title: 'দ্রুত হোম ডেলিভারি',
    description: 'সমগ্র বাংলাদেশে ২-৩ দিনের মধ্যে হোম ডেলিভারি নিশ্চিত করা হয়।',
  },
];

export const TrustSection: React.FC<TrustSectionProps> = ({
  title = 'কেন আমাদের কাছ থেকে অর্ডার করবেন?',
  items,
}) => {
  const displayItems = items && items.length > 0 ? items : DEFAULT_TRUST_ITEMS;

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'shield-check':
        return <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#008236] group-hover:text-white transition-colors" />;
      case 'truck':
        return <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-[#008236] group-hover:text-white transition-colors" />;
      case 'banknote':
        return <Banknote className="w-5 h-5 sm:w-6 sm:h-6 text-[#008236] group-hover:text-white transition-colors" />;
      case 'refresh-cw':
        return <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 text-[#008236] group-hover:text-white transition-colors" />;
      case 'award':
        return <Award className="w-5 h-5 sm:w-6 sm:h-6 text-[#008236] group-hover:text-white transition-colors" />;
      default:
        return <HeartHandshake className="w-5 h-5 sm:w-6 sm:h-6 text-[#008236] group-hover:text-white transition-colors" />;
    }
  };

  return (
    <section id="trust" className="py-8 sm:py-16 bg-slate-50 border-t border-slate-200">
      <div className="max-w-6xl mx-auto px-3 sm:px-6">
        {title && (
          <div className="text-center mb-6 sm:mb-10">
            <h2 className="text-xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 sm:mt-1.5 font-normal">
              আমাদের প্রতিটি শার্ট সর্বোচ্চ যত্ন ও শতভাগ কোয়ালিটি নিশ্চিত করে তৈরি
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
          {displayItems.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col items-center text-center group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#008236]/10 border border-[#008236]/20 flex items-center justify-center mb-2.5 sm:mb-4 group-hover:bg-[#008236] transition-colors">
                {renderIcon(item.icon)}
              </div>
              <h3 className="font-bold text-xs sm:text-base text-slate-900 mb-1 leading-snug">
                {item.title}
              </h3>
              <p className="text-[11px] sm:text-sm text-slate-600 leading-relaxed font-normal">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
