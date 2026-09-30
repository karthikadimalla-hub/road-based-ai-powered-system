import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Report, PriorityLevel, ReportStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { PriorityBadge } from '../components/PriorityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { CategoryIcon, getCategoryLabel } from '../components/CategoryIcon';
import { useToast } from '../components/Toast';
import {
  Search,
  Filter,
  ArrowLeft,
  Edit3,
  Layers,
  FileText,
  Building,
  CheckCircle2,
  Trash2,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';

interface AdminReportsPageProps {
  navigate: (path: string) => void;
}

export const AdminReportsPage: React.FC<AdminReportsPageProps> = ({ navigate }) => {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [category, setCategory] = useState('all');

  // Modal State for Advanced Actions
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [modalType, setModalType] = useState<'priority' | 'note' | 'merge' | null>(null);

  // Modal Inputs
  const [newPriority, setNewPriority] = useState<PriorityLevel>('high');
  const [priorityReason, setPriorityReason] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [targetIncidentId, setTargetIncidentId] = useState('INC-2026-00125');

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminReports({
        search: search.trim() !== '' ? search : undefined,
        status: status !== 'all' ? status : undefined,
        priority: priority !== 'all' ? priority : undefined,
        category: category !== 'all' ? category : undefined,
      });
      setReports(data.reports);
    } catch (err: any) {
      console.error('Error fetching admin reports:', err);
      showToast('Failed to load reports.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      navigate('/login');
      return;
    }
    loadReports();
  }, [status, priority, category, isAdmin]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadReports();
  };

  const handleQuickStatusChange = async (reportId: string, newStatus: ReportStatus) => {
    try {
      await api.updateReportStatus(reportId, newStatus, `Status updated to ${newStatus} by Admin.`);
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
      );
      showToast(`Report #${reportId} status updated to ${newStatus}.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update status.', 'error');
    }
  };

  const handleSavePriority = async () => {
    if (!selectedReport) return;
    try {
      await api.updateReportPriority(selectedReport.id, newPriority, priorityReason);
      setReports((prev) =>
        prev.map((r) => (r.id === selectedReport.id ? { ...r, priority: newPriority } : r))
      );
      showToast(`Priority calibrated to ${newPriority.toUpperCase()}.`, 'success');
      setSelectedReport(null);
      setModalType(null);
      setPriorityReason('');
    } catch (err: any) {
      showToast(err.message || 'Failed to update priority.', 'error');
    }
  };

  const handleAddNote = async () => {
    if (!selectedReport || !adminNote.trim()) return;
    try {
      await api.addAdminNote(selectedReport.id, adminNote);
      showToast(`Admin note added to #${selectedReport.id}.`, 'success');
      setSelectedReport(null);
      setModalType(null);
      setAdminNote('');
    } catch (err: any) {
      showToast(err.message || 'Failed to save note.', 'error');
    }
  };

  const handleMergeReport = async () => {
    if (!selectedReport) return;
    try {
      await api.mergeReports(selectedReport.id, targetIncidentId);
      setReports((prev) =>
        prev.map((r) =>
          r.id === selectedReport.id
            ? { ...r, incident_id: targetIncidentId, is_duplicate: 1 }
            : r
        )
      );
      showToast(`Merged #${selectedReport.id} into Incident ${targetIncidentId}.`, 'success');
      setSelectedReport(null);
      setModalType(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to merge reports.', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Admin Dashboard</span>
          </button>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Hazard Incident Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Search, triage, merge duplicate incidents, calibrate priority, and append administrative notes.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports by ID, location, description, or Incident ID..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Filter
          </button>
        </form>

        <div className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white"
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
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white"
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
            </select>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">
            Total Matching: {reports.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="p-3.5 font-bold">Report & Incident</th>
                <th className="p-3.5 font-bold">Category</th>
                <th className="p-3.5 font-bold">Location</th>
                <th className="p-3.5 font-bold">Priority</th>
                <th className="p-3.5 font-bold">Quick Status</th>
                <th className="p-3.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3.5">
                    <div className="font-mono font-bold text-slate-800">{r.id}</div>
                    {r.incident_id ? (
                      <span className="text-[10px] font-mono text-orange-600 font-bold block mt-0.5">
                        {r.incident_id} {r.is_duplicate ? '(Duplicate)' : '(Master)'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Independent</span>
                    )}
                  </td>

                  <td className="p-3.5">
                    <div className="flex items-center gap-1.5 font-medium text-slate-800">
                      <CategoryIcon category={r.category} className="w-3.5 h-3.5 text-orange-600" />
                      <span>{getCategoryLabel(r.category)}</span>
                    </div>
                  </td>

                  <td className="p-3.5">
                    <div className="max-w-[200px] truncate font-medium text-slate-800">
                      {r.location_name}
                    </div>
                    <div className="text-[10px] text-slate-400">{r.city}</div>
                  </td>

                  <td className="p-3.5">
                    <PriorityBadge priority={r.priority} score={r.priority_score} showScore size="sm" />
                  </td>

                  <td className="p-3.5">
                    <select
                      value={r.status}
                      onChange={(e) => handleQuickStatusChange(r.id, e.target.value as ReportStatus)}
                      className="p-1 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
                    >
                      <option value="Reported">Reported</option>
                      <option value="Assigned">Assigned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </td>

                  <td className="p-3.5 text-right space-x-1">
                    <button
                      onClick={() => {
                        setSelectedReport(r);
                        setModalType('priority');
                        setNewPriority(r.priority);
                      }}
                      className="p-1.5 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                      title="Change Priority"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setSelectedReport(r);
                        setModalType('note');
                      }}
                      className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                      title="Add Admin Note"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setSelectedReport(r);
                        setModalType('merge');
                        setTargetIncidentId(r.incident_id || 'INC-2026-00125');
                      }}
                      className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Merge into Incident Cluster"
                    >
                      <Layers className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => navigate(`/reports/${r.id}`)}
                      className="p-1.5 text-slate-400 hover:text-slate-800"
                      title="View Report"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modals */}
      {selectedReport && modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            {modalType === 'priority' && (
              <>
                <h3 className="text-base font-bold text-slate-900">Calibrate Priority Level</h3>
                <p className="text-xs text-slate-500">
                  Report ID: <strong className="font-mono text-slate-800">{selectedReport.id}</strong>
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select New Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as PriorityLevel)}
                    className="w-full p-2.5 border rounded-xl text-xs bg-white"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="critical">Critical Priority</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reasoning for Calibration
                  </label>
                  <input
                    type="text"
                    value={priorityReason}
                    onChange={(e) => setPriorityReason(e.target.value)}
                    placeholder="e.g. Near school crossing during peak hour..."
                    className="w-full p-2.5 border rounded-xl text-xs"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setSelectedReport(null);
                      setModalType(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePriority}
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700"
                  >
                    Update Priority
                  </button>
                </div>
              </>
            )}

            {modalType === 'note' && (
              <>
                <h3 className="text-base font-bold text-slate-900">Add Municipal Admin Note</h3>
                <p className="text-xs text-slate-500">
                  Report ID: <strong className="font-mono text-slate-800">{selectedReport.id}</strong>
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Inspection Note / Action Taken
                  </label>
                  <textarea
                    rows={3}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="e.g. Site visited. Road patch contractor instructed to fill cavity tonight..."
                    className="w-full p-2.5 border rounded-xl text-xs"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setSelectedReport(null);
                      setModalType(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddNote}
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700"
                  >
                    Save Note
                  </button>
                </div>
              </>
            )}

            {modalType === 'merge' && (
              <>
                <h3 className="text-base font-bold text-slate-900">Merge into Incident Cluster</h3>
                <p className="text-xs text-slate-500">
                  Report ID: <strong className="font-mono text-slate-800">{selectedReport.id}</strong>
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Master Incident ID
                  </label>
                  <input
                    type="text"
                    value={targetIncidentId}
                    onChange={(e) => setTargetIncidentId(e.target.value)}
                    placeholder="e.g. INC-2026-00125"
                    className="w-full p-2.5 border rounded-xl text-xs font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    This report will be grouped with other related citizen reports under this Master Incident ID.
                  </p>
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setSelectedReport(null);
                      setModalType(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleMergeReport}
                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700"
                  >
                    Merge Hazard
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
