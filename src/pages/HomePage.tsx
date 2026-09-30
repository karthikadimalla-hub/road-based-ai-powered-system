import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Report } from '../types';
import { PriorityBadge } from '../components/PriorityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { CategoryIcon, getCategoryLabel } from '../components/CategoryIcon';
import { useLanguage } from '../context/LanguageContext';
import {
  ShieldAlert,
  PlusCircle,
  MapPin,
  ListFilter,
  CheckCircle2,
  Clock,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertOctagon,
  Eye,
} from 'lucide-react';

interface HomePageProps {
  navigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const { t } = useLanguage();
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    highPriority: 0,
    resolved: 0,
    active: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await api.getReports({ limit: 6 });
        setReports(data.reports);

        // Derive statistics
        const allData = await api.getReports({ limit: 200 });
        const all = allData.reports;

        const total = all.length;
        const highPriority = all.filter(
          (r) => r.priority === 'high' || r.priority === 'critical'
        ).length;
        const resolved = all.filter((r) => r.status === 'Resolved').length;
        const active = all.filter(
          (r) => r.status === 'Reported' || r.status === 'In Progress' || r.status === 'Assigned'
        ).length;

        setStats({ total, highPriority, resolved, active });
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const supportedHazards = [
    {
      category: 'pothole',
      title: 'Potholes & Craters',
      desc: 'Deep road surface hollows causing severe skid accidents for two-wheelers and autos.',
      color: 'bg-orange-50 border-orange-200 text-orange-700',
    },
    {
      category: 'open_manhole',
      title: 'Open Manholes',
      desc: 'Uncovered sewer drains and chamber cavities posing immediate life-threatening fall risks.',
      color: 'bg-rose-50 border-rose-200 text-rose-700',
    },
    {
      category: 'waterlogging',
      title: 'Monsoon Waterlogging',
      desc: 'Stagnant stormwater submerging road lanes, blinding drivers to submerged obstacles.',
      color: 'bg-sky-50 border-sky-200 text-sky-700',
    },
    {
      category: 'traffic_signal',
      title: 'Broken Traffic Signals',
      desc: 'Damaged signal heads, unpowered poles, and scrambled timers creating junction chaos.',
      color: 'bg-red-50 border-red-200 text-red-700',
    },
    {
      category: 'streetlight',
      title: 'Non-Working Streetlights',
      desc: 'Dark road corridors on state & national highways causing pedestrian collisions at night.',
      color: 'bg-amber-50 border-amber-200 text-amber-700',
    },
    {
      category: 'damaged_road',
      title: 'Damaged Roads & Tar Break',
      desc: 'Loose bitumen aggregate, asphalt fissures, and uneven trenching across carriageways.',
      color: 'bg-slate-50 border-slate-200 text-slate-700',
    },
    {
      category: 'road_obstruction',
      title: 'Fallen Trees & Debris',
      desc: 'Heavy timber, fallen boulders, and construction rubble obstructing active traffic lanes.',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    },
    {
      category: 'unsafe_intersection',
      title: 'Unsafe Intersections',
      desc: 'Blind turns under railway bridges, missing speed breakers, and obscured sightlines.',
      color: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    },
  ];

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-b from-orange-50/70 via-white to-slate-50 border-b border-slate-200 py-16 md:py-24">
        {/* Subtle decorative background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100/80 border border-orange-200 text-orange-800 text-xs font-semibold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              <span>{t('home.badge', 'Civic-Tech Innovation • Gemini AI Multi-Hazard Analysis')}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              {t('home.heroTitle1', 'Make Indian Roads')} <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-600 via-amber-600 to-orange-500">
                {t('home.heroTitle2', 'Safer Together')}
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
              {t('home.heroDesc', 'Report potholes, damaged signals, poor lighting and other road hazards. Our AI helps categorize, identify duplicate incidents and prioritize safety issues.')}
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => navigate('/report')}
                className="px-6 py-3.5 text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 active:scale-95 rounded-xl shadow-lg shadow-orange-600/30 flex items-center gap-2 transition-all"
              >
                <PlusCircle className="w-5 h-5" />
                <span>{t('home.reportBtn', 'Report a Hazard')}</span>
              </button>

              <button
                onClick={() => navigate('/reports')}
                className="px-6 py-3.5 text-sm font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs flex items-center gap-2 transition-all"
              >
                <ListFilter className="w-4 h-4 text-slate-500" />
                <span>{t('home.viewReportsBtn', 'View Reports')}</span>
              </button>

              <button
                onClick={() => navigate('/map')}
                className="px-6 py-3.5 text-sm font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs flex items-center gap-2 transition-all"
              >
                <MapPin className="w-4 h-4 text-orange-600" />
                <span>{t('home.viewMapBtn', 'Safety Map')}</span>
              </button>
            </div>

            {/* Academic Prototype Notice Badge */}
            <div className="pt-4">
              <span className="text-[11px] text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
                College Research & Demonstration Project for Indian Municipal Infrastructure
              </span>
            </div>
          </div>

          {/* Statistics Bar */}
          <div className="mt-14 max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {loading ? '...' : stats.total}
                </div>
                <div className="text-xs font-medium text-slate-500">{t('home.stats.total', 'Total Reports')}</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-rose-600">
                  {loading ? '...' : stats.highPriority}
                </div>
                <div className="text-xs font-medium text-slate-500">{t('home.stats.highPriority', 'High & Critical Risk')}</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                  {loading ? '...' : stats.resolved}
                </div>
                <div className="text-xs font-medium text-slate-500">{t('home.stats.resolved', 'Issues Resolved')}</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-blue-600">
                  {loading ? '...' : stats.active}
                </div>
                <div className="text-xs font-medium text-slate-500">{t('home.stats.active', 'Active Incidents')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* "How It Works" Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-orange-600">Automated Pipeline</h2>
          <h3 className="text-3xl font-extrabold text-slate-900">How It Works</h3>
          <p className="text-sm text-slate-600">
            From citizen camera capture to AI incident clustering and transparent priority derivation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {/* Step 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs relative group hover:border-orange-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 font-extrabold text-lg flex items-center justify-center mb-4">
              1
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Report the Problem</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Citizens capture or upload a road hazard photo, tag the location via GPS or interactive map, and add brief notes.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs relative group hover:border-orange-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 font-extrabold text-lg flex items-center justify-center mb-4">
              2
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">AI Analyzes the Evidence</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Gemini Vision AI inspects image features, evaluates road hazard category, computes severity, and flags risks to commuters.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs relative group hover:border-orange-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-extrabold text-lg flex items-center justify-center mb-4">
              3
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Duplicate Reports Are Grouped</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Spatial Haversine calculation clusters reports within 100-200m into a single Master Incident ID (e.g. INC-2026-00125).
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs relative group hover:border-orange-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 font-extrabold text-lg flex items-center justify-center mb-4">
              4
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Prioritized and Resolved</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              A transparent formula scores points for severity, cluster volume, and AI confidence to assign Low, Medium, High, or Critical triage.
            </p>
          </div>
        </div>
      </section>

      {/* Supported Hazard Types Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-orange-600">Comprehensive Coverage</h2>
          <h3 className="text-3xl font-extrabold text-slate-900">Supported Hazard Types</h3>
          <p className="text-sm text-slate-600">
            Tuned specifically for urban and highway challenges faced across Indian cities.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {supportedHazards.map((h) => (
            <div
              key={h.category}
              onClick={() => navigate(`/reports?category=${h.category}`)}
              className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-orange-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2.5 rounded-xl border ${h.color} group-hover:scale-110 transition-transform`}>
                  <CategoryIcon category={h.category} className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                  {h.title}
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{h.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Urgent Recent Reports Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-orange-600">Live Triage Feed</h2>
            <h3 className="text-2xl font-extrabold text-slate-900">Recently Prioritized Road Reports</h3>
          </div>
          <button
            onClick={() => navigate('/reports')}
            className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1.5"
          >
            <span>Explore All Reports</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div
              key={report.id}
              onClick={() => navigate(`/reports/${report.id}`)}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden hover:shadow-md hover:border-orange-300 transition-all cursor-pointer flex flex-col"
            >
              {/* Thumbnail */}
              <div className="relative h-44 bg-slate-100 overflow-hidden">
                <img
                  src={report.image_url}
                  alt={report.description}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <PriorityBadge priority={report.priority} score={report.priority_score} showScore size="sm" />
                </div>
                <div className="absolute top-3 right-3">
                  <StatusBadge status={report.status} size="sm" />
                </div>
                {report.incident_id && (
                  <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono font-semibold text-white">
                    {report.incident_id}
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-600">
                    <CategoryIcon category={report.category} className="w-4 h-4" />
                    <span>{getCategoryLabel(report.category)}</span>
                  </div>

                  <p className="text-xs text-slate-800 font-medium line-clamp-2 leading-relaxed">
                    {report.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1 truncate max-w-[170px]">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{report.location_name}, {report.city}</span>
                  </div>
                  <span className="shrink-0 font-medium text-slate-400">
                    {new Date(report.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-linear-to-r from-slate-900 via-slate-800 to-orange-950 text-white p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Spotted a Pothole or Road Hazard?
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Help make your daily commute safer. Capture a photo, submit the report in 30 seconds, and watch our AI automatically triage the issue.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <button
              onClick={() => navigate('/report')}
              className="px-6 py-3.5 text-sm font-bold text-slate-900 bg-orange-400 hover:bg-orange-300 rounded-xl shadow-lg transition-all"
            >
              Report Hazard Now
            </button>
            <button
              onClick={() => navigate('/map')}
              className="px-6 py-3.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all"
            >
              View City Safety Map
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
