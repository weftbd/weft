import React, { useState } from 'react';
import { Save, CheckCircle2, Footprints } from 'lucide-react';
import { FooterSettings } from '../types';
import { saveFooterSettings } from '../services/settings';

interface FooterCMSProps {
  footerSettings: FooterSettings;
  onUpdated: () => void;
}

export const FooterCMS: React.FC<FooterCMSProps> = ({ footerSettings, onUpdated }) => {
  const [data, setData] = useState<FooterSettings>(
    JSON.parse(JSON.stringify(footerSettings))
  );
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage(null);

    try {
      await saveFooterSettings(data);
      setSaveMessage('Footer information updated successfully!');
      onUpdated();
    } catch (e: any) {
      setSaveMessage('Failed to save: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Footer CMS</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Customize footer details, contact channels, and social media handles
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Footer Settings'}</span>
        </button>
      </div>

      {saveMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs sm:text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Footprints className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900">Brand & Contact Information</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Brand Description
            </label>
            <textarea
              rows={2}
              value={data.brandDescription || ''}
              onChange={(e) => setData({ ...data, brandDescription: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs font-medium resize-none focus:bg-white focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Hotline Phone</label>
            <input
              type="text"
              value={data.phone || ''}
              onChange={(e) => setData({ ...data, phone: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs font-medium focus:bg-white focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Support Email
            </label>
            <input
              type="email"
              value={data.email || ''}
              onChange={(e) => setData({ ...data, email: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs font-medium focus:bg-white focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              WhatsApp Number
            </label>
            <input
              type="text"
              value={data.whatsapp || ''}
              onChange={(e) => setData({ ...data, whatsapp: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs font-medium focus:bg-white focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Store Office Address
            </label>
            <input
              type="text"
              value={data.address || ''}
              onChange={(e) => setData({ ...data, address: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs font-medium focus:bg-white focus:border-emerald-600 focus:outline-none"
            />
          </div>

          {/* Social Links */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Facebook Page URL
            </label>
            <input
              type="url"
              value={data.facebook || ''}
              onChange={(e) => setData({ ...data, facebook: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs focus:bg-white focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Instagram Profile URL
            </label>
            <input
              type="url"
              value={data.instagram || ''}
              onChange={(e) => setData({ ...data, instagram: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs focus:bg-white focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Copyright Notice Text
            </label>
            <input
              type="text"
              value={data.copyrightText || ''}
              onChange={(e) => setData({ ...data, copyrightText: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs focus:bg-white focus:border-emerald-600 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </form>
  );
};
