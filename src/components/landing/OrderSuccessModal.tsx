import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Package,
  Phone,
  MapPin,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Order, StoreSettings } from '../../types';

interface OrderSuccessModalProps {
  order: Order;
  storeSettings?: StoreSettings;
  whatsappPhone?: string;
  onClose: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  storeSettings,
  whatsappPhone,
  onClose,
}) => {
  useEffect(() => {
    // Fire festive celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00B44B', '#1E3A8A', '#F59E0B', '#10B981'],
      });
    } catch (e) {
      console.warn('Confetti effect skipped:', e);
    }
  }, []);

  const rawPhone = whatsappPhone || storeSettings?.whatsapp || '8801909999079';
  const whatsappNumber = rawPhone.replace(/[^0-9]/g, '');
  const storeName = storeSettings?.storeName || 'WEFT';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Hello ${storeName}, I have placed order #${order.orderNumber}. Name: ${order.customer.name}, Total: ৳${order.total}`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 border border-slate-200 shadow-xl relative my-8">
        {/* Brand Logo in Modal */}
        <div className="flex items-center justify-center mb-4">
          <img
            src="https://i.ibb.co.com/VcS89hB8/Chat-GPT-Image-Aug-29-2026-01-57-43-PM.png"
            alt={`${storeSettings.storeName || 'WEFT'} Logo`}
            className="h-9 w-auto max-w-[130px] object-contain"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Success Icon */}
        <div className="w-13 h-13 rounded-2xl bg-[#008236]/10 text-[#008236] flex items-center justify-center mx-auto mb-3 shadow-xs">
          <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            অর্ডার সফল হয়েছে!
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 font-normal mt-1">
            ধন্যবাদ! আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে। আমাদের প্রতিনিধি শীঘ্রই আপনার সাথে যোগাযোগ করবেন।
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 mb-6 text-xs sm:text-sm">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-semibold">অর্ডার নাম্বার:</span>
            <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded-md border border-slate-200">
              {order.orderNumber}
            </span>
          </div>

          {/* Items */}
          <div>
            <span className="text-slate-500 font-semibold block mb-1">অর্ডারকৃত শার্ট:</span>
            <div className="space-y-1">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center font-medium text-slate-800 text-xs sm:text-sm">
                  <span>
                    • {item.productName} ({item.size}) x {item.quantity}
                  </span>
                  <span className="font-semibold">৳{item.subtotal}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Breakdown */}
          <div className="border-t border-slate-200 pt-2 space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>ডেলিভারি চার্জ:</span>
              <span>{order.shipping === 0 ? 'ফ্রি (৳0)' : `৳${order.shipping}`}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 text-sm sm:text-base pt-1">
              <span>সর্বমোট মূল্য:</span>
              <span className="text-[#008236] font-bold">৳{order.total}</span>
            </div>
          </div>

          {/* Customer delivery snapshot */}
          <div className="border-t border-slate-200 pt-2.5 space-y-1 text-slate-600 text-xs">
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-[#008236] shrink-0" />
              <span>{order.customer.phone}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#008236] shrink-0 mt-0.5" />
              <span className="line-clamp-2">{order.customer.address}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 rounded-lg bg-[#008236] hover:bg-[#006e2e] active:scale-98 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>হোয়াটসঅ্যাপে আপডেট জানতে মেসেজ দিন</span>
          </a>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-[#008236] hover:bg-[#006e2e] active:scale-98 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <span>হোমে ফিরে যান</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 text-center">
          <span className="text-[11px] text-slate-400 font-normal inline-flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#008236]" />
            Cash on Delivery Verified
          </span>
        </div>
      </div>
    </div>
  );
};
