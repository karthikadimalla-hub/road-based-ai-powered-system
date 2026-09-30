import React from 'react';
import { ShieldAlert, PhoneCall, AlertTriangle, ExternalLink, Globe } from 'lucide-react';
import { LanguageSwitcher, useLanguage } from '../context/LanguageContext';

interface FooterProps {
  navigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  const { t } = useLanguage();
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-12 pb-8 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Brand & Tagline */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg text-white">RoadSafe India</span>
            </div>
            <p className="text-sm font-semibold text-orange-400">
              “Report. Analyze. Prioritize. Make Roads Safer.”
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              An AI-powered civic road safety reporting prototype engineered for Indian road conditions, enabling transparent hazard detection, duplicate incident clustering, and objective priority calibration.
            </p>
            <div className="pt-2">
              <span className="block text-[11px] font-semibold text-slate-400 mb-1">
                Regional Language / भाषा:
              </span>
              <LanguageSwitcher />
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Quick Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => navigate('/')} className="hover:text-orange-400 transition-colors">
                  Home Overview
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/report')} className="hover:text-orange-400 transition-colors">
                  Report a Hazard
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/reports')} className="hover:text-orange-400 transition-colors">
                  Public Reports Feed
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/map')} className="hover:text-orange-400 transition-colors">
                  Interactive Safety Map
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/dashboard')} className="hover:text-orange-400 transition-colors">
                  Citizen Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/admin')} className="hover:text-indigo-400 transition-colors">
                  Admin Safety Console
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Supported Hazard Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Monitored Hazards</h4>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Potholes</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Open Manholes</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Waterlogging</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Traffic Signals</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Broken Streetlights</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Fallen Trees</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Unsafe Intersections</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Damaged Signs</span>
            </div>
          </div>

          {/* Col 4: Indian Emergency Helplines */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
              <span>National Road Helplines</span>
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
                <div className="font-bold text-white flex items-center justify-between">
                  <span>National Emergency</span>
                  <span className="font-mono text-rose-400 text-sm">112</span>
                </div>
                <div className="text-[11px] text-slate-400">All-in-One Police, Fire, Ambulance</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
                <div className="font-bold text-white flex items-center justify-between">
                  <span>NHAI Highway Helpline</span>
                  <span className="font-mono text-orange-400 text-sm">1033</span>
                </div>
                <div className="text-[11px] text-slate-400">24x7 Road Accidents on National Highways</div>
              </div>
            </div>
          </div>
        </div>

        {/* Mandatory Academic / College Disclaimer */}
        <div className="pt-6 border-t border-slate-800">
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 text-xs text-slate-300 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-white block">Academic Prototype & Demonstration Project Notice</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                This web application is a college engineering project and research prototype designed for Indian civic technology demonstrations. It is <strong>NOT</strong> an official Indian government portal and is not connected to, endorsed by, or operated on behalf of GHMC, NHAI, BBMP, BMC, Delhi Traffic Police, or any state or municipal corporation. Reports submitted here are handled in this prototype database for evaluation and priority simulation.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
            <div>
              &copy; {new Date().getFullYear()} RoadSafe India Prototype. Built with React, TypeScript, Node.js & Gemini AI.
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span>Timezone: Asia/Kolkata (IST)</span>
              <span>OpenStreetMap Leaflet Engine</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
