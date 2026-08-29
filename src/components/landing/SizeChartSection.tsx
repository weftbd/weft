import React from 'react';
import { Ruler, Info } from 'lucide-react';
import { SizeChart } from '../../types';

interface SizeChartSectionProps {
  sizeChart: SizeChart;
}

export const SizeChartSection: React.FC<SizeChartSectionProps> = ({ sizeChart }) => {
  if (!sizeChart || !sizeChart.rows || sizeChart.rows.length === 0) return null;

  return (
    <section id="size-chart" className="py-12 sm:py-16 bg-slate-50 border-y border-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#008236]/10 text-[#008236] text-xs font-semibold uppercase tracking-wider mb-2">
            <Ruler className="w-3.5 h-3.5 text-[#008236]" />
            <span>Measurement Guide</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {sizeChart.title || 'SIZE CHART'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
            পারফেক্ট ফিটিংস নিশ্চিত করতে আপনার শার্টের সাইজ মিলিয়ে নিন
          </p>
        </div>

        {/* Table Container */}
        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left border-collapse min-w-[420px] sm:min-w-[500px]">
              <thead>
                <tr className="bg-[#071426] text-white">
                  {sizeChart.columns.map((col, idx) => (
                    <th
                      key={idx}
                      className={`py-3 px-3 sm:py-3.5 sm:px-6 text-[11px] sm:text-sm font-semibold uppercase tracking-wider ${
                        idx === 0 ? 'text-left pl-4 sm:pl-6' : 'text-center'
                      }`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 text-xs sm:text-sm font-medium">
                {sizeChart.rows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className={`transition-colors hover:bg-[#008236]/5 ${
                      rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                    }`}
                  >
                    <td className="py-2.5 px-3 sm:py-3 sm:px-6 pl-4 sm:pl-6 font-bold text-slate-900 text-xs sm:text-sm">
                      <span className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-slate-100 font-bold text-slate-800 border border-slate-200">
                        {row.size}
                      </span>
                    </td>
                    {row.values.map((val, vIdx) => (
                      <td key={vIdx} className="py-2.5 px-3 sm:py-3 sm:px-6 text-center font-medium text-slate-700 text-xs sm:text-sm">
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer Note */}
          <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm text-slate-600 font-normal">
            {sizeChart.note && (
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-[#008236] shrink-0 mt-0.5" />
                <span>{sizeChart.note}</span>
              </div>
            )}
            <span className="text-[10px] sm:text-xs text-slate-400 sm:hidden">
              👉 পুরো চার্ট দেখতে ডানে-বামে স্ক্রোল করুন
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
