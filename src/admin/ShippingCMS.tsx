import React, { useState } from 'react';
import { Plus, Trash2, Save, Truck, CheckCircle2, Sparkles } from 'lucide-react';
import { ShippingMethod, StoreSettings } from '../types';
import { saveShippingMethods, saveStoreSettings } from '../services/settings';

interface ShippingCMSProps {
  shippingMethods: ShippingMethod[];
  storeSettings: StoreSettings;
  onUpdated: () => void;
}

export const ShippingCMS: React.FC<ShippingCMSProps> = ({
  shippingMethods,
  storeSettings,
  onUpdated,
}) => {
  const [methods, setMethods] = useState<ShippingMethod[]>(
    JSON.parse(JSON.stringify(shippingMethods))
  );
  const [freeQty, setFreeQty] = useState<number>(storeSettings.freeShippingMinQty || 2);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleAddMethod = () => {
    const newMethod: ShippingMethod = {
      id: 'shipping-' + Date.now(),
      name: 'Sub-Dhaka / Express (সাব-ঢাকা এলাকা)',
      charge: 100,
      active: true,
      estimatedTime: '24-48 Hours',
    };
    setMethods([...methods, newMethod]);
  };

  const handleDeleteMethod = (id: string) => {
    setMethods(methods.filter((m) => m.id !== id));
  };

  const handleUpdateField = (index: number, field: keyof ShippingMethod, val: any) => {
    const copy = [...methods];
    copy[index] = { ...copy[index], [field]: val };
    setMethods(copy);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage(null);

    try {
      await saveShippingMethods(methods);
      await saveStoreSettings({ ...storeSettings, freeShippingMinQty: freeQty });
      setSaveMessage('Shipping settings saved successfully!');
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
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Shipping & Delivery CMS</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure delivery zones, delivery charges, and free delivery thresholds
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Shipping Settings'}</span>
        </button>
      </div>

      {saveMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs sm:text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Free Shipping Rule Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm sm:text-base font-bold text-slate-900">Free Delivery Promo Rule</h3>
        </div>
        <div className="max-w-md">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Minimum Order Quantity for FREE Delivery
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              value={freeQty ?? ''}
              onChange={(e) => setFreeQty(Number(e.target.value))}
              className="w-24 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-sm font-bold text-center focus:bg-white focus:border-emerald-600 focus:outline-none"
            />
            <span className="text-xs text-slate-500 font-medium">
              Shirts or more = ৳0 Shipping charge
            </span>
          </div>
        </div>
      </div>

      {/* Shipping Zones List */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">Delivery Locations & Charges</h3>
          </div>
          <button
            type="button"
            onClick={handleAddMethod}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Delivery Zone</span>
          </button>
        </div>

        <div className="space-y-3">
          {methods.map((method, idx) => (
            <div
              key={method.id}
              className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="grow space-y-2">
                <input
                  type="text"
                  value={method.name || ''}
                  onChange={(e) => handleUpdateField(idx, 'name', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:border-emerald-600 focus:outline-none"
                  placeholder="Location Name"
                />
                <input
                  type="text"
                  value={method.estimatedTime || ''}
                  onChange={(e) => handleUpdateField(idx, 'estimatedTime', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-[11px] focus:border-emerald-600 focus:outline-none"
                  placeholder="Estimated Delivery Time (e.g. 24-48 Hours)"
                />
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="w-28">
                  <label className="block text-[10px] text-slate-500 font-semibold mb-1">
                    Charge (৳)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={method.charge ?? 0}
                    onChange={(e) => handleUpdateField(idx, 'charge', Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-emerald-600 font-bold text-center text-xs focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => handleDeleteMethod(method.id)}
                    className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                    title="Delete Method"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </form>
  );
};
