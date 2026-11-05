import React from 'react';
import { Ruler, Info } from 'lucide-react';
import { SizeChart } from '../../types';

interface SizeChartSectionProps {
  sizeChart: SizeChart;
}

export const SizeChartSection: React.FC<SizeChartSectionProps> = ({ sizeChart }) => {
  if (!sizeChart || !sizeChart.rows || sizeChart.rows.length === 0) return null;

  return (
    <section id="size-chart" className="py-8 sm:py-14 bg-slate-50 border-y border-slate-200">
      <div className="max-w-3xl mx-auto px-3 sm:px-6">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#008236]/10 text-[#008236] text-[11px] sm:text-xs font-semibold uppercase tracking-wider mb-2">
            <Ruler className="w-3.5 h-3.5 text-[#008236]" />
            <span>Measurement Guide</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            {sizeChart.title || 'SIZE CHART'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            পারফেক্ট ফিটিংস নিশ্চিত করতে আপনার শার্টের সাইজ মিলিয়ে নিন
          </p>
        </div>

        {/* 100% Fully Responsive Non-Scrollable Table */}
        <div className="w-full rounded-xl border border-slate-200 shadow-xs bg-white overflow-hidden">
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr className="bg-[#071426] text-white">
                {sizeChart.columns.map((col, idx) => {
                  // Format column labels for mobile if verbose
                  const cleanCol = col.replace(/\s*\(INCH\)/i, '');
                  return (
                    <th
                      key={idx}
                      className={`py-2.5 sm:py-3.5 px-1 sm:px-3 text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wider text-center ${
                        idx === 0 ? 'w-[20%] sm:w-[22%]' : ''
                      }`}
                    >
                      <span className="block sm:hidden leading-tight">
                        {cleanCol}
                        <span className="block text-[8px] font-normal opacity-75 lowercase">(inch)</span>
                      </span>
                      <span className="hidden sm:inline">{col}</span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 text-[11px] sm:text-xs md:text-sm font-medium">
              {sizeChart.rows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className={`transition-colors hover:bg-[#008236]/5 ${
                    rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                  }`}
                >
                  <td className="py-2 sm:py-2.5 px-1 sm:px-3 text-center font-bold text-slate-900">
                    <span className="inline-flex items-center justify-center min-w-6 h-6 sm:min-w-7 sm:h-7 px-1.5 rounded-md bg-slate-100 font-bold text-slate-800 border border-slate-200 text-[10px] sm:text-xs">
                      {row.size}
                    </span>
                  </td>
                  {row.values.map((val, vIdx) => (
                    <td key={vIdx} className="py-2 sm:py-2.5 px-1 sm:px-3 text-center font-semibold text-slate-700">
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Table Footer Note (Clean, No Emojis) */}
          {sizeChart.note && (
            <div className="p-2.5 sm:p-3.5 bg-slate-50 border-t border-slate-200 flex items-start gap-2 text-[11px] sm:text-xs text-slate-600 font-normal">
              <Info className="w-3.5 h-3.5 text-[#008236] shrink-0 mt-0.5" />
              <span>{sizeChart.note}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
