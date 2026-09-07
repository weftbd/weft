import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, HelpCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { FAQItem } from '../types';
import { saveFAQs } from '../services/settings';

interface FAQSCMSProps {
  faqs: FAQItem[];
  onUpdated: () => void;
}

export const FAQSCMS: React.FC<FAQSCMSProps> = ({ faqs, onUpdated }) => {
  const [list, setList] = useState<FAQItem[]>(JSON.parse(JSON.stringify(faqs || [])));
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (faqs) {
      setList(JSON.parse(JSON.stringify(faqs)));
    }
  }, [faqs]);

  const handleAddFaq = () => {
    const newItem: FAQItem = {
      id: 'faq-' + Date.now(),
      question: 'নতুন প্রশ্ন এখানে লিখুন',
      answer: 'এখানে বিস্তারিত উত্তর লিখুন।',
      sortOrder: list.length + 1,
      active: true,
    };
    setList([...list, newItem]);
  };

  const handleDelete = (id: string) => {
    setList(list.filter((f) => f.id !== id));
  };

  const handleUpdate = (index: number, field: keyof FAQItem, val: any) => {
    const copy = [...list];
    copy[index] = { ...copy[index], [field]: val };
    setList(copy);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage(null);

    try {
      await saveFAQs(list);
      setSaveMessage('FAQs saved successfully!');
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
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">FAQ Management CMS</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage customer frequently asked questions and answers
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save FAQs'}</span>
        </button>
      </div>

      {saveMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs sm:text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">Questions & Answers</h3>
          </div>
          <button
            type="button"
            onClick={handleAddFaq}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add FAQ Question</span>
          </button>
        </div>

        <div className="space-y-4">
          {list.map((faq, idx) => (
            <div
              key={faq.id}
              className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <input
                  type="text"
                  value={faq.question || ''}
                  onChange={(e) => handleUpdate(idx, 'question', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 font-semibold text-xs sm:text-sm focus:border-emerald-600 focus:outline-none"
                  placeholder="Question in Bengali/English"
                />

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleUpdate(idx, 'active', !faq.active)}
                    className={`p-2 rounded-lg text-xs cursor-pointer ${
                      faq.active ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                    title={faq.active ? 'Visible on site' : 'Hidden'}
                  >
                    {faq.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(faq.id)}
                    className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <textarea
                rows={2}
                value={faq.answer || ''}
                onChange={(e) => handleUpdate(idx, 'answer', e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs leading-relaxed resize-none focus:border-emerald-600 focus:outline-none"
                placeholder="Detailed answer text..."
              />
            </div>
          ))}
        </div>
      </div>
    </form>
  );
};
