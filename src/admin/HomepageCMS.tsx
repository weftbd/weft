import React, { useState } from 'react';
import {
  Save,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { HomepageSettings } from '../types';
import { saveHomepageSettings } from '../services/settings';
import { uploadImageToImgBB } from '../services/imgbb';

interface HomepageCMSProps {
  homepage: HomepageSettings;
  onUpdated: () => void;
}

export const HomepageCMS: React.FC<HomepageCMSProps> = ({ homepage, onUpdated }) => {
  const [formData, setFormData] = useState<HomepageSettings>(
    JSON.parse(JSON.stringify(homepage))
  );
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading('hero');
    const res = await uploadImageToImgBB(file);
    if (res.success && res.url) {
      setFormData((prev) => ({
        ...prev,
        hero: {
          ...prev.hero,
          image: {
            url: res.url!,
            alt: prev.hero.image.alt || 'WEFT Hero Shirt Banner',
          },
        },
      }));
    }
    setUploading(null);
  };

  const handlePromoImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading('promo');
    const res = await uploadImageToImgBB(file);
    if (res.success && res.url) {
      setFormData((prev) => ({
        ...prev,
        promotionalImage: {
          ...prev.promotionalImage,
          url: res.url!,
        },
      }));
    }
    setUploading(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage(null);

    try {
      await saveHomepageSettings(formData);
      setSaveMessage('Homepage settings published successfully!');
      onUpdated();
    } catch (err: any) {
      setSaveMessage('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-fade-in max-w-4xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Homepage & Hero CMS</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Customize all promotional headlines, badges, prices, and banners without touching code
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#008236] hover:bg-[#006e2e] text-white text-xs sm:text-sm font-semibold shadow-sm shadow-[#008236]/20 transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Publishing Changes...' : 'Save & Publish Changes'}</span>
        </button>
      </div>

      {saveMessage && (
        <div className="p-4 bg-[#008236]/10 border border-[#008236]/20 rounded-xl text-[#008236] text-xs sm:text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* 1. HERO SECTION */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#008236]" />
            <h3 className="text-base font-bold text-slate-900">Hero Section Configuration</h3>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <span>Enabled</span>
            <input
              type="checkbox"
              checked={Boolean(formData.hero?.enabled)}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  hero: { ...formData.hero, enabled: e.target.checked },
                })
              }
              className="rounded border-slate-300 text-[#008236] focus:ring-[#008236]"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Badge */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Top Badge Text</label>
            <input
              type="text"
              value={formData.hero?.badge || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  hero: { ...formData.hero, badge: e.target.value },
                })
              }
              placeholder="PREMIUM OXFORD COTTON"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#008236] focus:outline-none"
            />
          </div>

          {/* Regular Price */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Regular Price (৳)
            </label>
            <input
              type="number"
              value={formData.hero?.regularPrice ?? ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  hero: { ...formData.hero, regularPrice: Number(e.target.value) },
                })
              }
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#008236] focus:outline-none"
            />
          </div>

          {/* Hero Title */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Main Hero Headline
            </label>
            <input
              type="text"
              value={formData.hero?.title || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  hero: { ...formData.hero, title: e.target.value },
                })
              }
              placeholder="Experience Premium Comfort & Export Quality Shirts"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#008236] focus:outline-none"
            />
          </div>

          {/* Subtitle */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Hero Description / Subtitle
            </label>
            <textarea
              rows={2}
              value={formData.hero?.subtitle || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  hero: { ...formData.hero, subtitle: e.target.value },
                })
              }
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#008236] focus:outline-none resize-none"
            />
          </div>

          {/* Offer Label & Price */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Offer Label Text
            </label>
            <input
              type="text"
              value={formData.hero?.offerLabel || 'Offer Price'}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  hero: { ...formData.hero, offerLabel: e.target.value },
                })
              }
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#008236] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Offer Price (৳)
            </label>
            <input
              type="number"
              value={formData.hero?.offerPrice ?? ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  hero: { ...formData.hero, offerPrice: Number(e.target.value) },
                })
              }
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#008236] focus:outline-none"
            />
          </div>

          {/* Delivery Promotion */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Delivery Promotion Callout Text
            </label>
            <input
              type="text"
              value={formData.hero?.deliveryText || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  hero: { ...formData.hero, deliveryText: e.target.value },
                })
              }
              placeholder="যেকোনো ২ পিস বা তার অধিক শার্ট অর্ডার করলে ডেলিভারি চার্জ ফ্রি"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#008236] focus:outline-none"
            />
          </div>

          {/* CTA Text */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Hero CTA Button Text
            </label>
            <input
              type="text"
              value={formData.hero?.ctaText || 'এখনই অর্ডার করুন'}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  hero: { ...formData.hero, ctaText: e.target.value },
                })
              }
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#008236] focus:outline-none"
            />
          </div>

          {/* Customer Social Proof */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Count</label>
              <input
                type="text"
                value={formData.hero?.customerCount || '৫০০+'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hero: { ...formData.hero, customerCount: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#008236] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Label</label>
              <input
                type="text"
                value={formData.hero?.customerText || 'খুশি গ্রাহক'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hero: { ...formData.hero, customerText: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#008236] focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. PROMOTIONAL SHOWCASE IMAGE */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <ImageIcon className="w-5 h-5 text-[#008236]" />
          <h3 className="text-base font-bold text-slate-900">
            Promotional Showcase Image Banner
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div className="aspect-16/9 rounded-lg bg-slate-100 overflow-hidden border border-slate-200">
            <img
              src={formData.promotionalImage?.url || ''}
              alt={formData.promotionalImage?.alt || 'Promotional Banner'}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-3">
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer transition-colors border border-slate-200">
              <UploadCloud className="w-4 h-4 text-[#008236]" />
              <span>{uploading === 'promo' ? 'Uploading...' : 'Upload Showcase Image (ImgBB)'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePromoImageUpload}
                className="hidden"
              />
            </label>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Image URL</label>
              <input
                type="url"
                value={formData.promotionalImage?.url || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    promotionalImage: { ...formData.promotionalImage, url: e.target.value },
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs focus:bg-white focus:border-[#008236] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Badge Text</label>
              <input
                type="text"
                value={formData.promotionalImage?.badge || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    promotionalImage: { ...formData.promotionalImage, badge: e.target.value },
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs focus:bg-white focus:border-[#008236] focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. STYLE SECTION TITLE */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          "Choose Your Style" Section Heading
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Section Title</label>
            <input
              type="text"
              value={formData.styleSection?.title || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  styleSection: { ...formData.styleSection, title: e.target.value },
                })
              }
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#008236] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Section Subtitle</label>
            <input
              type="text"
              value={formData.styleSection?.subtitle || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  styleSection: { ...formData.styleSection, subtitle: e.target.value },
                })
              }
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#008236] focus:outline-none"
            />
          </div>
        </div>
      </div>
    </form>
  );
};
