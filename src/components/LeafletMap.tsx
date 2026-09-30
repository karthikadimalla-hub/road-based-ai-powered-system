import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
// Ensure Leaflet is globally attached for plugins in bundlers
if (typeof window !== 'undefined') {
  (window as any).L = L;
}
import 'leaflet.heat';

import { PriorityLevel } from '../types';
import { Layers, Map as MapIcon, Globe, Compass, Crosshair, Navigation, Eye, Flame } from 'lucide-react';

export type MapTileMode = 'streets' | 'aerial' | 'hybrid' | 'terrain';

export interface MapMarkerItem {
  id: string;
  latitude: number;
  longitude: number;
  category: string;
  priority: PriorityLevel | string;
  status: string;
  title?: string;
  location_name?: string;
  city?: string;
  image_url?: string;
  incident_id?: string;
  description?: string;
  distanceFromUser?: number;
}

export interface LiveLocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}

export interface StreetViewRequest {
  latitude: number;
  longitude: number;
  location_name?: string;
  city?: string;
  category?: string;
  priority?: string;
  description?: string;
  reportId?: string;
}

interface LeafletMapProps {
  markers?: MapMarkerItem[];
  selectedLocation?: { latitude: number; longitude: number } | null;
  onLocationSelect?: (coords: { latitude: number; longitude: number }) => void;
  center?: [number, number];
  zoom?: number;
  height?: string;
  showCircleRadiusMeters?: number; // E.g., 200m duplicate radius
  onMarkerClick?: (marker: MapMarkerItem) => void;
  initialMode?: MapTileMode;
  showModeSwitcher?: boolean;
  showNativeLayerControl?: boolean;
  onModeChange?: (mode: MapTileMode) => void;
  liveLocation?: LiveLocationData | null;
  surroundingsRadiusMeters?: number | null; // E.g. 1000m, 2000m surroundings circle
  onLocateMe?: () => void;
  isLocating?: boolean;
  onOpenStreetView?: (target: StreetViewRequest) => void;
  showHeatmap?: boolean;
  onToggleHeatmap?: (show: boolean) => void;
  hideMarkers?: boolean;
}

function getMarkerColor(priority: string): string {
  switch (priority?.toLowerCase()) {
    case 'critical':
      return '#e11d48'; // rose-600
    case 'high':
      return '#ea580c'; // orange-600
    case 'medium':
      return '#d97706'; // amber-600
    case 'low':
      return '#059669'; // emerald-600
    default:
      return '#2563eb'; // blue-600
  }
}

function createCustomPin(color: string): L.DivIcon {
  return L.divIcon({
    className: 'custom-leaflet-pin',
    html: `
      <div style="position: relative; width: 32px; height: 38px; transform: translate(-16px, -38px);">
        <svg viewBox="0 0 24 32" width="32" height="38" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.37258 0 0 5.37258 0 12C0 19.5 12 32 12 32C12 32 24 19.5 24 12C24 5.37258 18.6274 0 12 0Z" fill="${color}" filter="drop-shadow(0 3px 4px rgba(0,0,0,0.4))"/>
          <circle cx="12" cy="11" r="5" fill="#ffffff" />
        </svg>
      </div>
    `,
    iconSize: [32, 38],
    iconAnchor: [16, 38],
    popupAnchor: [0, -36],
  });
}

function createLiveLocationPin(): L.DivIcon {
  return L.divIcon({
    className: 'live-location-pin',
    html: `
      <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; transform: translate(-20px, -20px);">
        <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background: rgba(37, 99, 235, 0.25); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; width: 26px; height: 26px; border-radius: 50%; background: rgba(37, 99, 235, 0.35); border: 2px solid #ffffff;"></div>
        <div style="width: 14px; height: 14px; border-radius: 50%; background: #2563eb; border: 2.5px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.4);"></div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
}

// Tile Layer Definitions
const TILE_PROVIDERS = {
  streets: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    },
  },
  aerial: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: {
      attribution: 'Tiles &copy; Esri World Imagery &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      maxZoom: 19,
    },
  },
  hybrid_labels: {
    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    options: {
      attribution: '&copy; Esri World Boundaries & Places',
      maxZoom: 19,
    },
  },
  terrain: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    options: {
      attribution: 'Tiles &copy; Esri Topo &mdash; Esri, DeLorme, NAVTEQ, TomTom, USGS, FAO, NPS, NRCAN, GeoBase',
      maxZoom: 19,
    },
  },
};

export const LeafletMap: React.FC<LeafletMapProps> = ({
  markers = [],
  selectedLocation,
  onLocationSelect,
  center = [20.5937, 78.9629], // Center of India
  zoom = 5,
  height = '420px',
  showCircleRadiusMeters,
  onMarkerClick,
  initialMode = 'streets',
  showModeSwitcher = true,
  showNativeLayerControl = true,
  onModeChange,
  liveLocation = null,
  surroundingsRadiusMeters = null,
  onLocateMe,
  isLocating = false,
  onOpenStreetView,
  showHeatmap = false,
  onToggleHeatmap,
  hideMarkers = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersMapRef = useRef<{ [key: string]: L.Layer }>({});
  const layerControlRef = useRef<L.Control.Layers | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const heatLayerRef = useRef<any>(null);
  const pickerMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);

  // Live Location Refs
  const liveMarkerRef = useRef<L.Marker | null>(null);
  const liveAccuracyCircleRef = useRef<L.Circle | null>(null);
  const surroundingsCircleRef = useRef<L.Circle | null>(null);

  const [activeMode, setActiveMode] = useState<MapTileMode>(initialMode);
  const [internalHeatmapActive, setInternalHeatmapActive] = useState<boolean>(showHeatmap);

  // Sync internal heatmap state with prop
  useEffect(() => {
    setInternalHeatmapActive(showHeatmap);
  }, [showHeatmap]);

  const toggleHeatmap = () => {
    const nextState = !internalHeatmapActive;
    setInternalHeatmapActive(nextState);
    if (onToggleHeatmap) {
      onToggleHeatmap(nextState);
    }
  };

  // Attach global street view handler for popup buttons
  useEffect(() => {
    (window as any).roadSafeOpenStreetView = (id: string) => {
      const found = markers.find((m) => m.id === id);
      if (found && onOpenStreetView) {
        onOpenStreetView({
          latitude: found.latitude,
          longitude: found.longitude,
          location_name: found.location_name,
          city: found.city,
          category: found.category,
          priority: found.priority as string,
          description: found.description,
          reportId: found.id,
        });
      }
    };
    return () => {
      delete (window as any).roadSafeOpenStreetView;
    };
  }, [markers, onOpenStreetView]);

  // Initialize Map and Layer Switcher Control
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      // Construct Base Tile Layers
      const streetsLayer = L.tileLayer(TILE_PROVIDERS.streets.url, TILE_PROVIDERS.streets.options);
      const aerialLayer = L.tileLayer(TILE_PROVIDERS.aerial.url, TILE_PROVIDERS.aerial.options);
      const hybridLayer = L.layerGroup([
        L.tileLayer(TILE_PROVIDERS.aerial.url, TILE_PROVIDERS.aerial.options),
        L.tileLayer(TILE_PROVIDERS.hybrid_labels.url, TILE_PROVIDERS.hybrid_labels.options),
      ]);
      const terrainLayer = L.tileLayer(TILE_PROVIDERS.terrain.url, TILE_PROVIDERS.terrain.options);

      layersMapRef.current = {
        streets: streetsLayer,
        aerial: aerialLayer,
        hybrid: hybridLayer,
        terrain: terrainLayer,
      };

      // Add Initial Base Layer
      const initialLayer = layersMapRef.current[initialMode] || streetsLayer;
      initialLayer.addTo(map);

      // Add Standard Leaflet Layer Switcher Control
      if (showNativeLayerControl) {
        const baseMaps = {
          '🗺️ Standard Streets (OSM)': streetsLayer,
          '🛰️ Satellite / Aerial Imagery': aerialLayer,
          '🏷️ Hybrid (Aerial + Roads)': hybridLayer,
          '⛰️ Topographic Terrain': terrainLayer,
        };

        const layerControl = L.control.layers(baseMaps, undefined, {
          position: 'topright',
          collapsed: true,
        }).addTo(map);

        layerControlRef.current = layerControl;

        // Synchronize state when user changes layer via Leaflet's native control
        map.on('baselayerchange', (e: any) => {
          let detectedMode: MapTileMode = 'streets';
          if (e.name.includes('Satellite') || e.name.includes('Aerial')) {
            detectedMode = 'aerial';
          } else if (e.name.includes('Hybrid')) {
            detectedMode = 'hybrid';
          } else if (e.name.includes('Terrain')) {
            detectedMode = 'terrain';
          }
          setActiveMode(detectedMode);
          if (onModeChange) onModeChange(detectedMode);
        });
      }

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Handle map clicks for location selection
      if (onLocationSelect) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          onLocationSelect({
            latitude: Number(e.latlng.lat.toFixed(6)),
            longitude: Number(e.latlng.lng.toFixed(6)),
          });
        });
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Programmatically switch tile layer
  const switchTileMode = (mode: MapTileMode) => {
    const map = mapInstanceRef.current;
    if (!map || !layersMapRef.current) return;

    // Remove all base tile layers
    Object.values(layersMapRef.current).forEach((layer) => {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });

    // Add selected layer
    const targetLayer = layersMapRef.current[mode];
    if (targetLayer) {
      targetLayer.addTo(map);
      // Ensure markers remain on top
      if (markersLayerRef.current) {
        markersLayerRef.current.eachLayer((l: any) => {
          if (typeof l.bringToFront === 'function') {
            l.bringToFront();
          }
        });
      }
    }

    setActiveMode(mode);
    if (onModeChange) onModeChange(mode);
  };

  // Sync mode if initialMode prop updates
  useEffect(() => {
    if (initialMode && initialMode !== activeMode) {
      switchTileMode(initialMode);
    }
  }, [initialMode]);

  // Update center or zoom when props change
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView(center, zoom, { animate: true });
    }
  }, [center[0], center[1], zoom]);

  // Update Markers Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    // If hideMarkers is true (e.g. pure heatmap view requested), skip adding individual markers
    if (hideMarkers) return;

    markers.forEach((m) => {
      const color = getMarkerColor(m.priority);
      const icon = createCustomPin(color);
      const marker = L.marker([m.latitude, m.longitude], { icon });

      const distanceBadge = m.distanceFromUser !== undefined
        ? `<div style="margin-top: 4px; font-size: 11px; font-weight: bold; color: #2563eb; background: #eff6ff; padding: 2px 6px; border-radius: 4px; display: inline-block;">
             📍 ${m.distanceFromUser < 1000 ? `${m.distanceFromUser}m` : `${(m.distanceFromUser / 1000).toFixed(1)} km`} from your live location
           </div>`
        : '';

      const popupContent = `
        <div style="font-family: system-ui, sans-serif; min-width: 215px; padding: 2px;">
          ${m.image_url ? `<img src="${m.image_url}" alt="Hazard" style="width: 100%; height: 95px; object-fit: cover; border-radius: 6px; margin-bottom: 6px;"/>` : ''}
          <div style="display: flex; gap: 4px; align-items: center; margin-bottom: 4px;">
            <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; background: ${color}20; color: ${color}; padding: 2px 6px; border-radius: 99px;">
              ${m.priority}
            </span>
            <span style="font-size: 10px; background: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 99px;">
              ${m.status}
            </span>
          </div>
          <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 700; color: #0f172a;">
            ${(m.category || 'Hazard').replace('_', ' ').toUpperCase()}
          </h4>
          <p style="margin: 0 0 4px 0; font-size: 11px; color: #64748b;">
            ${m.location_name || m.city || 'Location recorded'}
          </p>
          ${distanceBadge}
          <div style="display: flex; gap: 4px; margin-top: 8px;">
            <a href="#/reports/${m.id}" style="flex: 1; text-align: center; background: #ea580c; color: #ffffff; text-decoration: none; padding: 6px 6px; border-radius: 6px; font-size: 11px; font-weight: 600;">
              Details &rarr;
            </a>
            <button type="button" onclick="window.roadSafeOpenStreetView && window.roadSafeOpenStreetView('${m.id}')" style="flex: 1.1; text-align: center; background: #0f172a; color: #38bdf8; border: 1px solid #334155; padding: 6px 6px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;">
              📸 Street View
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      if (onMarkerClick) {
        marker.on('click', () => onMarkerClick(m));
      }

      marker.addTo(layer);
    });
  }, [markers, hideMarkers]);

  // Update Heatmap Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (heatLayerRef.current) {
      heatLayerRef.current.remove();
      heatLayerRef.current = null;
    }

    if (internalHeatmapActive && markers.length > 0) {
      // Build weighted heat points: [lat, lng, intensity]
      const heatPoints: [number, number, number][] = markers.map((m) => {
        let intensity = 0.5;
        const p = (m.priority || '').toLowerCase();
        if (p === 'critical') intensity = 1.0;
        else if (p === 'high') intensity = 0.8;
        else if (p === 'medium') intensity = 0.5;
        else if (p === 'low') intensity = 0.3;
        return [m.latitude, m.longitude, intensity];
      });

      try {
        if (typeof (L as any).heatLayer === 'function') {
          const heat = (L as any).heatLayer(heatPoints, {
            radius: 32,
            blur: 20,
            maxZoom: 16,
            max: 1.0,
            minOpacity: 0.35,
            gradient: {
              0.2: '#06b6d4', // Cyan (low density)
              0.4: '#10b981', // Emerald (moderate)
              0.6: '#f59e0b', // Amber (high)
              0.8: '#f97316', // Orange (very high)
              1.0: '#ef4444', // Red (critical frequency cluster)
            },
          });
          heat.addTo(map);
          heatLayerRef.current = heat;
        }
      } catch (err) {
        console.error('Failed to create Leaflet heatLayer:', err);
      }
    }
  }, [internalHeatmapActive, markers]);

  // Update Selected Location Picker Pin
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (pickerMarkerRef.current) {
      pickerMarkerRef.current.remove();
      pickerMarkerRef.current = null;
    }
    if (radiusCircleRef.current) {
      radiusCircleRef.current.remove();
      radiusCircleRef.current = null;
    }

    if (selectedLocation) {
      const pinIcon = createCustomPin('#ea580c');
      const marker = L.marker([selectedLocation.latitude, selectedLocation.longitude], {
        icon: pinIcon,
        draggable: !!onLocationSelect,
      });

      if (onLocationSelect) {
        marker.on('dragend', (e) => {
          const latlng = e.target.getLatLng();
          onLocationSelect({
            latitude: Number(latlng.lat.toFixed(6)),
            longitude: Number(latlng.lng.toFixed(6)),
          });
        });
      }

      marker.addTo(map);
      pickerMarkerRef.current = marker;

      // Draw radius circle if requested (e.g., 200m duplicate radius)
      if (showCircleRadiusMeters && showCircleRadiusMeters > 0) {
        radiusCircleRef.current = L.circle(
          [selectedLocation.latitude, selectedLocation.longitude],
          {
            radius: showCircleRadiusMeters,
            color: '#ea580c',
            fillColor: '#ea580c',
            fillOpacity: 0.15,
            weight: 2,
            dashArray: '4, 6',
          }
        ).addTo(map);
      }
    }
  }, [selectedLocation, showCircleRadiusMeters]);

  // Handle Live Location & Surroundings Circles
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clean previous live elements
    if (liveMarkerRef.current) {
      liveMarkerRef.current.remove();
      liveMarkerRef.current = null;
    }
    if (liveAccuracyCircleRef.current) {
      liveAccuracyCircleRef.current.remove();
      liveAccuracyCircleRef.current = null;
    }
    if (surroundingsCircleRef.current) {
      surroundingsCircleRef.current.remove();
      surroundingsCircleRef.current = null;
    }

    if (liveLocation) {
      const livePin = createLiveLocationPin();
      const marker = L.marker([liveLocation.latitude, liveLocation.longitude], {
        icon: livePin,
        zIndexOffset: 1000,
      });

      marker.bindPopup(`
        <div style="font-family: system-ui, sans-serif; padding: 2px;">
          <div style="display: flex; align-items: center; gap: 4px; color: #2563eb; font-weight: bold; font-size: 12px; margin-bottom: 4px;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #2563eb;"></span>
            Your Live GPS Location
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">
            ${liveLocation.address || 'Real-time positioning active'}
          </div>
          <div style="font-size: 10px; font-family: monospace; color: #64748b;">
            Lat: ${liveLocation.latitude.toFixed(5)}, Lon: ${liveLocation.longitude.toFixed(5)}
          </div>
          ${surroundingsRadiusMeters ? `<div style="font-size: 11px; font-weight: 600; color: #ea580c; margin-top: 4px;">Surroundings Radius: ${surroundingsRadiusMeters < 1000 ? `${surroundingsRadiusMeters}m` : `${(surroundingsRadiusMeters / 1000).toFixed(1)} km`}</div>` : ''}
        </div>
      `);

      marker.addTo(map);
      liveMarkerRef.current = marker;

      // Draw accuracy radius circle if provided
      if (liveLocation.accuracy && liveLocation.accuracy > 5) {
        liveAccuracyCircleRef.current = L.circle(
          [liveLocation.latitude, liveLocation.longitude],
          {
            radius: Math.min(liveLocation.accuracy, 200),
            color: '#2563eb',
            fillColor: '#3b82f6',
            fillOpacity: 0.1,
            weight: 1,
            dashArray: '2, 4',
          }
        ).addTo(map);
      }

      // Draw Surroundings Radar Monitoring Circle (e.g. 1km, 2km)
      if (surroundingsRadiusMeters && surroundingsRadiusMeters > 0) {
        surroundingsCircleRef.current = L.circle(
          [liveLocation.latitude, liveLocation.longitude],
          {
            radius: surroundingsRadiusMeters,
            color: '#2563eb',
            fillColor: '#2563eb',
            fillOpacity: 0.08,
            weight: 2,
            dashArray: '5, 8',
          }
        ).addTo(map);
      }

      // Smooth pan/fly to live location
      map.flyTo([liveLocation.latitude, liveLocation.longitude], Math.max(map.getZoom(), 14), {
        animate: true,
        duration: 1.2,
      });
    }
  }, [liveLocation, surroundingsRadiusMeters]);

  // Handler to open street view for current map center
  const handleOpenCurrentCenterStreetView = () => {
    if (!mapInstanceRef.current || !onOpenStreetView) return;
    const centerLatLng = mapInstanceRef.current.getCenter();
    onOpenStreetView({
      latitude: Number(centerLatLng.lat.toFixed(6)),
      longitude: Number(centerLatLng.lng.toFixed(6)),
      location_name: 'Selected Road Coordinates',
    });
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-xs z-0 group">
      {/* Map Mode / Aerial & Heatmap Switcher Overlay */}
      {showModeSwitcher && (
        <div className="absolute top-3 left-14 z-20 flex flex-wrap items-center bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-md border border-slate-200/90 text-xs font-semibold text-slate-700 gap-0.5">
          <button
            type="button"
            onClick={() => switchTileMode('streets')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeMode === 'streets'
                ? 'bg-orange-600 text-white shadow-2xs font-bold'
                : 'hover:bg-slate-100 text-slate-700'
            }`}
            title="Standard Street Map (OpenStreetMap)"
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Streets</span>
          </button>

          <button
            type="button"
            onClick={() => switchTileMode('aerial')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeMode === 'aerial'
                ? 'bg-orange-600 text-white shadow-2xs font-bold'
                : 'hover:bg-slate-100 text-slate-700'
            }`}
            title="Satellite / Aerial High-Resolution Photography"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Aerial</span>
          </button>

          <button
            type="button"
            onClick={() => switchTileMode('hybrid')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeMode === 'hybrid'
                ? 'bg-orange-600 text-white shadow-2xs font-bold'
                : 'hover:bg-slate-100 text-slate-700'
            }`}
            title="Satellite Aerial Imagery with Roads & Place Labels"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hybrid</span>
          </button>

          <button
            type="button"
            onClick={() => switchTileMode('terrain')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeMode === 'terrain'
                ? 'bg-orange-600 text-white shadow-2xs font-bold'
                : 'hover:bg-slate-100 text-slate-700'
            }`}
            title="Topographical Elevation Terrain"
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Terrain</span>
          </button>

          {/* Heatmap Layer Toggle Button */}
          <button
            type="button"
            onClick={toggleHeatmap}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ml-1 ${
              internalHeatmapActive
                ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-sm font-bold animate-pulse'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Toggle Hazard Density Heatmap Layer"
          >
            <Flame className={`w-3.5 h-3.5 ${internalHeatmapActive ? 'text-white' : 'text-rose-500'}`} />
            <span>Heatmap</span>
          </button>

          {onOpenStreetView && (
            <button
              type="button"
              onClick={handleOpenCurrentCenterStreetView}
              className="px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all bg-slate-900 hover:bg-slate-800 text-sky-400 font-bold ml-1"
              title="Open 360° Ground-Level Street View at Map Center"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Street View 360°</span>
            </button>
          )}
        </div>
      )}

      {/* Floating Action Controls on Canvas (Locate Me & Street View) */}
      <div className="absolute bottom-6 right-3 z-20 flex flex-col items-end gap-2">
        {onOpenStreetView && (
          <button
            type="button"
            onClick={handleOpenCurrentCenterStreetView}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-sky-400 hover:bg-slate-800 border border-slate-700 shadow-lg text-xs font-bold transition-all hover:scale-105"
            title="Inspect current road center in 360° Street View"
          >
            <Eye className="w-4 h-4 text-sky-400" />
            <span>Street View 360°</span>
          </button>
        )}

        {onLocateMe && (
          <button
            type="button"
            onClick={onLocateMe}
            disabled={isLocating}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl shadow-lg border text-xs font-bold transition-all ${
              liveLocation
                ? 'bg-blue-600 text-white border-blue-500 hover:bg-blue-700 shadow-blue-600/30'
                : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50 hover:text-orange-600'
            }`}
            title="Center on my live location and scan surroundings"
          >
            <Crosshair className={`w-4 h-4 ${isLocating ? 'animate-spin text-orange-500' : liveLocation ? 'animate-pulse' : 'text-blue-600'}`} />
            <span>{isLocating ? 'Acquiring GPS...' : liveLocation ? 'Live GPS Active' : 'Live Location'}</span>
          </button>
        )}
      </div>

      {/* Floating Heatmap Thermal Intensity Legend */}
      {internalHeatmapActive && (
        <div className="absolute top-16 right-3 z-20 bg-slate-950/85 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-slate-800 shadow-xl text-white space-y-1.5 pointer-events-auto max-w-[220px]">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="flex items-center gap-1 text-amber-400">
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              <span>Hazard Density Heatmap</span>
            </span>
          </div>

          {/* Thermal gradient strip */}
          <div className="w-full h-2.5 rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 via-amber-400 via-orange-500 to-rose-600 shadow-inner" />

          <div className="flex justify-between text-[9px] font-mono text-slate-400">
            <span>Low Risk</span>
            <span>Frequent</span>
            <span className="text-rose-400 font-bold">Critical Cluster</span>
          </div>
        </div>
      )}

      {/* Actual Map Container */}
      <div ref={mapContainerRef} style={{ height, width: '100%' }} />

      {/* Floating Mode Indicator Badge */}
      <div className="absolute bottom-2.5 left-3 z-10 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-mono text-slate-300 pointer-events-none flex items-center gap-1.5 border border-slate-800">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>TILES: {activeMode.toUpperCase()}{internalHeatmapActive ? ' + HEATMAP' : ''}</span>
      </div>
    </div>
  );
};
