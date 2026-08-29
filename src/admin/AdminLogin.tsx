import React, { useState } from 'react';
import { Lock, Mail, KeyRound, ArrowLeft, AlertCircle } from 'lucide-react';
import { loginAdmin } from '../services/auth';
import { AdminUser } from '../services/auth';

interface AdminLoginProps {
  onSuccess: (user: AdminUser) => void;
  onForgotPassword: () => void;
  onBackToSite: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onSuccess,
  onForgotPassword,
  onBackToSite,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await loginAdmin(email, password);
      if (res.success && res.user) {
        onSuccess(res.user);
      } else {
        setError(res.error || 'লগইন ব্যর্থ হয়েছে।');
      }
    } catch (err: any) {
      setError(err.message || 'লগইন করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <button
          onClick={onBackToSite}
          className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ওয়েবসাইটে ফিরে যান</span>
        </button>

        <div className="flex items-center justify-center gap-3 mb-3">
          <img
            src="https://i.ibb.co.com/VcS89hB8/Chat-GPT-Image-Aug-29-2026-01-57-43-PM.png"
            alt="WEFT Logo"
            className="h-12 w-auto max-w-[170px] object-contain"
            referrerPolicy="no-referrer"
          />
        </div>

        <h2 className="text-center text-xl font-bold text-slate-900">
          Executive Admin Portal
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Sign in to manage orders, products, size chart, and homepage CMS
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-lg shadow-slate-200/50 rounded-2xl border border-slate-200 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email || ''}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@weftbd.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 placeholder-slate-400 text-xs sm:text-sm font-medium focus:bg-white focus:border-[#008236] focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-[11px] font-semibold text-[#008236] hover:text-[#006e2e] cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password || ''}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 placeholder-slate-400 text-xs sm:text-sm font-medium focus:bg-white focus:border-[#008236] focus:outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[#008236] hover:bg-[#006e2e] active:scale-98 text-white font-semibold text-xs sm:text-sm shadow-sm shadow-[#008236]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
