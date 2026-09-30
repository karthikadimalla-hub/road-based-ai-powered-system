import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { ShieldAlert, Sparkles, Lock, Mail, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  navigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ navigate }) => {
  const { login, demoLogin } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      showToast('Logged in successfully. Welcome!', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      showToast(err.message || 'Login failed. Please check your credentials.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemo = async (role: 'citizen' | 'admin') => {
    setSubmitting(true);
    try {
      await demoLogin(role);
      showToast(`Logged in as Demo ${role === 'citizen' ? 'Citizen' : 'Safety Officer'}.`, 'success');
      navigate(role === 'citizen' ? '/dashboard' : '/admin');
    } catch (err: any) {
      showToast(err.message || 'Demo login failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center mx-auto shadow-md shadow-orange-600/30">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Sign In to RoadSafe India
        </h1>
        <p className="text-xs text-slate-500">
          Access your submitted reports and monitor road hazard resolutions.
        </p>
      </div>

      {/* 1-Click Evaluation Box */}
      <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200 space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-orange-900">
          <Sparkles className="w-3.5 h-3.5 text-orange-600" />
          <span>Quick 1-Click Demo Evaluation:</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleQuickDemo('citizen')}
            className="p-2.5 rounded-xl bg-white border border-orange-200 hover:border-orange-400 text-left shadow-2xs transition-all"
          >
            <div className="text-xs font-bold text-slate-800">Demo Citizen</div>
            <div className="text-[10px] text-slate-500">citizen@roadsafe.in</div>
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleQuickDemo('admin')}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-left shadow-2xs transition-all"
          >
            <div className="text-xs font-bold">Safety Inspector</div>
            <div className="text-[10px] text-indigo-200">admin@roadsafe.in</div>
          </button>
        </div>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. rajesh@example.com"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-orange-600/20 transition-all flex items-center justify-center gap-2"
        >
          <span>{submitting ? 'Authenticating...' : 'Sign In'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-500">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="text-orange-600 font-bold hover:underline"
            >
              Register here
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};
