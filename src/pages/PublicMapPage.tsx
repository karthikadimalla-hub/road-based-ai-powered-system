import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { LeafletMap, MapMarkerItem, MapTileMode, LiveLocationData } from '../components/LeafletMap';
import { PriorityBadge } from '../components/PriorityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { CategoryIcon, getCategoryLabel } from '../components/CategoryIcon';
import { StreetViewModal, StreetViewTarget } from '../components/StreetViewModal';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../components/Toast';
import {
  MapPin,
  Filter,
  Layers,
  Sparkles,
  Info,
  Navigation,
  Globe,
  Map as MapIcon,
  Compass,
  Crosshair,
  Radar,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  LocateFixed,
  ChevronDown,
  ChevronUp,
  Eye,
  Flame,
} from 'lucide-react';

interface PublicMapPageProps {
  navigate: (path: string) => void;
}

const INDIAN_CITIES = [
  { name: 'All India', coords: [20.5937, 78.9629] as [number, number], zoom: 5 },
  { name: 'Hyderabad', coords: [17.3850, 78.4867] as [number, number], zoom: 12 },
  { name: 'Bengaluru', coords: [12.9716, 77.5946] as [number, number], zoom: 12 },
  { name: 'Mumbai', coords: [19.0760, 72.8777] as [number, number], zoom: 12 },
  { name: 'Delhi', coords: [28.6139, 77.2090] as [number, number], zoom: 12 },
  { name: 'Chennai', coords: [13.0827, 80.2707] as [number, number], zoom: 12 },
  { name: 'Pune', coords: [18.5204, 73.8567] as [number, number], zoom: 12 },
  { name: 'Kolkata', coords: [22.5726, 88.3639] as [number, number], zoom: 12 },
  { name: 'Ahmedabad', coords: [23.0225, 72.5714] as [number, number], zoom: 12 },
];

// Helper to compute Haversine distance in meters
function computeDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export const PublicMapPage: React.FC<PublicMapPageProps> = ({ navigate }) => {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [markers, setMarkers] = useState<MapMarkerItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Map Mode
  const [category, setCategory] = useState('all');
  const [priority, setPriority] = useState('all');
  const [status, setStatus] = useState('all');
  const [selectedCity, setSelectedCity] = useState(INDIAN_CITIES[0]);
  const [mapMode, setMapMode] = useState<MapTileMode>('streets');

  // Live Location State
  const [liveLocation, setLiveLocation] = useState<LiveLocationData | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [surroundingsRadius, setSurroundingsRadius] = useState<number>(2000); // 2km default radius
  const [filterOnlySurroundings, setFilterOnlySurroundings] = useState<boolean>(false);
  const [showSurroundingsDrawer, setShowSurroundingsDrawer] = useState<boolean>(true);

  // Street View State
  const [streetViewTarget, setStreetViewTarget] = useState<StreetViewTarget | null>(null);

  // Heatmap State
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
  const [showMarkersWithHeatmap, setShowMarkersWithHeatmap] = useState<boolean>(true);

  // Map center trigger
  const [mapCenter, setMapCenter] = useState<[number, number]>(selectedCity.coords);
  const [mapZoom, setMapZoom] = useState<number>(selectedCity.zoom);

  const loadMapReports = async () => {
    setLoading(true);
    try {
      const data = await api.getMapReports({
        category: category !== 'all' ? category : undefined,
        priority: priority !== 'all' ? priority : undefined,
        status: status !== 'all' ? status : undefined,
        city: selectedCity.name !== 'All India' ? selectedCity.name : undefined,
      });
      setMarkers(data);
    } catch (err: any) {
      console.error('Error loading map points:', err);
      showToast('Failed to load map data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMapReports();
  }, [category, priority, status, selectedCity]);

  const handleCityChange = (cityName: string) => {
    const found = INDIAN_CITIES.find((c) => c.name === cityName);
    if (found) {
      setSelectedCity(found);
      setMapCenter(found.coords);
      setMapZoom(found.zoom);
    }
  };

  // Live Geolocation Acquisition
  const handleLocateLiveLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'error');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lon = Number(pos.coords.longitude.toFixed(6));
        const accuracy = Math.round(pos.coords.accuracy);

        let detectedAddress = 'GPS Coordinates Acquired';
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
          );
          const geodata = await res.json();
          if (geodata && geodata.display_name) {
            detectedAddress = geodata.display_name.split(',').slice(0, 3).join(', ');
          }
        } catch (e) {
          // ignore geocode fallback
        }

        const newLiveLoc: LiveLocationData = {
          latitude: lat,
          longitude: lon,
          accuracy,
          address: detectedAddress,
        };

        setLiveLocation(newLiveLoc);
        setMapCenter([lat, lon]);
        setMapZoom(15);
        setIsLocating(false);
        showToast('Live location identified! Scanning surroundings for hazards...', 'success');
      },
      (err) => {
        setIsLocating(false);
        // Fallback for environments with strict GPS block / desktop container: offer quick demo location
        showToast(`Could not acquire GPS: ${err.message}. Using demo location in Hyderabad.`, 'warning');
        simulateLiveLocation(17.4435, 78.3772, 'Cyber Towers, Hitec City, Hyderabad');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Demo Location Simulator (useful for testing surroundings in preview environments)
  const simulateLiveLocation = (lat: number, lon: number, address: string) => {
    const simulated: LiveLocationData = {
      latitude: lat,
      longitude: lon,
      accuracy: 25,
      address,
    };
    setLiveLocation(simulated);
    setMapCenter([lat, lon]);
    setMapZoom(15);
    showToast(`Live surroundings set to: ${address}`, 'info');
  };

  // Process markers with distance from live user position
  const processedMarkers = useMemo(() => {
    return markers.map((m) => {
      let distanceFromUser: number | undefined = undefined;
      if (liveLocation) {
        distanceFromUser = computeDistanceMeters(
          liveLocation.latitude,
          liveLocation.longitude,
          m.latitude,
          m.longitude
        );
      }
      return {
        ...m,
        distanceFromUser,
      };
    });
  }, [markers, liveLocation]);

  // Hazards in user's surroundings
  const surroundingsHazards = useMemo(() => {
    if (!liveLocation) return [];
    return processedMarkers
      .filter((m) => m.distanceFromUser !== undefined && m.distanceFromUser <= surroundingsRadius)
      .sort((a, b) => (a.distanceFromUser || 0) - (b.distanceFromUser || 0));
  }, [processedMarkers, liveLocation, surroundingsRadius]);

  // Markers to actually display on map
  const displayMarkers = useMemo(() => {
    if (filterOnlySurroundings && liveLocation) {
      return surroundingsHazards;
    }
    return processedMarkers;
  }, [processedMarkers, surroundingsHazards, filterOnlySurroundings, liveLocation]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <MapPin className="w-7 h-7 text-orange-600" />
            <span>{t('map.title', 'Public Road Safety GIS Map')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {t('map.subtitle', 'Real-time geospatial visualization of reported hazards across major Indian metropolitan centers with Aerial Satellite, density heatmap, and Street views.')}
          </p>
        </div>

        {/* Priority Legend */}
        <div className="flex items-center gap-3 text-[11px] font-semibold bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600" /> {t('priority.critical', 'Critical')}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-600" /> {t('priority.high', 'High')}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> {t('priority.medium', 'Medium')}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> {t('priority.low', 'Low')}
          </span>
        </div>
      </div>

      {/* Live Location & Surroundings Control Bar */}
      <div className="bg-linear-to-r from-blue-50/90 via-white to-orange-50/70 p-5 rounded-3xl border border-blue-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Radar className="w-3 h-3 text-blue-600 animate-spin" style={{ animationDuration: '4s' }} />
                <span>Live Surroundings Radar</span>
              </span>
              {liveLocation && (
                <span className="text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>GPS Active</span>
                </span>
              )}
            </div>

            <h2 className="text-base font-extrabold text-slate-900">
              {liveLocation
                ? `Monitoring hazards around: ${liveLocation.address}`
                : 'Scan & Monitor Road Hazards in Your Immediate Surroundings'}
            </h2>
            <p className="text-xs text-slate-500">
              {liveLocation
                ? `Found ${surroundingsHazards.length} road hazards within ${(surroundingsRadius / 1000).toFixed(1)} km of your live position.`
                : 'Turn on live location to inspect nearby potholes, open drains, and broken signals within walking or driving distance.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleLocateLiveLocation}
              disabled={isLocating}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 flex items-center gap-2 transition-all active:scale-95"
            >
              <Crosshair className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Detecting GPS...' : liveLocation ? 'Refresh Live Location' : 'Locate My Surroundings'}</span>
            </button>

            {liveLocation && (
              <button
                type="button"
                onClick={() => navigate(`/report?lat=${liveLocation.latitude}&lon=${liveLocation.longitude}`)}
                className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md shadow-orange-600/25 flex items-center gap-1.5 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Report Here</span>
              </button>
            )}
          </div>
        </div>

        {/* Surroundings Radius Selector & Controls */}
        {liveLocation && (
          <div className="pt-3 border-t border-blue-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Surroundings Radius:</span>
              <div className="inline-flex rounded-xl bg-white border border-slate-200 p-0.5 shadow-2xs">
                {[500, 1000, 2000, 5000].map((radius) => (
                  <button
                    key={radius}
                    type="button"
                    onClick={() => setSurroundingsRadius(radius)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      surroundingsRadius === radius
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {radius < 1000 ? `${radius}m` : `${radius / 1000} km`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={filterOnlySurroundings}
                  onChange={(e) => setFilterOnlySurroundings(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Isolate only hazards in my surroundings ({surroundingsHazards.length})</span>
              </label>

              <button
                type="button"
                onClick={() => setShowSurroundingsDrawer(!showSurroundingsDrawer)}
                className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1"
              >
                <span>{showSurroundingsDrawer ? 'Hide Nearby List' : 'View Nearby List'}</span>
                {showSurroundingsDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}

        {/* Quick Simulator Buttons for Testing */}
        {!liveLocation && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <span className="font-semibold">Test Live Surroundings in 1-Click:</span>
            <button
              type="button"
              onClick={() => simulateLiveLocation(17.4435, 78.3772, 'Cyber Towers, Hitec City, Hyderabad')}
              className="px-2 py-0.5 rounded bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-700"
            >
              Hyderabad (Hitec City)
            </button>
            <button
              type="button"
              onClick={() => simulateLiveLocation(12.9352, 77.6953, 'Kadubeesanahalli, Outer Ring Road, Bengaluru')}
              className="px-2 py-0.5 rounded bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-700"
            >
              Bengaluru (Bellandur ORR)
            </button>
            <button
              type="button"
              onClick={() => simulateLiveLocation(28.5672, 77.2100, 'Ring Road AIIMS Flyover, Delhi')}
              className="px-2 py-0.5 rounded bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-700"
            >
              Delhi (AIIMS Ring Road)
            </button>
          </div>
        )}
      </div>

      {/* Filter and Layer Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Top row: Map View / Aerial Mode Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Layers className="w-4 h-4 text-orange-600" />
            <span>Map Imagery Mode:</span>
          </div>

          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMapMode('streets')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                mapMode === 'streets'
                  ? 'bg-white text-orange-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>{t('map.mode.streets', 'Streets (OSM)')}</span>
            </button>

            <button
              type="button"
              onClick={() => setMapMode('aerial')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                mapMode === 'aerial'
                  ? 'bg-white text-orange-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{t('map.mode.aerial', 'Aerial / Satellite')}</span>
            </button>

            <button
              type="button"
              onClick={() => setMapMode('hybrid')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                mapMode === 'hybrid'
                  ? 'bg-white text-orange-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{t('map.mode.hybrid', 'Hybrid (Aerial + Roads)')}</span>
            </button>

            <button
              type="button"
              onClick={() => setMapMode('terrain')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                mapMode === 'terrain'
                  ? 'bg-white text-orange-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{t('map.mode.terrain', 'Terrain')}</span>
            </button>

            {/* Heatmap Layer Toggle */}
            <button
              type="button"
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all font-bold ${
                showHeatmap
                  ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-xs animate-pulse'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
              title="Toggle Hazard Frequency Heatmap Layer"
            >
              <Flame className={`w-3.5 h-3.5 ${showHeatmap ? 'text-white' : 'text-rose-500'}`} />
              <span>{t('map.mode.heatmap', 'Heatmap Layer')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setStreetViewTarget({
                  latitude: mapCenter[0],
                  longitude: mapCenter[1],
                  location_name: selectedCity.name !== 'All India' ? `${selectedCity.name} Road Corridor` : 'Center Coordinates',
                  city: selectedCity.name,
                });
              }}
              className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all bg-slate-900 hover:bg-slate-800 text-sky-400 font-bold ml-1 shadow-xs"
              title="Open 360° Ground-Level Street View at current center"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{t('map.mode.streetView', 'Street View 360°')}</span>
            </button>
          </div>
        </div>

        {/* Heatmap Active Status & Control Strip */}
        {showHeatmap && (
          <div className="p-3.5 bg-slate-950 text-white rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs border border-slate-800 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 font-bold text-amber-400">
                <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
                <span>Hazard Density Heatmap Active</span>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-medium">Frequency Gradient:</span>
                <div className="w-28 h-2 rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 via-amber-400 to-rose-600" />
                <span className="text-[10px] text-slate-400">Low &rarr; <strong className="text-rose-400">Critical Cluster</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={showMarkersWithHeatmap}
                  onChange={(e) => setShowMarkersWithHeatmap(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500 w-3.5 h-3.5"
                />
                <span>Overlay Pin Icons</span>
              </label>
              <span className="text-slate-400 font-mono">
                {displayMarkers.length} weighted points
              </span>
            </div>
          </div>
        )}

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Jump to City
            </label>
            <select
              value={selectedCity.name}
              onChange={(e) => handleCityChange(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white font-medium focus:ring-1 focus:ring-orange-500"
            >
              {INDIAN_CITIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Hazard Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-orange-500"
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

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Priority Level
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-orange-500"
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
              className="w-full p-2 rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-orange-500"
            >
              <option value="all">All Statuses</option>
              <option value="Reported">Reported</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Map Canvas & Optional Surroundings Side Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map Canvas */}
        <div className={`${liveLocation && showSurroundingsDrawer ? 'lg:col-span-8' : 'lg:col-span-12'} relative transition-all`}>
          <LeafletMap
            markers={displayMarkers}
            center={mapCenter}
            zoom={mapZoom}
            height="640px"
            initialMode={mapMode}
            onModeChange={setMapMode}
            showModeSwitcher={true}
            showNativeLayerControl={true}
            liveLocation={liveLocation}
            surroundingsRadiusMeters={surroundingsRadius}
            onLocateMe={handleLocateLiveLocation}
            isLocating={isLocating}
            onOpenStreetView={setStreetViewTarget}
            showHeatmap={showHeatmap}
            onToggleHeatmap={setShowHeatmap}
            hideMarkers={showHeatmap && !showMarkersWithHeatmap}
          />

          {/* Floating count indicator */}
          <div className="absolute bottom-5 left-5 z-20 bg-slate-950/85 backdrop-blur-md text-white text-xs px-3.5 py-2 rounded-xl shadow-lg border border-slate-800 flex items-center gap-2 pointer-events-none">
            <Navigation className="w-3.5 h-3.5 text-orange-400" />
            <span>
              Displaying <strong>{displayMarkers.length}</strong> markers
              {liveLocation ? ` • Live Surroundings Active (${(surroundingsRadius / 1000).toFixed(1)} km)` : ` in ${selectedCity.name}`}
            </span>
          </div>
        </div>

        {/* Nearby Hazards in Live Surroundings Drawer */}
        {liveLocation && showSurroundingsDrawer && (
          <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-md p-5 space-y-4 max-h-[640px] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Radar className="w-4 h-4 text-blue-600" />
                  <span>Hazards in Your Surroundings</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Ranked by distance from your live location
                </p>
              </div>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {surroundingsHazards.length}
              </span>
            </div>

            {surroundingsHazards.length === 0 ? (
              <div className="p-8 text-center space-y-2 text-slate-400">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                <div className="text-xs font-bold text-slate-700">No hazards reported within {(surroundingsRadius / 1000).toFixed(1)} km</div>
                <p className="text-[11px] text-slate-500">
                  Great news! Your immediate road stretch appears clear, or you can expand the radius to 5 km.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {surroundingsHazards.map((h) => (
                  <div
                    key={h.id}
                    onClick={() => {
                      setMapCenter([h.latitude, h.longitude]);
                      setMapZoom(16);
                    }}
                    className="p-3.5 rounded-2xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50/20 transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600">
                        <CategoryIcon category={h.category} className="w-4 h-4" />
                        <span>{getCategoryLabel(h.category)}</span>
                      </div>
                      <PriorityBadge priority={h.priority} size="sm" />
                    </div>

                    <div className="text-xs text-slate-800 font-medium line-clamp-2">
                      {h.description}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <span className="font-bold text-blue-600">
                        📍 {h.distanceFromUser !== undefined && (h.distanceFromUser < 1000 ? `${h.distanceFromUser}m away` : `${(h.distanceFromUser / 1000).toFixed(1)} km away`)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStreetViewTarget({
                              latitude: h.latitude,
                              longitude: h.longitude,
                              location_name: h.location_name,
                              city: h.city,
                              category: h.category,
                              priority: h.priority,
                              description: h.description,
                              reportId: h.id,
                            });
                          }}
                          className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-sky-400 font-bold text-[10px] flex items-center gap-1 shadow-2xs"
                          title="Open 360° Ground-Level Street View of this hazard"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Street View</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/reports/${h.id}`);
                          }}
                          className="text-orange-600 hover:text-orange-700 font-bold flex items-center gap-0.5 ml-1"
                        >
                          <span>View</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ground-Level 360° Street View Inspection Modal */}
      <StreetViewModal
        target={streetViewTarget}
        onClose={() => setStreetViewTarget(null)}
      />
    </div>
  );
};
