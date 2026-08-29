import React, { useState } from 'react';
import { Plus, Trash2, Save, CheckCircle2, TableProperties, Info } from 'lucide-react';
import { SizeChart, SizeChartRow } from '../types';
import { saveSizeChart } from '../services/settings';

interface SizeChartCMSProps {
  sizeChart: SizeChart;
  onUpdated: () => void;
}

export const SizeChartCMS: React.FC<SizeChartCMSProps> = ({ sizeChart, onUpdated }) => {
  const [data, setData] = useState<SizeChart>(JSON.parse(JSON.stringify(sizeChart)));
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleAddRow = () => {
    const newRow: SizeChartRow = {
      size: '3XL',
      values: new Array(Math.max(1, data.columns.length - 1)).fill('0'),
    };
    setData({ ...data, rows: [...data.rows, newRow] });
  };

  const handleDeleteRow = (index: number) => {
    const updated = data.rows.filter((_, i) => i !== index);
    setData({ ...data, rows: updated });
  };

  const handleRowSizeChange = (rowIndex: number, newSize: string) => {
    const rows = [...data.rows];
    rows[rowIndex].size = newSize;
    setData({ ...data, rows });
  };

  const handleValueChange = (rowIndex: number, colIndex: number, val: string) => {
    const rows = [...data.rows];
    rows[rowIndex].values[colIndex] = val;
    setData({ ...data, rows });
  };

  const handleColumnNameChange = (colIndex: number, name: string) => {
    const cols = [...data.columns];
    cols[colIndex] = name;
    setData({ ...data, columns: cols });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage(null);

    try {
      await saveSizeChart(data);
      setSaveMessage('Size chart updated successfully!');
      onUpdated();
    } catch (e: any) {
      setSaveMessage('Failed to save: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Size Chart CMS</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure measurements table, columns, European size disclaimer, and rows
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Size Chart'}</span>
        </button>
      </div>

      {saveMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs sm:text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Main Settings Card */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-6">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Section Title</label>
          <input
            type="text"
            value={data.title || ''}
            onChange={(e) => setData({ ...data, title: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs font-medium focus:bg-white focus:border-emerald-600 focus:outline-none"
          />
        </div>

        {/* Table Editor */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-2">
              <TableProperties className="w-4 h-4 text-emerald-600" />
              <span>Measurements Matrix</span>
            </span>
            <button
              type="button"
              onClick={handleAddRow}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Size Row</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {data.columns.map((col, idx) => (
                    <th key={idx} className="p-3">
                      <input
                        type="text"
                        value={col || ''}
                        onChange={(e) => handleColumnNameChange(idx, e.target.value)}
                        className="w-full px-2 py-1 rounded bg-white border border-slate-200 text-slate-900 text-xs font-bold uppercase text-center focus:border-emerald-600 focus:outline-none"
                      />
                    </th>
                  ))}
                  <th className="p-3 text-right text-slate-400 w-16">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {data.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50/50">
                    <td className="p-3 w-28">
                      <input
                        type="text"
                        value={row.size || ''}
                        onChange={(e) => handleRowSizeChange(rIdx, e.target.value)}
                        className="w-full px-2 py-1.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-center text-xs"
                      />
                    </td>
                    {row.values.map((val, vIdx) => (
                      <td key={vIdx} className="p-3">
                        <input
                          type="text"
                          value={val || ''}
                          onChange={(e) => handleValueChange(rIdx, vIdx, e.target.value)}
                          className="w-full px-2 py-1.5 rounded bg-slate-50 border border-slate-200 text-slate-800 text-center text-xs font-semibold focus:bg-white focus:border-emerald-600 focus:outline-none"
                        />
                      </td>
                    ))}
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(rIdx)}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                        title="Delete Row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Disclaimer Note */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-emerald-600" />
            <span>Table Footer Disclaimer Note</span>
          </label>
          <textarea
            rows={2}
            value={data.note || ''}
            onChange={(e) => setData({ ...data, note: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs font-medium focus:bg-white focus:border-emerald-600 focus:outline-none resize-none"
          />
        </div>
      </div>
    </form>
  );
};
