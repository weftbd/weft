import React, { useState, useEffect } from 'react';
import {
  Save,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Loader2,
  FolderOpen,
  Check,
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

  // Sync internal state if parent homepage settings change
  useEffect(() => {
    if (homepage) {
      setFormData(JSON.parse(JSON.stringify(homepage)));
    }
  }, [homepage]);

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local preview
    const localUrl = URL.createObjectURL(file);
    setFormData((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        image: {
          url: localUrl,
          alt: prev.hero?.image?.alt || 'WEFT Hero Shirt Banner',
        },
      },
    }));

    setUploading('hero');
    try {
      const res = await uploadImageToImgBB(file);
      if (res.success && res.url) {
        setFormData((prev) => ({
          ...prev,
          hero: {
            ...prev.hero,
            image: {
              url: res.url!,
              alt: prev.hero?.image?.alt || 'WEFT Hero Shirt Banner',
            },
          },
        }));
      }
    } catch (err) {
      console.warn('Hero upload handled:', err);
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const handlePromoImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local preview
    const localUrl = URL.createObjectURL(file);
    setFormData((prev) => ({
      ...prev,
      promotionalImage: {
        ...prev.promotionalImage,
        url: localUrl,
      },
    }));

    setUploading('promo');
    try {
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
    } catch (err) {
      console.warn('Promo upload handled:', err);
    } finally {
      setUploading(null);
      e.target.value = '';
    }
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
    <form onSubmit={handleSave} className="space-y-6 animate-fade-in max-w-4xl pb-12">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Banner Preview */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Banner Live Preview
            </label>
            <div className="relative aspect-16/9 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shadow-xs group">
              {formData.promotionalImage?.url ? (
                <img
                  src={formData.promotionalImage.url}
                  alt={formData.promotionalImage?.alt || 'Promotional Banner'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs p-4 text-center">
                  <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                  <span>No banner image selected</span>
                </div>
              )}
              {formData.promotionalImage?.badge && (
                <div className="absolute top-3 left-3 bg-[#008236] text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-xs">
                  {formData.promotionalImage.badge}
                </div>
              )}
            </div>
          </div>

          {/* Upload Showcase Image Box & Badge */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Upload Showcase Banner Image
              </label>

              <label className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 hover:border-[#008236] bg-slate-50/70 hover:bg-emerald-50/30 rounded-xl cursor-pointer transition-all group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePromoImageUpload}
                  className="hidden"
                  disabled={uploading === 'promo'}
                />
                <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-600 group-hover:text-[#008236] group-hover:scale-105 transition-all mb-2">
                  {uploading === 'promo' ? (
                    <Loader2 className="w-6 h-6 animate-spin text-[#008236]" />
                  ) : (
                    <FolderOpen className="w-6 h-6" />
                  )}
                </div>

                <div className="text-center space-y-1">
                  <span className="text-xs font-bold text-slate-800 group-hover:text-[#008236] block">
                    {uploading === 'promo' ? 'Uploading Image...' : 'Click to Browse & Upload Image'}
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    PNG, JPG, WEBP recommended (1920×1080 or 16:9 ratio)
                  </span>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Banner Promotional Badge Text
              </label>
              <input
                type="text"
                value={formData.promotionalImage?.badge || ''}
                placeholder="PREMIUM EXPORT COLLECTION"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    promotionalImage: {
                      ...formData.promotionalImage,
                      badge: e.target.value,
                    },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#008236] focus:outline-none"
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
