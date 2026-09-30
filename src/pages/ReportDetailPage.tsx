import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Report, Incident, ParsedAIAnalysis, StatusHistoryItem, AdminNote } from '../types';
import { PriorityBadge } from '../components/PriorityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { CategoryIcon, getCategoryLabel } from '../components/CategoryIcon';
import { LeafletMap } from '../components/LeafletMap';
import { StreetViewModal } from '../components/StreetViewModal';
import { useToast } from '../components/Toast';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  ShieldAlert,
  ThumbsUp,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building,
  Info,
  Eye,
} from 'lucide-react';

interface ReportDetailPageProps {
  id: string;
  navigate: (path: string) => void;
}

export const ReportDetailPage: React.FC<ReportDetailPageProps> = ({ id, navigate }) => {
  const { showToast } = useToast();
  const [report, setReport] = useState<Report | null>(null);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [relatedReports, setRelatedReports] = useState<Report[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([]);
  const [adminNotes, setAdminNotes] = useState<AdminNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [streetViewOpen, setStreetViewOpen] = useState(false);

  useEffect(() => {
    async function loadReport() {
      setLoading(true);
      try {
        const data = await api.getReportById(id);
        setReport(data.report);
        setIncident(data.incident);
        setRelatedReports(data.relatedReports || []);
        setStatusHistory(data.statusHistory || []);
        setAdminNotes(data.adminNotes || []);
      } catch (err: any) {
        console.error('Error fetching report details:', err);
        showToast('Failed to load report details.', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [id]);

  const handleUpvote = async () => {
    if (!report) return;
    try {
      const res = await api.upvoteReport(report.id);
      setReport({ ...report, upvotes: res.upvotes });
      showToast('Civic verification recorded. Thank you!', 'success');
    } catch (err) {
      showToast('Could not register verification.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Loading road safety report #{id}...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Report Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested report could not be found or has been removed.
        </p>
        <button
          onClick={() => navigate('/reports')}
          className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-semibold"
        >
          Back to Reports Feed
        </button>
      </div>
    );
  }

  let aiAnalysisObj: ParsedAIAnalysis | null = null;
  try {
    if (report.ai_analysis) {
      aiAnalysisObj = JSON.parse(report.ai_analysis);
    }
  } catch (e) {
    // Ignore JSON parse error
  }

  const statusWorkflow = ['Reported', 'Assigned', 'In Progress', 'Resolved'];
  const isRejected = report.status === 'Rejected';
  const currentStatusIndex = statusWorkflow.indexOf(report.status);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate('/reports')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Reports</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStreetViewOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-sky-400 text-xs font-bold shadow-2xs transition-all"
            title="Inspect road conditions in 360° Ground-Level Street View"
          >
            <Eye className="w-4 h-4 text-sky-400" />
            <span>360° Street View</span>
          </button>

          <button
            onClick={handleUpvote}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-orange-50 hover:text-orange-600 text-xs font-bold text-slate-700 shadow-2xs transition-all"
          >
            <ThumbsUp className="w-4 h-4" />
            <span>I Also Witnessed This ({report.upvotes})</span>
          </button>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {report.id}
              </span>
              {report.incident_id && (
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-800 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" />
                  Cluster: {report.incident_id}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {getCategoryLabel(report.category)}
            </h1>
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{report.location_name}, {report.city}</span>
              {report.landmark && <span>• Landmark: {report.landmark}</span>}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge priority={report.priority} score={report.priority_score} showScore size="lg" />
            <StatusBadge status={report.status} size="lg" />
          </div>
        </div>

        {/* Visual Status Progress Tracker */}
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Resolution Pipeline
          </h4>

          {isRejected ? (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>This report has been marked as Rejected / Non-Actionable by municipal inspection.</span>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {statusWorkflow.map((step, idx) => {
                const isPassed = currentStatusIndex >= idx;
                const isCurrent = currentStatusIndex === idx;

                return (
                  <div key={step} className="space-y-1.5">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        isPassed
                          ? isCurrent
                            ? 'bg-orange-500'
                            : 'bg-emerald-500'
                          : 'bg-slate-200'
                      }`}
                    />
                    <div className="flex items-center justify-between text-[11px]">
                      <span
                        className={`font-semibold ${
                          isCurrent
                            ? 'text-orange-600'
                            : isPassed
                            ? 'text-emerald-700'
                            : 'text-slate-400'
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout: Evidence & Location Left, AI & Priority Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (Evidence & Map) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Photo Evidence */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 font-bold text-xs uppercase tracking-wider text-slate-600">
              Photographic Evidence
            </div>
            <div className="bg-slate-900 max-h-96 flex items-center justify-center overflow-hidden">
              <img
                src={report.image_url}
                alt={report.description}
                className="w-full object-contain max-h-96"
              />
            </div>
            <div className="p-5 space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Citizen Description
              </h4>
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                {report.description}
              </p>
            </div>
          </div>

          {/* Interactive Geographic Pin Map */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-orange-600" />
                <span>Geographic Verification (200m Cluster Radius)</span>
              </h4>
              <span className="font-mono text-[11px] text-slate-400">
                {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
              </span>
            </div>

            <LeafletMap
              center={[report.latitude, report.longitude]}
              zoom={15}
              height="280px"
              selectedLocation={{ latitude: report.latitude, longitude: report.longitude }}
              showCircleRadiusMeters={200}
            />

            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
              <span>{report.location_name} {report.ward ? `(${report.ward})` : ''}</span>
              <span>City: <strong>{report.city}</strong></span>
            </div>
          </div>

          {/* Status Timeline History */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Audit Log & Timeline</span>
            </h4>

            {statusHistory.length === 0 ? (
              <p className="text-xs text-slate-400">No status updates recorded yet.</p>
            ) : (
              <div className="space-y-4 relative pl-4 border-l-2 border-slate-200">
                {statusHistory.map((item) => (
                  <div key={item.id} className="relative group">
                    <div className="absolute -left-[23px] top-0.5 w-3 h-3 rounded-full bg-orange-500 border-2 border-white" />
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <span>Status changed to {item.status}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        by {item.changed_by}
                      </span>
                    </div>
                    {item.comment && (
                      <p className="text-xs text-slate-600 mt-0.5">{item.comment}</p>
                    )}
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {new Date(item.created_at).toLocaleString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })} IST
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (AI Insights, Duplicate Incident Cluster, Admin Notes) */}
        <div className="lg:col-span-5 space-y-6">
          {/* AI Multimodal Analysis Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Gemini Sentinel AI Analysis
                </h3>
                <p className="text-[11px] text-slate-500">
                  Multimodal computer vision assessment
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] uppercase font-semibold text-slate-500">Detected Category</span>
                <div className="font-bold text-slate-900 mt-0.5">
                  {getCategoryLabel(report.category)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] uppercase font-semibold text-slate-500">Severity</span>
                <div className="font-bold text-slate-900 capitalize mt-0.5">
                  {report.severity}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] uppercase font-semibold text-slate-500">Confidence Score</span>
                <div className="font-mono font-bold text-slate-900 mt-0.5">
                  {(report.ai_confidence * 100).toFixed(0)}%
                </div>
              </div>

              <div className="p-3 rounded-xl bg-orange-50 border border-orange-200">
                <span className="text-[10px] uppercase font-semibold text-orange-800">Calculated Priority</span>
                <div className="font-bold text-orange-900 capitalize mt-0.5">
                  {report.priority}
                </div>
              </div>
            </div>

            {/* AI Visible Evidence & Safety Risk */}
            {aiAnalysisObj && (
              <div className="space-y-3 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[11px] font-bold text-slate-700">Visible Evidence:</span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {aiAnalysisObj.visible_evidence}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1">
                  <span className="text-[11px] font-bold text-rose-800">Commuter Safety Risk:</span>
                  <p className="text-xs text-rose-900 leading-relaxed">
                    {aiAnalysisObj.safety_risk}
                  </p>
                </div>
              </div>
            )}

            {/* Transparent Priority Scoring Breakdown */}
            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-orange-400">Transparent Priority Score:</span>
                <span className="font-mono font-extrabold text-sm">{report.priority_score} / 100 pts</span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono leading-relaxed">
                {report.priority_reasoning}
              </p>
            </div>
          </div>

          {/* Master Incident Duplicate Cluster */}
          {incident && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-orange-600" />
                  <span>Master Incident Group ({incident.report_count} Reports)</span>
                </h4>
                <span className="font-mono text-xs font-bold text-orange-600">{incident.id}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                <div className="font-bold text-slate-900">{incident.title}</div>
                <div className="text-[11px] text-slate-500">
                  Assigned To: <strong>{incident.assigned_to || 'Unassigned'}</strong>
                </div>
              </div>

              {/* Related Reports in Cluster */}
              {relatedReports.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-500">
                    Other Citizen Reports in this Incident:
                  </span>
                  <div className="space-y-2">
                    {relatedReports.map((rel) => (
                      <div
                        key={rel.id}
                        onClick={() => navigate(`/reports/${rel.id}`)}
                        className="p-3 rounded-xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50/30 transition-all cursor-pointer flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="truncate">
                          <span className="font-mono font-bold text-slate-800">{rel.id}</span>
                          <p className="text-slate-500 text-[11px] truncate">{rel.location_name}</p>
                        </div>
                        <StatusBadge status={rel.status} size="sm" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Admin Notes Box */}
          {adminNotes.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Municipal & Inspector Notes</span>
              </h4>

              <div className="space-y-2">
                {adminNotes.map((n) => (
                  <div key={n.id} className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-indigo-950">{n.admin_name}</span>
                      <span className="text-[10px] text-indigo-500">
                        {new Date(n.created_at).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <p className="text-xs text-indigo-900 leading-relaxed">{n.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Street View Modal */}
      <StreetViewModal
        target={
          streetViewOpen && report
            ? {
                latitude: report.latitude,
                longitude: report.longitude,
                location_name: report.location_name,
                city: report.city,
                category: report.category,
                priority: report.priority,
                description: report.description,
                reportId: report.id,
              }
            : null
        }
        onClose={() => setStreetViewOpen(false)}
      />
    </div>
  );
};
