import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, Radio, RotateCcw, ShieldAlert, ArrowRight, MapPin, ExternalLink } from 'lucide-react';
import { Transaction } from '../types';
import { fetchGeoRoutes } from '../api';

interface GlobalSatelliteRadarProps {
  onSelectTransaction: (tx: Transaction) => void;
  className?: string;
}

export const GlobalSatelliteRadar: React.FC<GlobalSatelliteRadarProps> = ({
  onSelectTransaction,
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const [routes, setRoutes] = useState<Transaction[]>([]);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [mapMode, setMapMode] = useState<'satellite' | 'dark'>('satellite');
  const [isLoading, setIsLoading] = useState(false);

  const loadRoutes = () => {
    setIsLoading(true);
    fetchGeoRoutes({ type: 'SUSPICIOUS', limit: 15 })
      .then((res) => {
        setRoutes(res.routes);
        if (res.routes.length > 0 && !selectedTx) {
          setSelectedTx(res.routes[0]);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Default center on Indian Subcontinent & Indian Ocean / Arabian Sea
    const map = L.map(mapContainerRef.current, {
      center: [20.5937, 78.9629],
      zoom: 4,
      zoomControl: false,
      attributionControl: false,
    });
    mapInstanceRef.current = map;

    // Basemap layers
    if (mapMode === 'satellite') {
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18 }
      ).addTo(map);
      L.tileLayer(
        'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18 }
      ).addTo(map);
    } else {
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        { maxZoom: 19, subdomains: 'abcd' }
      ).addTo(map);
    }

    // Render each active transaction route
    const allLatLngs: [number, number][] = [];

    routes.forEach((tx) => {
      const geo = (tx as any).origin && (tx as any).destination
        ? {
            origin: (tx as any).origin,
            destination: (tx as any).destination,
            distance_km: (tx as any).distance_km || 120,
            geofence_status: (tx as any).geofence_status || 'SUSPICIOUS',
            geofence_details: (tx as any).geofence_details || 'Anomaly detected',
          }
        : null;

      if (!geo) return;

      allLatLngs.push([geo.origin.lat, geo.origin.lon]);
      allLatLngs.push([geo.destination.lat, geo.destination.lon]);

      const isHigh = tx.risk_level === 'HIGH';
      const color = isHigh ? '#f43f5e' : '#f59e0b';

      // Origin Pin
      const originIcon = L.divIcon({
        className: 'custom-radar-origin',
        html: `
          <div class="relative flex items-center justify-center w-6 h-6 -translate-x-3 -translate-y-3">
            <div class="absolute w-6 h-6 rounded-full bg-cyan-400/30 animate-radar-ping"></div>
            <div class="w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-white shadow-md"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const oMarker = L.marker([geo.origin.lat, geo.origin.lon], { icon: originIcon }).addTo(map);
      oMarker.on('click', () => setSelectedTx(tx));

      // Destination Pin
      const destIcon = L.divIcon({
        className: 'custom-radar-dest',
        html: `
          <div class="relative flex items-center justify-center w-6 h-6 -translate-x-3 -translate-y-3">
            <div class="absolute w-6 h-6 rounded-full ${isHigh ? 'bg-rose-500/40' : 'bg-amber-500/40'} animate-radar-ping"></div>
            <div class="w-3.5 h-3.5 rounded-full ${isHigh ? 'bg-rose-500' : 'bg-amber-500'} border-2 border-white shadow-md"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const dMarker = L.marker([geo.destination.lat, geo.destination.lon], { icon: destIcon }).addTo(map);
      dMarker.on('click', () => setSelectedTx(tx));

      // Animated Arc Line
      const arcPoints: [number, number][] = [];
      const steps = 25;
      const curveHeight = Math.min(geo.distance_km / 600, 3.2);

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const lat = geo.origin.lat + (geo.destination.lat - geo.origin.lat) * t;
        const lon = geo.origin.lon + (geo.destination.lon - geo.origin.lon) * t;
        const arcOffset = Math.sin(t * Math.PI) * curveHeight;
        arcPoints.push([lat + arcOffset, lon]);
      }

      const line = L.polyline(arcPoints, {
        color,
        weight: 3,
        opacity: 0.85,
        className: 'leaflet-geodesic-animated',
      }).addTo(map);

      line.on('click', () => setSelectedTx(tx));
    });

    if (allLatLngs.length > 0) {
      map.fitBounds(L.latLngBounds(allLatLngs), { padding: [40, 40], maxZoom: 7 });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [routes, mapMode]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Radar Map Container */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 shadow-md bg-slate-900">
        <div ref={mapContainerRef} style={{ height: '420px' }} className="w-full z-0" />

        {/* Top Controls Overlay */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between gap-2 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 shadow-lg text-xs">
            <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
            <span className="font-bold text-white tracking-wide">
              Live Satellite Geolocation Radar
            </span>
            <span className="text-slate-400">·</span>
            <span className="font-mono text-cyan-300 font-bold">
              {routes.length} Active Monitored Hops
            </span>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            <button
              onClick={() => setMapMode((m) => (m === 'satellite' ? 'dark' : 'satellite'))}
              className="px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 backdrop-blur-md border border-white/10 text-white text-xs font-bold shadow-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-slate-300" />
              <span>{mapMode === 'satellite' ? 'Dark Radar' : 'Satellite Imagery'}</span>
            </button>
            <button
              onClick={loadRoutes}
              className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 backdrop-blur-md border border-white/10 text-white shadow-lg transition-colors cursor-pointer"
              title="Refresh radar telemetry"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Bottom Selected Route Inspector Box */}
        {selectedTx && (
          <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none">
            <div className="pointer-events-auto bg-slate-950/90 backdrop-blur-md p-4 rounded-2xl border border-white/15 shadow-2xl text-xs text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in slide-in-from-bottom-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-cyan-300">
                    {selectedTx.transaction_id}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedTx.risk_level === 'HIGH'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {selectedTx.risk_level} RISK
                  </span>
                  <span className="font-black text-slate-100">
                    ₹{selectedTx.amount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-slate-300 text-[11px] flex items-center gap-2">
                  <span>{(selectedTx as any).origin?.city || 'Mumbai'}</span>
                  <span className="text-slate-500">→</span>
                  <span className="text-rose-400 font-bold">
                    {(selectedTx as any).destination?.entity || (selectedTx as any).destination?.city || 'Offshore Hub'}
                  </span>
                  <span className="text-slate-500">|</span>
                  <span className="font-mono text-cyan-400 font-bold">
                    {(selectedTx as any).distance_km} km
                  </span>
                </div>
              </div>

              <button
                onClick={() => onSelectTransaction(selectedTx)}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <span>Inspect Transaction</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Select Route Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {routes.map((tx) => {
          const isSelected = selectedTx?.transaction_id === tx.transaction_id;
          const isHigh = tx.risk_level === 'HIGH';
          return (
            <button
              key={tx.transaction_id}
              onClick={() => setSelectedTx(tx)}
              className={`px-3 py-2 rounded-2xl border text-xs whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm scale-102 font-bold'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isHigh ? 'bg-rose-500' : 'bg-amber-500'
                }`}
              />
              <span className="font-mono">{tx.transaction_id}</span>
              <span className="text-slate-400 text-[10px]">
                {(tx as any).distance_km ? `${(tx as any).distance_km}km` : 'Local'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
