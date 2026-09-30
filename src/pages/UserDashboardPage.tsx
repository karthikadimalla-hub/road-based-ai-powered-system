import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Report } from '../types';
import { useAuth } from '../context/AuthContext';
import { PriorityBadge } from '../components/PriorityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { CategoryIcon, getCategoryLabel } from '../components/CategoryIcon';
import { useToast } from '../components/Toast';
import {
  LayoutDashboard,
  PlusCircle,
  Clock,
  Wrench,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Calendar,
  Layers,
  FileText,
} from 'lucide-react';

interface UserDashboardPageProps {
  navigate: (path: string) => void;
}

export const UserDashboardPage: React.FC<UserDashboardPageProps> = ({ navigate }) => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'inprogress' | 'resolved'>('all');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    async function loadUserReports() {
      try {
        const data = await api.getReports({ mine: true, limit: 100 });
        setReports(data.reports);
      } catch (err: any) {
        console.error('Error loading dashboard reports:', err);
        showToast('Failed to load your reports.', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadUserReports();
  }, [isAuthenticated]);

  const totalCount = reports.length;
  const pendingCount = reports.filter(
    (r) => r.status === 'Reported' || r.status === 'Assigned'
  ).length;
  const inProgressCount = reports.filter((r) => r.status === 'In Progress').length;
  const resolvedCount = reports.filter((r) => r.status === 'Resolved').length;

  const filteredReports = reports.filter((r) => {
    if (statusFilter === 'pending') {
      return r.status === 'Reported' || r.status === 'Assigned';
    }
    if (statusFilter === 'inprogress') {
      return r.status === 'In Progress';
    }
    if (statusFilter === 'resolved') {
      return r.status === 'Resolved';
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-orange-600">
            Citizen Dashboard
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Namaste, {user?.name || 'Citizen'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track and monitor the status of road safety hazards submitted under your citizen profile.
          </p>
        </div>

        <button
          onClick={() => navigate('/report')}
          className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 active:scale-95 rounded-xl shadow-md shadow-orange-600/25 transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report New Hazard</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setStatusFilter('all')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-orange-50/60 border-orange-300 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">My Reports</span>
            <FileText className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            {totalCount}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('pending')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'pending'
              ? 'bg-amber-50/60 border-amber-300 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 mt-2">
            {pendingCount}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('inprogress')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'inprogress'
              ? 'bg-indigo-50/60 border-indigo-300 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">In Progress</span>
            <Wrench className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-700 mt-2">
            {inProgressCount}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('resolved')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'resolved'
              ? 'bg-emerald-50/60 border-emerald-300 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-2">
            {resolvedCount}
          </div>
        </div>
      </div>

      {/* Reports Table / Card List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            {statusFilter === 'all'
              ? 'All Submitted Reports'
              : statusFilter === 'pending'
              ? 'Pending & Assigned Reports'
              : statusFilter === 'inprogress'
              ? 'Works In Progress'
              : 'Resolved Reports'}
          </h3>
          <span className="text-xs text-slate-500">
            Showing {filteredReports.length} of {totalCount}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading your reports...</div>
        ) : filteredReports.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-800">No reports found in this category</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Help make your daily commute safer by reporting hazards in your neighborhood.
            </p>
            <button
              onClick={() => navigate('/report')}
              className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-semibold"
            >
              Report a Hazard
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                onClick={() => navigate(`/reports/${report.id}`)}
                className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  <img
                    src={report.image_url}
                    alt={report.description}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                  />

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-slate-800">
                        {report.id}
                      </span>
                      {report.incident_id && (
                        <span className="text-[10px] font-mono font-semibold bg-orange-100 text-orange-800 px-1.5 py-0.2 rounded">
                          {report.incident_id}
                        </span>
                      )}
                      <span className="text-xs font-bold text-orange-600 flex items-center gap-1">
                        <CategoryIcon category={report.category} className="w-3.5 h-3.5" />
                        <span>{getCategoryLabel(report.category)}</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-800 font-medium line-clamp-1">
                      {report.description}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{report.location_name}, {report.city}</span>
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(report.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <PriorityBadge priority={report.priority} score={report.priority_score} showScore size="sm" />
                  <StatusBadge status={report.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
