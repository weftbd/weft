import React from 'react';
import { trackContact } from '../../services/metaPixel';

interface FloatingWhatsAppProps {
  phone?: string;
  storeName?: string;
}

export const FloatingWhatsApp: React.FC<FloatingWhatsAppProps> = ({
  phone = '01348289477',
  storeName = 'Taarok',
}) => {
  // Normalize Bangladeshi number for wa.me (e.g., 01348289477 -> 8801348289477)
  const digits = (phone || '01348289477').replace(/[^0-9]/g, '');
  const formattedWaNumber = digits.startsWith('880')
    ? digits
    : digits.startsWith('0')
    ? `88${digits}`
    : `8801348289477`;

  const defaultMessage = `হ্যালো ${storeName}, আমি আপনাদের প্রিমিয়াম শার্ট সম্পর্কে জানতে চাচ্ছি।`;
  const whatsappUrl = `https://wa.me/${formattedWaNumber}?text=${encodeURIComponent(defaultMessage)}`;

  return (
    <div className="no-print fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-40 select-none">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackContact({ method: 'Floating WhatsApp Button' })}
        aria-label="Chat on WhatsApp"
        title="WhatsApp: 01348289477"
        className="group relative flex items-center justify-center w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#1ebe5d] active:scale-95 text-white shadow-lg shadow-[#25D366]/40 hover:shadow-xl hover:shadow-[#25D366]/60 transition-all duration-300"
      >
        {/* Subtle outer pulse ring */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30 pointer-events-none" />

        {/* Official WhatsApp Vector Logo */}
        <svg
          viewBox="0 0 32 32"
          className="w-7 h-7 sm:w-8 sm:h-8 fill-current relative z-10 transition-transform duration-300 group-hover:scale-110"
          aria-hidden="true"
        >
          <path d="M16.004 2.667C8.64 2.667 2.667 8.64 2.667 16c0 2.348.612 4.64 1.773 6.663L2.56 29.333l6.844-1.795A13.268 13.268 0 0 0 16.004 29.333c7.363 0 13.33-5.973 13.33-13.333S23.367 2.667 16.004 2.667zm7.768 18.844c-.325.915-1.892 1.747-2.615 1.855-.695.104-1.573.148-2.54-.159-.587-.185-1.339-.435-2.303-.851-4.052-1.749-6.697-5.829-6.9-6.1-.201-.271-1.648-2.193-1.648-4.184s1.043-2.969 1.413-3.375c.371-.405.809-.507 1.079-.507.269 0 .539.003.775.015.248.012.581-.095.908.693.336.811 1.145 2.796 1.245 2.999.101.203.168.439.033.709-.135.271-.203.439-.405.676-.203.236-.425.528-.607.709-.203.203-.413.423-.177.828.236.405 1.048 1.729 2.251 2.801 1.547 1.379 2.851 1.807 3.256 2.009.405.203.641.169.877-.101.236-.271 1.012-1.181 1.281-1.587.271-.405.539-.337.911-.203.371.135 2.36 1.113 2.765 1.316.405.203.675.304.776.473.101.169.101.979-.224 1.895z" />
        </svg>
      </a>
    </div>
  );
};
