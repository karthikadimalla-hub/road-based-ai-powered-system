import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Report, HazardCategory } from '../types';
import { PriorityBadge } from '../components/PriorityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { CategoryIcon, getCategoryLabel } from '../components/CategoryIcon';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../components/Toast';
import {
  Search,
  Filter,
  MapPin,
  ThumbsUp,
  Layers,
  ArrowRight,
  RotateCw,
  PlusCircle,
} from 'lucide-react';

interface ReportsListPageProps {
  navigate: (path: string) => void;
  initialCategory?: string;
}

export const ReportsListPage: React.FC<ReportsListPageProps> = ({
  navigate,
  initialCategory,
}) => {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(initialCategory || 'all');
  const [priority, setPriority] = useState('all');
  const [status, setStatus] = useState('all');
  const [city, setCity] = useState('all');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await api.getReports({
        category: category !== 'all' ? category : undefined,
        priority: priority !== 'all' ? priority : undefined,
        status: status !== 'all' ? status : undefined,
        city: city !== 'all' ? city : undefined,
        search: search.trim() !== '' ? search : undefined,
      });
      setReports(data.reports);
    } catch (err: any) {
      console.error('Error fetching reports:', err);
      showToast('Failed to load reports feed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [category, priority, status, city]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports();
  };

  const handleUpvote = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await api.upvoteReport(id);
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, upvotes: res.upvotes } : r))
      );
      showToast('Civic verification recorded. Thank you for validating!', 'success');
    } catch (err) {
      showToast('Could not register verification.', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('nav.reports', 'Road Safety Reports Feed')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Browse verified citizen incident reports, duplicate clusters, and ongoing road repair statuses.
          </p>
        </div>

        <button
          onClick={() => navigate('/report')}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs transition-colors shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t('nav.reportHazard', 'Report New Hazard')}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('common.search', 'Search by keywords, street name, city, or Report ID (e.g. REP-2026-00101)...')}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            {t('common.search', 'Search')}
          </button>
        </form>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="all">All Categories</option>
              <option value="pothole">Potholes</option>
              <option value="damaged_road">Damaged Roads</option>
              <option value="open_manhole">Open Manholes</option>
              <option value="waterlogging">Waterlogging</option>
              <option value="traffic_signal">Traffic Signals</option>
              <option value="streetlight">Streetlights</option>
              <option value="road_obstruction">Road Obstructions</option>
              <option value="unsafe_intersection">Unsafe Intersections</option>
              <option value="damaged_sign">Damaged Signs</option>
              <option value="other">Other Hazards</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="all">All Statuses</option>
              <option value="Reported">Reported</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              City
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="all">All Cities</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
              <option value="Chennai">Chennai</option>
              <option value="Pune">Pune</option>
              <option value="Kolkata">Kolkata</option>
              <option value="Ahmedabad">Ahmedabad</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading road safety feed...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No reports matched your filters</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query, city selection, or category filters.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setCategory('all');
              setPriority('all');
              setStatus('all');
              setCity('all');
            }}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div
              key={report.id}
              onClick={() => navigate(`/reports/${report.id}`)}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden hover:shadow-md hover:border-orange-300 transition-all cursor-pointer flex flex-col group"
            >
              {/* Image & Overlay Badges */}
              <div className="relative h-48 bg-slate-100 overflow-hidden">
                <img
                  src={report.image_url}
                  alt={report.description}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                <div className="absolute top-3 left-3 flex gap-1.5">
                  <PriorityBadge priority={report.priority} score={report.priority_score} showScore size="sm" />
                </div>

                <div className="absolute top-3 right-3">
                  <StatusBadge status={report.status} size="sm" />
                </div>

                <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono font-bold text-white">
                    {report.id}
                  </span>
                  {report.incident_id && (
                    <span className="bg-orange-600/90 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono font-bold text-white flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      {report.incident_id}
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-orange-600 flex items-center gap-1.5">
                      <CategoryIcon category={report.category} className="w-4 h-4" />
                      <span>{getCategoryLabel(report.category)}</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {new Date(report.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 font-medium line-clamp-2 leading-relaxed">
                    {report.description}
                  </p>
                </div>

                {/* Location & Upvote Row */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate max-w-[190px]">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{report.location_name}, {report.city}</span>
                  </div>

                  <button
                    onClick={(e) => handleUpvote(e, report.id)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-50 hover:bg-orange-50 hover:text-orange-600 border border-slate-200 transition-colors shrink-0"
                    title="Validate / Upvote this hazard"
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>{report.upvotes}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
