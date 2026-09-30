import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AdminStats, Report } from '../types';
import { useAuth } from '../context/AuthContext';
import { PriorityBadge } from '../components/PriorityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { CategoryIcon, getCategoryLabel } from '../components/CategoryIcon';
import { useToast } from '../components/Toast';
import {
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  BarChart3,
  PieChart,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Wrench,
  Settings,
} from 'lucide-react';

interface AdminDashboardPageProps {
  navigate: (path: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ navigate }) => {
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Quick Action Modal State
  const [activeModalReport, setActiveModalReport] = useState<Report | null>(null);
  const [modalAction, setModalAction] = useState<'status' | 'assign' | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('In Progress');
  const [statusComment, setStatusComment] = useState<string>('');
  const [assignedDepartment, setAssignedDepartment] = useState<string>('Road Maintenance Division');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/login');
      return;
    }

    async function loadAdminData() {
      try {
        const [statsData, reportsData] = await Promise.all([
          api.getAdminStats(),
          api.getAdminReports({ limit: 100 }),
        ]);
        setStats(statsData);
        setRecentReports(reportsData.reports);
      } catch (err: any) {
        console.error('Error loading admin data:', err);
        showToast('Failed to load administrative analytics.', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, [isAdmin]);

  const handleQuickStatus = async (reportId: string, newStatus: any) => {
    try {
      await api.updateReportStatus(reportId, newStatus, `Status updated to ${newStatus} from admin table.`);
      setRecentReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
      );
      showToast(`Report #${reportId} status changed to ${newStatus}.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update report status.', 'error');
    }
  };

  const handleUpdateStatus = async () => {
    if (!activeModalReport) return;
    try {
      await api.updateReportStatus(
        activeModalReport.id,
        selectedStatus as any,
        statusComment
      );
      setRecentReports((prev) =>
        prev.map((r) =>
          r.id === activeModalReport.id ? { ...r, status: selectedStatus as any } : r
        )
      );
      showToast(`Report #${activeModalReport.id} status updated to ${selectedStatus}.`, 'success');
      setActiveModalReport(null);
      setModalAction(null);
      setStatusComment('');
    } catch (err: any) {
      showToast(err.message || 'Failed to update status.', 'error');
    }
  };

  const handleAssignDepartment = async () => {
    if (!activeModalReport) return;
    try {
      await api.assignDepartment(activeModalReport.id, assignedDepartment);
      setRecentReports((prev) =>
        prev.map((r) =>
          r.id === activeModalReport.id
            ? { ...r, status: 'Assigned', assigned_to: assignedDepartment }
            : r
        )
      );
      showToast(`Report #${activeModalReport.id} assigned to ${assignedDepartment}.`, 'success');
      setActiveModalReport(null);
      setModalAction(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to assign department.', 'error');
    }
  };

  if (loading || !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Loading administrative dashboard...</p>
      </div>
    );
  }

  const { summary, charts } = stats;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Road Safety Administration Portal</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Safety Management Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Logged in as: <strong className="text-slate-800">{user?.name}</strong> (Safety Inspector / Admin)
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/reports')}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Settings className="w-4 h-4" />
          <span>Full Report Management & Merging &rarr;</span>
        </button>
      </div>

      {/* KPI Overview Cards (6 metrics) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500">Total Reports</span>
          <div className="text-2xl font-extrabold text-slate-900">{summary.totalReports}</div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-amber-800">New Reports</span>
          <div className="text-2xl font-extrabold text-amber-900">{summary.newReports}</div>
        </div>

        <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-orange-800">High Priority</span>
          <div className="text-2xl font-extrabold text-orange-900">{summary.highPriority}</div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-rose-800">Critical Issues</span>
          <div className="text-2xl font-extrabold text-rose-900">{summary.criticalIssues}</div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-emerald-800">Resolved</span>
          <div className="text-2xl font-extrabold text-emerald-900">{summary.resolvedIssues}</div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-blue-800">Duplicate Clusters</span>
          <div className="text-2xl font-extrabold text-blue-900">{summary.duplicateGroups}</div>
        </div>
      </div>

      {/* Analytics Visual Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* By Category */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-orange-600" />
              <span>Reports by Category</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Volume</span>
          </div>

          <div className="space-y-3">
            {charts.byCategory.map((item) => {
              const pct = Math.round((item.count / summary.totalReports) * 100) || 0;
              return (
                <div key={item.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 capitalize">
                      {getCategoryLabel(item.category)}
                    </span>
                    <span className="font-mono text-slate-500 font-bold">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* By Priority */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Reports by Priority</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Triage</span>
          </div>

          <div className="space-y-3">
            {charts.byPriority.map((item) => {
              const pct = Math.round((item.count / summary.totalReports) * 100) || 0;
              let barColor = 'bg-slate-400';
              if (item.priority === 'critical') barColor = 'bg-rose-600';
              if (item.priority === 'high') barColor = 'bg-orange-500';
              if (item.priority === 'medium') barColor = 'bg-amber-500';
              if (item.priority === 'low') barColor = 'bg-emerald-500';

              return (
                <div key={item.priority} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 capitalize">
                      {item.priority} Priority
                    </span>
                    <span className="font-mono text-slate-500 font-bold">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full ${barColor} rounded-full`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* By Status */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Reports by Status</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Progress</span>
          </div>

          <div className="space-y-3">
            {charts.byStatus.map((item) => {
              const pct = Math.round((item.count / summary.totalReports) * 100) || 0;
              let barColor = 'bg-slate-400';
              if (item.status === 'Reported') barColor = 'bg-amber-500';
              if (item.status === 'Assigned') barColor = 'bg-blue-500';
              if (item.status === 'In Progress') barColor = 'bg-indigo-600';
              if (item.status === 'Resolved') barColor = 'bg-emerald-500';

              return (
                <div key={item.status} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{item.status}</span>
                    <span className="font-mono text-slate-500 font-bold">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full ${barColor} rounded-full`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Reports Table with Quick Actions */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Road Safety Incident Reports</h3>
            <p className="text-xs text-slate-500">
              Direct triage controls: Update status from Reported &rarr; In Progress &rarr; Resolved
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Filter Tabs */}
            <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 text-xs font-semibold">
              {(['all', 'Reported', 'In Progress', 'Resolved'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    filterStatus === st
                      ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'all' ? 'All Reports' : st}
                </button>
              ))}
            </div>

            <button
              onClick={() => navigate('/admin/reports')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 ml-2"
            >
              <span>Full Table</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="p-3.5 font-bold">Report ID</th>
                <th className="p-3.5 font-bold">Category</th>
                <th className="p-3.5 font-bold">Location & City</th>
                <th className="p-3.5 font-bold">Severity</th>
                <th className="p-3.5 font-bold">Priority</th>
                <th className="p-3.5 font-bold">Live Status</th>
                <th className="p-3.5 font-bold">Date</th>
                <th className="p-3.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentReports
                .filter((r) => filterStatus === 'all' || r.status === filterStatus)
                .map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-slate-800">
                    <button
                      onClick={() => navigate(`/reports/${r.id}`)}
                      className="hover:text-orange-600 underline decoration-slate-300"
                    >
                      {r.id}
                    </button>
                    {r.incident_id && (
                      <div className="text-[10px] text-orange-600 font-mono mt-0.5">
                        {r.incident_id}
                      </div>
                    )}
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                      <CategoryIcon category={r.category} className="w-3.5 h-3.5 text-orange-600" />
                      <span>{getCategoryLabel(r.category)}</span>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <div className="max-w-[180px] truncate font-medium text-slate-800">
                      {r.location_name}
                    </div>
                    <div className="text-[11px] text-slate-400">{r.city}</div>
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      r.severity === 'critical'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : r.severity === 'high'
                        ? 'bg-orange-100 text-orange-800 border border-orange-200'
                        : r.severity === 'medium'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {r.severity}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <PriorityBadge priority={r.priority} score={r.priority_score} showScore size="sm" />
                  </td>
                  <td className="p-3.5">
                    <select
                      value={r.status}
                      onChange={(e) => handleQuickStatus(r.id, e.target.value)}
                      className={`p-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all shadow-2xs ${
                        r.status === 'Resolved'
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                          : r.status === 'In Progress'
                          ? 'border-indigo-300 bg-indigo-50 text-indigo-800'
                          : r.status === 'Assigned'
                          ? 'border-blue-300 bg-blue-50 text-blue-800'
                          : 'border-amber-300 bg-amber-50 text-amber-800'
                      }`}
                      title="Directly transition status"
                    >
                      <option value="Reported">Reported</option>
                      <option value="Assigned">Assigned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </td>
                  <td className="p-3.5 text-slate-400 font-medium">
                    {new Date(r.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </td>
                  <td className="p-3.5 text-right space-x-1">
                    <button
                      onClick={() => {
                        setActiveModalReport(r);
                        setModalAction('status');
                        setSelectedStatus(r.status);
                      }}
                      className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                    >
                      Audit
                    </button>
                    <button
                      onClick={() => {
                        setActiveModalReport(r);
                        setModalAction('assign');
                        setAssignedDepartment(r.assigned_to || 'GHMC Road Maintenance Wing 04');
                      }}
                      className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                    >
                      Assign
                    </button>
                    <button
                      onClick={() => navigate(`/reports/${r.id}`)}
                      className="p-1 text-slate-400 hover:text-slate-800"
                      title="View Report"
                    >
                      <ExternalLink className="w-3.5 h-3.5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Quick Status / Assign Action */}
      {activeModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">
              {modalAction === 'status' ? 'Update Report Status' : 'Assign Department / Crew'}
            </h3>
            <p className="text-xs text-slate-500">
              Report ID: <strong className="font-mono text-slate-800">{activeModalReport.id}</strong> • {getCategoryLabel(activeModalReport.category)}
            </p>

            {modalAction === 'status' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full p-2.5 border rounded-xl text-xs bg-white"
                  >
                    <option value="Reported">Reported</option>
                    <option value="Assigned">Assigned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Update Comment (Logged in Audit History)
                  </label>
                  <input
                    type="text"
                    value={statusComment}
                    onChange={(e) => setStatusComment(e.target.value)}
                    placeholder="e.g. Cold-mix patch crew deployed on site..."
                    className="w-full p-2.5 border rounded-xl text-xs"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign Agency / Maintenance Division
                </label>
                <select
                  value={assignedDepartment}
                  onChange={(e) => setAssignedDepartment(e.target.value)}
                  className="w-full p-2.5 border rounded-xl text-xs bg-white"
                >
                  <option value="GHMC Road Maintenance Wing 04">GHMC Road Maintenance Wing 04</option>
                  <option value="BBMP Stormwater & Sewerage Cell">BBMP Stormwater & Sewerage Cell</option>
                  <option value="BMC Electrical Maintenance Division">BMC Electrical Maintenance Division</option>
                  <option value="Delhi Traffic Police Infra Cell">Delhi Traffic Police Infra Cell</option>
                  <option value="Greater Chennai Corp Drainage Cell">Greater Chennai Corp Drainage Cell</option>
                  <option value="PMC Traffic Infrastructure">PMC Traffic Infrastructure</option>
                  <option value="KMC Disaster Quick Response Team">KMC Disaster Quick Response Team</option>
                  <option value="AMC Engineering Dept">AMC Engineering Dept</option>
                  <option value="NHAI Highway Maintenance Contractor">NHAI Highway Maintenance Contractor</option>
                </select>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveModalReport(null);
                  setModalAction(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={modalAction === 'status' ? handleUpdateStatus : handleAssignDepartment}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
