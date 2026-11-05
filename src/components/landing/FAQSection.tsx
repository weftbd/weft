import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { FAQItem } from '../../types';

interface FAQSectionProps {
  faqs: FAQItem[];
}

export const FAQSection: React.FC<FAQSectionProps> = ({ faqs }) => {
  const activeFaqs = faqs.filter((f) => f.active);
  const [openId, setOpenId] = useState<string | null>(activeFaqs[0]?.id || null);

  if (activeFaqs.length === 0) return null;

  const toggleFaq = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="faq" className="py-8 sm:py-16 bg-white border-t border-slate-200">
      <div className="max-w-4xl mx-auto px-3 sm:px-6">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full bg-[#008236]/10 text-[#008236] text-[11px] sm:text-xs font-semibold uppercase tracking-wider mb-2">
            <HelpCircle className="w-3.5 h-3.5 text-[#008236]" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            সাধারণ জিজ্ঞাসা ও উত্তর (FAQ)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 sm:mt-1.5 font-normal">
            অর্ডার ও ডেলিভারি সম্পর্কিত আপনার যেকোনো প্রশ্নের সহজ সমাধান
          </p>
        </div>

        {/* Accordion list */}
        <div className="space-y-2.5 sm:space-y-3">
          {activeFaqs.map((faq) => {
            const isOpen = openId === faq.id;

            return (
              <div
                key={faq.id}
                className={`rounded-xl border transition-all overflow-hidden ${
                  isOpen
                    ? 'border-[#008236]/60 bg-[#008236]/5 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full p-3.5 sm:p-5 text-left flex items-center justify-between gap-3 font-bold text-xs sm:text-base text-slate-900 hover:text-[#008236] cursor-pointer transition-colors"
                >
                  <span className="leading-snug">{faq.question}</span>
                  <div
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-[#008236] text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-3.5 pb-3.5 sm:px-5 sm:pb-5 pt-0 text-xs sm:text-sm text-slate-600 font-normal leading-relaxed border-t border-slate-100 animate-fade-in">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
