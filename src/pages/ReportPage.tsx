import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../components/Toast';
import { LeafletMap } from '../components/LeafletMap';
import { PriorityBadge } from '../components/PriorityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { CategoryIcon, getCategoryLabel } from '../components/CategoryIcon';
import {
  Upload,
  Camera,
  MapPin,
  Compass,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Info,
  X,
  FileText,
  RotateCcw,
} from 'lucide-react';

interface ReportPageProps {
  navigate: (path: string) => void;
}

// Preset Indian hazard photos for instant 1-click evaluation
const PRESET_HAZARDS = [
  {
    name: 'Hitec City Pothole',
    category: 'pothole',
    city: 'Hyderabad',
    location: 'Hitec City Flyover Ramp, Madhapur',
    landmark: 'Opposite Shilparamam Gate',
    lat: 17.4435,
    lon: 78.3772,
    desc: 'Deep 10-inch pothole with sharp broken asphalt edges on the ascending ramp. Vehicles swerving abruptly.',
    svgType: 'pothole',
    color: '#f97316',
  },
  {
    name: 'ORR Open Manhole',
    category: 'open_manhole',
    city: 'Bengaluru',
    location: 'Outer Ring Road, Kadubeesanahalli',
    landmark: 'Near JP Morgan tech park service road',
    lat: 12.9352,
    lon: 77.6953,
    desc: 'Heavy cast-iron chamber lid missing. Open 8-foot drop drain with tree branch placed as makeshift indicator.',
    svgType: 'open_manhole',
    color: '#ef4444',
  },
  {
    name: 'Anna Salai Waterlogging',
    category: 'waterlogging',
    city: 'Chennai',
    location: 'Anna Salai near Panagal Park turn',
    landmark: 'In front of T. Nagar signal junction',
    lat: 13.0405,
    lon: 80.2505,
    desc: 'Over 1.5 feet of stagnant rainwater overflowing from choked stormwater drain, submerging 2 lanes.',
    svgType: 'waterlogging',
    color: '#0284c7',
  },
  {
    name: 'AIIMS Signal Broken',
    category: 'traffic_signal',
    city: 'Delhi',
    location: 'Ring Road AIIMS Flyover Intersection',
    landmark: 'Near Trauma Center gate',
    lat: 28.5672,
    lon: 77.2100,
    desc: 'Traffic signal mast tilted after vehicle impact. Red and amber optical cowls smashed, lights dark.',
    svgType: 'traffic_signal',
    color: '#dc2626',
  },
  {
    name: 'WEH Dark Streetlights',
    category: 'streetlight',
    city: 'Mumbai',
    location: 'Western Express Highway, Andheri East',
    landmark: 'Near Gundavali Metro Station',
    lat: 19.1136,
    lon: 72.8697,
    desc: 'Continuous stretch of 6 sodium streetlights turned off. Road curve in pitch black darkness.',
    svgType: 'streetlight',
    color: '#eab308',
  },
];

function generateQuickSvg(hazardType: string, title: string, color: string): string {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
  <rect width="600" height="400" fill="#1e293b"/>
  <polygon points="150,400 260,160 340,160 450,400" fill="#0f172a" />
  <line x1="300" y1="160" x2="300" y2="400" stroke="#facc15" stroke-width="4" stroke-dasharray="20,15" />
  <ellipse cx="300" cy="280" rx="90" ry="40" fill="${color}" opacity="0.85"/>
  <ellipse cx="300" cy="285" rx="60" ry="25" fill="#020617"/>
  <rect x="20" y="20" width="300" height="44" rx="8" fill="#0f172a" opacity="0.9"/>
  <text x="36" y="48" font-family="sans-serif" font-size="14" font-weight="bold" fill="#ffffff">${title}</text>
  <rect x="420" y="20" width="160" height="34" rx="4" fill="#334155"/>
  <text x="432" y="42" font-family="monospace" font-size="11" fill="#38bdf8">RoadSafe Evidence</text>
</svg>
`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const ReportPage: React.FC<ReportPageProps> = ({ navigate }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [description, setDescription] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('pothole');
  const [latitude, setLatitude] = useState<number>(17.4435); // Default to Hyderabad
  const [longitude, setLongitude] = useState<number>(78.3772);
  const [locationName, setLocationName] = useState<string>('Hitec City Main Road');
  const [landmark, setLandmark] = useState<string>('Near Cyber Towers');
  const [city, setCity] = useState<string>('Hyderabad');
  const [ward, setWard] = useState<string>('Ward 104 - Kondapur');
  const [additionalComments, setAdditionalComments] = useState<string>('');

  // Processing & Submission States
  const [submitting, setSubmitting] = useState(false);
  const [submitStage, setSubmitStage] = useState<string>('');
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);

  // Geo Detection State
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Handle Image File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check valid mime
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('Only JPG, JPEG, PNG, and WEBP images are supported.', 'error');
      return;
    }

    // Check size limit: 10MB
    if (file.size > 10 * 1024 * 1024) {
      showToast('Image file size must be less than 10MB.', 'error');
      return;
    }

    setImageMimeType(file.type);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Preset Selection
  const applyPreset = (preset: (typeof PRESET_HAZARDS)[0]) => {
    const svgImg = generateQuickSvg(preset.svgType, preset.name, preset.color);
    setImagePreview(svgImg);
    setImageMimeType('image/svg+xml');
    setSelectedCategory(preset.category);
    setCity(preset.city);
    setLocationName(preset.location);
    setLandmark(preset.landmark);
    setLatitude(preset.lat);
    setLongitude(preset.lon);
    setDescription(preset.desc);
    showToast(`Loaded sample scenario: ${preset.name}`, 'info');
  };

  // Browser Geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'error');
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lon = Number(pos.coords.longitude.toFixed(6));
        setLatitude(lat);
        setLongitude(lon);

        // Try reverse geocoding via OpenStreetMap Nominatim
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
          );
          const data = await res.json();
          if (data && data.display_name) {
            setLocationName(data.display_name.split(',')[0] || 'Current Location');
            if (data.address?.city || data.address?.town || data.address?.state_district) {
              const detectedCity = data.address?.city || data.address?.town || data.address?.state_district;
              setCity(detectedCity);
            }
          }
        } catch (e) {
          // Ignore geocoding failure, coords are set
        }

        setDetectingLocation(false);
        showToast('Acquired GPS coordinates successfully.', 'success');
      },
      (err) => {
        setDetectingLocation(false);
        showToast(`Could not acquire location: ${err.message}`, 'warning');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Coordinate changes from Map pin drag or click
  const handleMapLocationSelect = (coords: { latitude: number; longitude: number }) => {
    setLatitude(coords.latitude);
    setLongitude(coords.longitude);
  };

  // Submit and Analyze
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim() || description.trim().length < 5) {
      showToast('Please provide a description of at least 5 characters.', 'error');
      return;
    }

    if (!locationName.trim()) {
      showToast('Please provide a location address.', 'error');
      return;
    }

    setSubmitting(true);
    setSubmitStage('Uploading image and preparing evidence package...');

    try {
      // Simulate/Show pipeline progression
      setTimeout(() => {
        setSubmitStage('Invoking Gemini AI for road hazard categorization & severity...');
      }, 700);

      setTimeout(() => {
        setSubmitStage('Checking nearby reports within 200m for duplicate hazard cluster...');
      }, 1600);

      setTimeout(() => {
        setSubmitStage('Computing transparent priority score and saving report...');
      }, 2300);

      const payload = {
        category: selectedCategory,
        description,
        image: imagePreview,
        mimeType: imageMimeType,
        latitude,
        longitude,
        location_name: locationName,
        landmark,
        city,
        ward,
        additional_comments: additionalComments,
      };

      const result = await api.submitReport(payload);

      setSubmissionResult(result);
      showToast('Report submitted and analyzed successfully!', 'success');
    } catch (err: any) {
      console.error('Submission failed:', err);
      showToast(err.message || 'Failed to submit report. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Automated AI Triage</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {t('report.heading', 'Report a Road Safety Hazard')}
        </h1>
        <p className="text-sm text-slate-600">
          {t('report.subheading', 'Upload photo evidence and location. Our AI categorizes the issue, detects duplicates within 200m, and derives an objective priority score.')}
        </p>
      </div>

      {/* Preset Evaluation Bar */}
      <div className="p-4 rounded-2xl bg-slate-100/80 border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-orange-600" />
            <span>Instant Demo Presets (1-Click Evaluation):</span>
          </span>
          <span className="text-[11px] text-slate-500">Loads realistic photo, description & GPS</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {PRESET_HAZARDS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => applyPreset(p)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50 transition-all shadow-2xs"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Form or Submission Result Card */}
      {submissionResult ? (
        /* AI Result UI View */
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-8 animate-in fade-in duration-300">
          <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">AI Analysis Complete</h2>
              <p className="text-xs text-slate-500">
                Report ID: <span className="font-mono font-bold text-slate-800">{submissionResult.report.id}</span>
                {submissionResult.incidentId && (
                  <> • Master Incident: <span className="font-mono font-bold text-orange-600">{submissionResult.incidentId}</span></>
                )}
              </p>
            </div>
          </div>

          {/* AI Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">AI Category</span>
              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                <CategoryIcon category={submissionResult.aiAnalysis.category} className="w-4 h-4 text-orange-600" />
                <span>{getCategoryLabel(submissionResult.aiAnalysis.category)}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Severity</span>
              <div>
                <span className="capitalize font-bold text-slate-900 text-sm">
                  {submissionResult.aiAnalysis.severity}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Confidence</span>
              <div className="font-mono font-bold text-slate-900 text-sm">
                {(submissionResult.aiAnalysis.confidence * 100).toFixed(0)}%
              </div>
            </div>

            <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200 space-y-1">
              <span className="text-[11px] font-semibold text-orange-800 uppercase tracking-wider">Assigned Priority</span>
              <div>
                <PriorityBadge priority={submissionResult.report.priority} score={submissionResult.report.priority_score} showScore size="sm" />
              </div>
            </div>
          </div>

          {/* Duplicate Detection Status & Nearby Reports */}
          <div className="p-6 rounded-3xl bg-blue-50/70 border border-blue-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-blue-900">
                <Layers className="w-5 h-5 text-blue-600" />
                <span>Duplicate Incident Detection (Location & Category Match)</span>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                submissionResult.duplicateInfo.isDuplicate
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              }`}>
                {submissionResult.duplicateInfo.isDuplicate ? 'Duplicate Cluster Merged' : 'Unique Incident'}
              </span>
            </div>

            <p className="text-xs text-blue-900 leading-relaxed">
              {submissionResult.duplicateInfo.isDuplicate ? (
                <>
                  Found matching road hazard within <strong>{submissionResult.duplicateInfo.distanceMeters} meters</strong> with similar category. Automatically merged into Master Incident <strong className="font-mono">{submissionResult.incidentId}</strong> to avoid redundant repair work orders.
                </>
              ) : (
                'No identical road hazard reported within 200m radius. Initialized a new standalone incident tracking record.'
              )}
            </p>

            {/* Matched Duplicate Card */}
            {submissionResult.matchedReport && (
              <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-2xs space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Primary Matched Duplicate Report:
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {submissionResult.matchedReport.id}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        ~{submissionResult.duplicateInfo.distanceMeters}m away
                      </span>
                      <span className="text-xs font-semibold text-slate-600 capitalize">
                        {getCategoryLabel(submissionResult.matchedReport.category)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 line-clamp-1">
                      {submissionResult.matchedReport.location_name} • {submissionResult.matchedReport.description}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/reports/${submissionResult.matchedReport.id}`)}
                    className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors shrink-0"
                  >
                    Inspect Matched Report &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* Other Possible Duplicates Nearby */}
            {submissionResult.nearbyReports && submissionResult.nearbyReports.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-blue-200/60">
                <div className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>Other Possible Duplicate Reports Nearby (within 500m):</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {submissionResult.nearbyReports.map((nr: any) => (
                    <div
                      key={nr.id}
                      onClick={() => navigate(`/reports/${nr.id}`)}
                      className="p-3 bg-white hover:bg-blue-50/50 cursor-pointer rounded-xl border border-blue-200 transition-colors flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-mono font-bold text-slate-800">{nr.id}</div>
                        <div className="text-[11px] text-slate-500 capitalize">
                          {getCategoryLabel(nr.category)} • ~{nr.distanceMeters}m away
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-600">View &rarr;</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Transparent Priority Explanation */}
          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-orange-600" />
                <span>Priority Calculation & Reasoning Breakdown</span>
              </h4>
              <span className="text-xs font-mono font-bold text-slate-800">
                Score: {submissionResult.report.priority_score}/100
              </span>
            </div>

            {/* Points pill indicators */}
            {submissionResult.priorityBreakdown && (
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-800 font-semibold">
                  Severity: <strong>+{submissionResult.priorityBreakdown.severityPoints} pts</strong>
                </span>
                <span className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-800 font-semibold">
                  Incident Cluster: <strong>+{submissionResult.priorityBreakdown.clusterPoints} pts</strong>
                </span>
                <span className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-800 font-semibold">
                  AI Evidence: <strong>+{submissionResult.priorityBreakdown.confidencePoints} pts</strong>
                </span>
              </div>
            )}

            <p className="text-xs text-slate-800 leading-relaxed font-mono bg-white p-3.5 rounded-xl border border-slate-200">
              {submissionResult.report.priority_reasoning}
            </p>
            <div className="text-[11px] text-slate-500">
              Priority is objectively assigned through multi-factor mathematical weights (Severity + Cluster Size + Evidence Confidence).
            </div>
          </div>

          {/* AI Evidence & Safety Risk Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1.5">
              <span className="text-xs font-bold text-slate-800">Visible Evidence:</span>
              <p className="text-xs text-slate-600 leading-relaxed">
                {submissionResult.aiAnalysis.visible_evidence}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1.5">
              <span className="text-xs font-bold text-slate-800">Safety Risk to Road Users:</span>
              <p className="text-xs text-slate-600 leading-relaxed">
                {submissionResult.aiAnalysis.safety_risk}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100">
            <button
              onClick={() => {
                setSubmissionResult(null);
                setImagePreview(null);
                setDescription('');
              }}
              className="px-5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Submit Another Report</span>
            </button>

            <button
              onClick={() => navigate(`/reports/${submissionResult.report.id}`)}
              className="px-6 py-2.5 text-xs font-bold rounded-xl bg-orange-600 text-white hover:bg-orange-700 flex items-center gap-2 shadow-sm"
            >
              <span>View Full Report & Timeline</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Reporting Form */
        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
          {/* Section 1: Photographic Evidence */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-orange-600" />
                <span>1. Photographic Evidence</span>
              </h3>
              <span className="text-xs text-slate-400">JPG, PNG, WEBP (Max 10MB)</span>
            </div>

            {imagePreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 group max-h-80 flex items-center justify-center">
                <img
                  src={imagePreview}
                  alt="Upload preview"
                  className="max-h-80 w-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="absolute top-3 right-3 p-2 bg-slate-900/80 text-white rounded-full hover:bg-rose-600 transition-colors shadow-lg"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-orange-500 hover:bg-orange-50/30 transition-all cursor-pointer space-y-3"
              >
                <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Click to upload or take a photo of the hazard
                  </p>
                  <p className="text-xs text-slate-500">
                    Or click one of the preset scenarios above for instant test evidence
                  </p>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Section 2: Hazard Category & Description */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-600" />
              <span>2. Description & Preliminary Category</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preliminary Category Tag
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="pothole">Pothole</option>
                  <option value="damaged_road">Damaged Road / Tar Break</option>
                  <option value="open_manhole">Open Manhole / Uncovered Drain</option>
                  <option value="waterlogging">Waterlogging</option>
                  <option value="traffic_signal">Broken Traffic Signal</option>
                  <option value="streetlight">Non-Working Streetlight</option>
                  <option value="road_obstruction">Fallen Tree / Road Obstruction</option>
                  <option value="unsafe_intersection">Unsafe Intersection / Blind Turn</option>
                  <option value="damaged_sign">Damaged Road Sign</option>
                  <option value="other">Other Hazard</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  City (Indian Metro / Municipal Region)
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="Hyderabad">Hyderabad (GHMC)</option>
                  <option value="Bengaluru">Bengaluru (BBMP)</option>
                  <option value="Mumbai">Mumbai (BMC)</option>
                  <option value="Delhi">Delhi (MCD / NDMC)</option>
                  <option value="Chennai">Chennai (GCC)</option>
                  <option value="Pune">Pune (PMC)</option>
                  <option value="Kolkata">Kolkata (KMC)</option>
                  <option value="Ahmedabad">Ahmedabad (AMC)</option>
                  <option value="Other">Other City / Highway</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hazard Description *
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what is broken or dangerous (e.g. 10-inch pothole near cyber towers ascending flyover ramp, bikes skidding)..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
          </div>

          {/* Section 3: Location Details & Interactive Map */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-600" />
                <span>3. Location & GPS Verification</span>
              </h3>

              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={detectingLocation}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition-colors"
              >
                <Compass className={`w-3.5 h-3.5 ${detectingLocation ? 'animate-spin' : ''}`} />
                <span>{detectingLocation ? 'Detecting GPS...' : 'Use Current Location'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Street Address / Location Name *
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. Hitec City Main Road, Cyber Towers"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nearby Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Opposite Shilparamam Gate or Metro Pillar 120"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ward / Sector (Optional)
                </label>
                <input
                  type="text"
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  placeholder="e.g. Ward 104"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Interactive Leaflet Pin Selector */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Click map or drag pin to fine-tune exact hazard position:</span>
                <span className="text-[11px] text-orange-600 font-medium">200m Duplicate Radius Visualizer Active</span>
              </div>
              <LeafletMap
                center={[latitude || 17.4435, longitude || 78.3772]}
                zoom={14}
                height="320px"
                selectedLocation={{ latitude, longitude }}
                onLocationSelect={handleMapLocationSelect}
                showCircleRadiusMeters={200}
              />
            </div>
          </div>

          {/* Section 4: Additional Comments */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700">
              Additional Observations (Optional)
            </label>
            <input
              type="text"
              value={additionalComments}
              onChange={(e) => setAdditionalComments(e.target.value)}
              placeholder="e.g. Near-miss accident witnessed this morning; water hides hole depth during rain..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Submit Button & Progress Indicator */}
          <div className="pt-4 border-t border-slate-100">
            {submitting ? (
              <div className="p-5 rounded-2xl bg-orange-50 border border-orange-200 text-center space-y-3">
                <div className="inline-block w-7 h-7 border-3 border-orange-600 border-t-transparent rounded-full animate-spin" />
                <div className="text-sm font-bold text-orange-950">
                  Processing Road Safety Report
                </div>
                <div className="text-xs text-orange-700 font-mono">
                  {submitStage}
                </div>
              </div>
            ) : (
              <button
                type="submit"
                className="w-full py-4 text-base font-bold text-white bg-orange-600 hover:bg-orange-700 active:scale-[0.99] rounded-2xl shadow-lg shadow-orange-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-5 h-5" />
                <span>Analyze & Submit Report</span>
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};
