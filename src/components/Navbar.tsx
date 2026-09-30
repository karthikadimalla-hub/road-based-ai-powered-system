import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage, LanguageSwitcher } from '../context/LanguageContext';
import {
  ShieldAlert,
  PlusCircle,
  MapPin,
  ListFilter,
  LayoutDashboard,
  ShieldCheck,
  User,
  LogOut,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, navigate }) => {
  const { user, isAuthenticated, isAdmin, logout, demoLogin } = useAuth();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);

  const handleNav = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            onClick={() => handleNav('/')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 group-hover:text-orange-600 transition-colors">
                  RoadSafe
                </span>
                <span className="text-orange-600 font-extrabold text-lg">India</span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800 rounded-md">
                  AI Sentinel
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden sm:block font-medium">
                {t('nav.tagline', 'Citizen Safety & Transparent Prioritization')}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => handleNav('/')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                currentPath === '/'
                  ? 'text-orange-600 bg-orange-50 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {t('nav.home', 'Home')}
            </button>

            <button
              onClick={() => handleNav('/reports')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                currentPath === '/reports'
                  ? 'text-orange-600 bg-orange-50 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ListFilter className="w-4 h-4" />
              {t('nav.reports', 'Reports Feed')}
            </button>

            <button
              onClick={() => handleNav('/map')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                currentPath === '/map'
                  ? 'text-orange-600 bg-orange-50 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <MapPin className="w-4 h-4" />
              {t('nav.map', 'Safety Map')}
            </button>

            {isAuthenticated && (
              <button
                onClick={() => handleNav('/dashboard')}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  currentPath === '/dashboard'
                    ? 'text-orange-600 bg-orange-50 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                {t('nav.dashboard', 'My Dashboard')}
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => handleNav('/admin')}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  currentPath.startsWith('/admin')
                    ? 'text-indigo-700 bg-indigo-50 font-semibold'
                    : 'text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50/60'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                {t('nav.admin', 'Admin Portal')}
              </button>
            )}
          </nav>

          {/* Right Action Section */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Multilingual Selector */}
            <LanguageSwitcher />

            {/* Quick Demo Login Switcher */}
            <div className="relative">
              <button
                onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all bg-slate-50/50"
                title="Quickly test with demo roles"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Demo Switcher</span>
              </button>

              {demoMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setDemoMenuOpen(false)}
                >
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Instant College Evaluation
                  </div>
                  <button
                    onClick={() => demoLogin('citizen')}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-orange-50 hover:text-orange-700 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold">Demo Citizen</div>
                      <div className="text-[10px] text-slate-500">Rajesh Kumar (Citizen)</div>
                    </div>
                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">
                      User
                    </span>
                  </button>
                  <button
                    onClick={() => demoLogin('admin')}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold">Demo Safety Officer</div>
                      <div className="text-[10px] text-slate-500">Pooja Sharma (Inspector)</div>
                    </div>
                    <span className="text-[10px] bg-indigo-100 px-1.5 py-0.5 rounded text-indigo-700 font-mono font-bold">
                      Admin
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Report New Hazard Button */}
            <button
              onClick={() => handleNav('/report')}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-xl bg-orange-600 text-white hover:bg-orange-700 active:scale-95 shadow-sm shadow-orange-600/25 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Hazard</span>
            </button>

            {/* User Account / Auth Buttons */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-800 line-clamp-1">{user?.name}</div>
                  <div className="text-[10px] text-slate-500 capitalize">{user?.role}</div>
                </div>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <button
                  onClick={() => handleNav('/login')}
                  className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => handleNav('/register')}
                  className="px-3 py-1.5 text-sm font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                >
                  Register
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button and language switch */}
          <div className="flex md:hidden items-center gap-1.5">
            <LanguageSwitcher compact />
            <button
              onClick={() => handleNav('/report')}
              className="p-2 text-white bg-orange-600 rounded-lg shadow-xs"
              title={t('nav.reportHazard', 'Report Hazard')}
            >
              <PlusCircle className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <div className="p-2 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-600">Language / భాష / भाषा:</span>
            <LanguageSwitcher />
          </div>

          <div className="space-y-1">
            <button
              onClick={() => handleNav('/')}
              className="w-full text-left px-3 py-2 text-sm font-medium rounded-lg text-slate-700 hover:bg-slate-100"
            >
              {t('nav.home', 'Home')}
            </button>
            <button
              onClick={() => handleNav('/reports')}
              className="w-full text-left px-3 py-2 text-sm font-medium rounded-lg text-slate-700 hover:bg-slate-100 flex items-center gap-2"
            >
              <ListFilter className="w-4 h-4" />
              {t('nav.reports', 'Reports Feed')}
            </button>
            <button
              onClick={() => handleNav('/map')}
              className="w-full text-left px-3 py-2 text-sm font-medium rounded-lg text-slate-700 hover:bg-slate-100 flex items-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              {t('nav.map', 'Safety Map')}
            </button>
            {isAuthenticated && (
              <button
                onClick={() => handleNav('/dashboard')}
                className="w-full text-left px-3 py-2 text-sm font-medium rounded-lg text-slate-700 hover:bg-slate-100 flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                {t('nav.dashboard', 'My Dashboard')}
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => handleNav('/admin')}
                className="w-full text-left px-3 py-2 text-sm font-semibold rounded-lg text-indigo-700 bg-indigo-50 flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                {t('nav.admin', 'Admin Portal')}
              </button>
            )}
          </div>

          {/* Quick Demo Switcher on Mobile */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Instant Demo Evaluation</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  demoLogin('citizen');
                  setMobileMenuOpen(false);
                }}
                className="px-2 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 text-center"
              >
                Citizen Demo
              </button>
              <button
                onClick={() => {
                  demoLogin('admin');
                  setMobileMenuOpen(false);
                }}
                className="px-2 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg text-center"
              >
                Admin Demo
              </button>
            </div>
          </div>

          {/* Auth status on Mobile */}
          <div className="pt-2 border-t border-slate-100">
            {isAuthenticated ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-800">{user?.name}</div>
                  <div className="text-xs text-slate-500">{user?.email}</div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-600 border border-rose-200 rounded-lg"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleNav('/login')}
                  className="w-full py-2 text-center text-sm font-semibold text-slate-700 border border-slate-200 rounded-lg"
                >
                  Login
                </button>
                <button
                  onClick={() => handleNav('/register')}
                  className="w-full py-2 text-center text-sm font-semibold text-white bg-orange-600 rounded-lg"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
