import React, { useState } from 'react';
import {
  X,
  Compass,
  RotateCw,
  ExternalLink,
  MapPin,
  Eye,
  Maximize2,
  Minimize2,
  Navigation,
  ShieldAlert,
} from 'lucide-react';
import { PriorityBadge } from './PriorityBadge';
import { CategoryIcon, getCategoryLabel } from './CategoryIcon';

export interface StreetViewTarget {
  latitude: number;
  longitude: number;
  location_name?: string;
  city?: string;
  category?: string;
  priority?: string;
  description?: string;
  reportId?: string;
}

interface StreetViewModalProps {
  target: StreetViewTarget | null;
  onClose: () => void;
}

export const StreetViewModal: React.FC<StreetViewModalProps> = ({ target, onClose }) => {
  const [heading, setHeading] = useState<number>(0); // 0 = North, 90 = East, 180 = South, 270 = West
  const [pitch, setPitch] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [iframeError, setIframeError] = useState<boolean>(false);

  if (!target) return null;

  const lat = target.latitude.toFixed(6);
  const lon = target.longitude.toFixed(6);

  // Universal Google Street View embed URL (svembed layer)
  const streetViewUrl = `https://maps.google.com/maps?layer=c&cbll=${lat},${lon}&cbp=12,${heading},${pitch},0,0&output=svembed`;
  const externalGoogleMapsUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lon}&heading=${heading}`;

  const rotateHeading = (delta: number) => {
    setHeading((prev) => (prev + delta + 360) % 360);
  };

  const getCompassDirection = (deg: number): string => {
    if (deg >= 315 || deg < 45) return 'North (0°)';
    if (deg >= 45 && deg < 135) return 'East (90°)';
    if (deg >= 135 && deg < 225) return 'South (180°)';
    return 'West (270°)';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div
        className={`bg-slate-900 text-white rounded-3xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col transition-all duration-300 ${
          isFullscreen ? 'w-full h-full max-w-none' : 'w-full max-w-5xl h-[88vh]'
        }`}
      >
        {/* Header Bar */}
        <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-600/30">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-white tracking-tight">
                  Ground-Level Street View
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold uppercase tracking-wider border border-orange-500/30">
                  360° Inspection
                </span>
                {target.priority && <PriorityBadge priority={target.priority} size="sm" />}
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-orange-400" />
                <span className="truncate max-w-sm sm:max-w-md">
                  {target.location_name || `${lat}, ${lon}`} {target.city ? `• ${target.city}` : ''}
                </span>
              </p>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            <a
              href={externalGoogleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors"
              title="Open native Street View in Google Maps"
            >
              <span>Open in Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen View'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors ml-1"
              title="Close Street View"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Street View Visual Canvas */}
        <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
          <iframe
            key={`${lat}-${lon}-${heading}`}
            src={streetViewUrl}
            title="Road Street View Panorama"
            className="w-full h-full border-0"
            allowFullScreen
            loading="lazy"
            onError={() => setIframeError(true)}
          />

          {/* Top-Left Floating Hazard HUD Banner */}
          {target.category && (
            <div className="absolute top-4 left-4 z-10 bg-slate-950/85 backdrop-blur-md p-3 rounded-2xl border border-slate-800 shadow-xl max-w-sm pointer-events-auto text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-orange-400 uppercase tracking-wider text-[11px]">
                <CategoryIcon category={target.category} className="w-4 h-4" />
                <span>{getCategoryLabel(target.category)}</span>
              </div>
              {target.description && (
                <p className="text-slate-300 text-[11px] line-clamp-2 leading-relaxed">
                  {target.description}
                </p>
              )}
              <div className="font-mono text-[10px] text-slate-400">
                GPS: {lat}, {lon}
              </div>
            </div>
          )}

          {/* Heading Compass Overlay */}
          <div className="absolute bottom-4 left-4 z-10 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-2">
            <Compass className="w-4 h-4 text-orange-400" />
            <span>Orientation: {getCompassDirection(heading)}</span>
          </div>

          {/* Rotate Controls Overlay */}
          <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-xl">
            <button
              type="button"
              onClick={() => rotateHeading(-90)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all flex items-center gap-1"
              title="Turn 90° Left"
            >
              <span>↶ Turn Left</span>
            </button>

            <button
              type="button"
              onClick={() => rotateHeading(180)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all flex items-center gap-1"
              title="Turn 180° Around"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Turn 180°</span>
            </button>

            <button
              type="button"
              onClick={() => rotateHeading(90)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all flex items-center gap-1"
              title="Turn 90° Right"
            >
              <span>Turn Right ↷</span>
            </button>
          </div>
        </div>

        {/* Footer Info Bar */}
        <div className="px-5 py-2.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Navigation className="w-3.5 h-3.5 text-blue-400" />
            <span>Drag the panorama to look 360° around the road. Use scroll wheel to zoom into road surfaces.</span>
          </div>

          <div className="flex items-center gap-3">
            <span>Coordinates: <strong>{lat}, {lon}</strong></span>
            <a
              href={externalGoogleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-400 hover:text-orange-300 font-bold underline inline-flex items-center gap-1"
            >
              <span>Full Screen Pano</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
