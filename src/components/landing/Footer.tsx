import React from 'react';
import {
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Facebook,
  Instagram,
} from 'lucide-react';
import { FooterSettings, StoreSettings } from '../../types';

interface FooterProps {
  footerSettings?: FooterSettings;
  storeSettings?: StoreSettings;
  onOpenAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  footerSettings,
  storeSettings,
}) => {
  const effectiveStoreName = storeSettings?.storeName || 'WEFT';
  const effectiveBrandDescription =
    footerSettings?.brandDescription ||
    'WEFT হলো আধুনিক লাইফস্টাইল ও প্রিমিয়াম ফ্যাশন ব্র্যান্ড। আমরা শতভাগ কোয়ালিটি সম্পন্ন এক্সপোর্ট অক্সফোর্ড কটন শার্ট সরবরাহ করি সাশ্রয়ী মূল্যে।';
  const whatsappDigits = footerSettings?.whatsapp
    ? footerSettings.whatsapp.replace(/[^0-9]/g, '')
    : '';
  const logoSrc = 'https://i.ibb.co.com/5hcdCy8k/Chat-GPT-Image-Aug-29-2026-01-41-24-PM.png';

  return (
    <footer className="bg-[#071426] text-neutral-300 pt-10 sm:pt-14 pb-10 sm:pb-8 border-t border-[#0f2b4c]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-10 pb-8 sm:pb-12 border-b border-[#0f2b4c]">
          {/* Brand Info (4 cols) */}
          <div className="lg:col-span-4 space-y-3 sm:space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={logoSrc}
                alt={`${effectiveStoreName} Logo`}
                className="h-9 sm:h-12 w-auto max-w-[140px] sm:max-w-[150px] object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed font-normal pr-2 sm:pr-4">
              {effectiveBrandDescription}
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-2 pt-1 sm:pt-2">
              {footerSettings?.facebook && (
                <a
                  href={footerSettings.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-[#0b1f3a] border border-[#163761] hover:bg-[#008236] hover:text-white flex items-center justify-center text-neutral-400 transition-colors active:scale-95"
                  title="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {footerSettings?.instagram && (
                <a
                  href={footerSettings.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-[#0b1f3a] border border-[#163761] hover:bg-[#008236] hover:text-white flex items-center justify-center text-neutral-400 transition-colors active:scale-95"
                  title="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {whatsappDigits && (
                <a
                  href={`https://wa.me/${whatsappDigits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-[#0b1f3a] border border-[#163761] hover:bg-[#008236] hover:text-white flex items-center justify-center text-neutral-400 transition-colors active:scale-95"
                  title="WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links (3 cols) */}
          <div className="lg:col-span-3 space-y-2.5 sm:space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              কুইক লিংকস
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm font-normal text-neutral-400">
              {(footerSettings?.quickLinks || []).map((link, idx) => (
                <li key={idx}>
                  <a
                    href={link.url}
                    className="hover:text-[#008236] transition-colors inline-block py-0.5"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Support (2 cols) */}
          <div className="lg:col-span-2 space-y-2.5 sm:space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              গ্রাহক সেবা
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm font-normal text-neutral-400">
              {(footerSettings?.supportLinks || []).map((link, idx) => (
                <li key={idx}>
                  <a
                    href={link.url}
                    className="hover:text-[#008236] transition-colors inline-block py-0.5"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details (3 cols) */}
          <div className="lg:col-span-3 space-y-2.5 sm:space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              যোগাযোগ করুন
            </h4>
            <div className="space-y-2.5 text-xs sm:text-sm text-neutral-400 font-normal">
              {footerSettings?.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#008236] shrink-0" />
                  <a href={`tel:${footerSettings.phone}`} className="hover:text-white transition-colors py-0.5">
                    {footerSettings.phone}
                  </a>
                </div>
              )}
              {footerSettings?.email && (
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#008236] shrink-0" />
                  <a href={`mailto:${footerSettings.email}`} className="hover:text-white transition-colors py-0.5">
                    {footerSettings.email}
                  </a>
                </div>
              )}
              {footerSettings?.address && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#008236] shrink-0 mt-0.5" />
                  <span>{footerSettings.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-5 sm:pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500 font-normal text-center sm:text-left">
          <p>{footerSettings?.copyrightText || '© 2026 WEFT Bangladesh. All rights reserved.'}</p>
        </div>
      </div>
    </footer>
  );
};
