import React, { useState, useEffect } from 'react';
import {
  Save,
  CheckCircle2,
  Settings,
  Store,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Share2,
  Truck,
  RotateCcw,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { StoreSettings } from '../types';
import { saveStoreSettings } from '../services/settings';
import { DEFAULT_STORE_SETTINGS } from '../data/defaults';

interface StoreSettingsCMSProps {
  storeSettings: StoreSettings;
  onUpdated: () => void;
}

export const StoreSettingsCMS: React.FC<StoreSettingsCMSProps> = ({
  storeSettings,
  onUpdated,
}) => {
  const [data, setData] = useState<StoreSettings>({
    ...DEFAULT_STORE_SETTINGS,
    ...(storeSettings || {}),
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Synchronize when parent settings are refreshed
  useEffect(() => {
    if (storeSettings) {
      setData({
        ...DEFAULT_STORE_SETTINGS,
        ...storeSettings,
      });
    }
  }, [storeSettings]);

  const cleanPrefix = (data.orderPrefix || 'WEFT')
    .toUpperCase()
    .replace(/CELL/g, 'WEFT')
    .replace(/[^A-Z0-9_-]/g, '')
    .replace(/[-_]+$/, '') || 'WEFT';

  const previewOrderNumber = `${cleanPrefix}-${new Date().getFullYear()}-849201`;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage(null);

    try {
      const payload: StoreSettings = {
        ...data,
        storeName: data.storeName.trim() || 'WEFT',
        orderPrefix: cleanPrefix,
        currency: data.currency.trim() || '৳',
        phone: data.phone.trim() || '+8801909999079',
        whatsapp: data.whatsapp.trim() || '+8801909999079',
        email: data.email.trim() || 'weftbd247@gmail.com',
        address: data.address.trim() || 'Road #11, Banani, Dhaka-1213, Bangladesh',
        facebook: data.facebook.trim(),
        instagram: data.instagram.trim(),
        tiktok: data.tiktok.trim(),
        freeShippingMinQty: Number(data.freeShippingMinQty) || 2,
        defaultShippingCharge: Number(data.defaultShippingCharge) || 70,
      };

      await saveStoreSettings(payload);
      setData(payload);
      setSaveMessage({
        type: 'success',
        text: 'Store configuration saved and applied successfully!',
      });
      onUpdated();
    } catch (err: any) {
      setSaveMessage({
        type: 'error',
        text: 'Failed to save store settings: ' + (err?.message || 'Unknown error'),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all store settings to default WEFT configuration?')) {
      setData(DEFAULT_STORE_SETTINGS);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-fade-in max-w-4xl pb-12">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Store className="w-6 h-6 text-[#008236]" />
            <span>Store Configuration</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your brand identity, order ID prefixes, contact channels, and checkout parameters.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#008236] hover:bg-[#006e2e] text-white text-xs sm:text-sm font-semibold shadow-sm shadow-[#008236]/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* Save Notification */}
      {saveMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs sm:text-sm font-semibold animate-fade-in ${
            saveMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {saveMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{saveMessage.text}</span>
        </div>
      )}

      {/* SECTION 1: Brand & Order ID Prefix */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Settings className="w-5 h-5 text-[#008236]" />
          <div>
            <h3 className="text-base font-bold text-slate-900">Brand & Order Identification</h3>
            <p className="text-xs text-slate-500">Configure store naming and automated invoice prefixing</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Store Brand Name
            </label>
            <input
              type="text"
              required
              value={data.storeName || ''}
              onChange={(e) => setData({ ...data, storeName: e.target.value })}
              placeholder="WEFT"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#008236] focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Order ID Prefix
              </label>
              <span className="text-[10px] text-slate-500 font-mono">Example: WEFT</span>
            </div>
            <input
              type="text"
              required
              value={data.orderPrefix || ''}
              onChange={(e) =>
                setData({
                  ...data,
                  orderPrefix: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''),
                })
              }
              placeholder="WEFT"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs font-mono font-bold uppercase focus:bg-white focus:border-[#008236] focus:outline-none"
            />
            {/* Live Order ID Preview Badge */}
            <div className="mt-2 flex items-center gap-2 p-2 rounded-md bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600">
              <Sparkles className="w-3.5 h-3.5 text-[#008236]" />
              <span>Next generated Order ID:</span>
              <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                {previewOrderNumber}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Currency Symbol / Code
            </label>
            <input
              type="text"
              value={data.currency || '৳'}
              onChange={(e) => setData({ ...data, currency: e.target.value })}
              placeholder="৳ (or BDT)"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs font-semibold focus:bg-white focus:border-[#008236] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Default Shipping Fallback (৳)
            </label>
            <input
              type="number"
              min={0}
              value={data.defaultShippingCharge ?? 70}
              onChange={(e) =>
                setData({ ...data, defaultShippingCharge: Math.max(0, parseInt(e.target.value) || 0) })
              }
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#008236] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: Contact & Customer Support */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Phone className="w-5 h-5 text-[#008236]" />
          <div>
            <h3 className="text-base font-bold text-slate-900">Official Contact & Support Channels</h3>
            <p className="text-xs text-slate-500">
              Numbers and email shown on order confirmations, navbar, and footer
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Hotline Phone Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={data.phone || ''}
                onChange={(e) => setData({ ...data, phone: e.target.value })}
                placeholder="+8801909999079"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#008236] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              WhatsApp Support Number
            </label>
            <div className="relative">
              <MessageCircle className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={data.whatsapp || ''}
                onChange={(e) => setData({ ...data, whatsapp: e.target.value })}
                placeholder="+8801909999079"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#008236] focus:outline-none"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Customer Support Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={data.email || ''}
                onChange={(e) => setData({ ...data, email: e.target.value })}
                placeholder="weftbd247@gmail.com"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#008236] focus:outline-none"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Office / Warehouse Address
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={data.address || ''}
                onChange={(e) => setData({ ...data, address: e.target.value })}
                placeholder="House 42, Road 11, Block D, Banani, Dhaka-1213"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#008236] focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Social Profiles */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Share2 className="w-5 h-5 text-[#008236]" />
          <div>
            <h3 className="text-base font-bold text-slate-900">Social Media Links</h3>
            <p className="text-xs text-slate-500">Connected profiles displayed in footer icons</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Facebook URL</label>
            <input
              type="text"
              value={data.facebook || ''}
              onChange={(e) => setData({ ...data, facebook: e.target.value })}
              placeholder="https://facebook.com/weftfashionbd"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#008236] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Instagram URL</label>
            <input
              type="text"
              value={data.instagram || ''}
              onChange={(e) => setData({ ...data, instagram: e.target.value })}
              placeholder="https://instagram.com/weftfashionbd"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#008236] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">TikTok URL</label>
            <input
              type="text"
              value={data.tiktok || ''}
              onChange={(e) => setData({ ...data, tiktok: e.target.value })}
              placeholder="https://tiktok.com/@weftfashionbd"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#008236] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* SECTION 4: Free Shipping Offer Rule */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Truck className="w-5 h-5 text-[#008236]" />
          <div>
            <h3 className="text-base font-bold text-slate-900">Free Delivery Offer Rules</h3>
            <p className="text-xs text-slate-500">
              Control when customers get automatic ৳0 delivery on checkout
            </p>
          </div>
        </div>

        <div className="max-w-md">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Minimum Item Quantity for Free Delivery
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={data.freeShippingMinQty ?? 2}
            onChange={(e) =>
              setData({
                ...data,
                freeShippingMinQty: Math.max(1, parseInt(e.target.value) || 1),
              })
            }
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs font-semibold focus:bg-white focus:border-[#008236] focus:outline-none"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Customers ordering {data.freeShippingMinQty || 2} or more shirts will automatically receive ৳0 Free Delivery.
          </p>
        </div>
      </div>
    </form>
  );
};
