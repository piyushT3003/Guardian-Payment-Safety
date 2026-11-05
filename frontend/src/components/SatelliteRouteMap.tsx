import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, Maximize2, RotateCcw, ShieldAlert, ShieldCheck, MapPin, Radio } from 'lucide-react';
import { GeoPoint } from '../types';

interface SatelliteRouteMapProps {
  origin: GeoPoint;
  destination: GeoPoint;
  distanceKm: number;
  geofenceStatus: 'NORMAL' | 'SUSPICIOUS' | 'CRITICAL';
  geofenceDetails: string;
  latencyMs?: number;
  height?: string;
  className?: string;
}

export const SatelliteRouteMap: React.FC<SatelliteRouteMapProps> = ({
  origin,
  destination,
  distanceKm,
  geofenceStatus,
  geofenceDetails,
  latencyMs = 45,
  height = '340px',
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{ satellite: L.TileLayer; dark: L.TileLayer; labels: L.TileLayer } | null>(null);

  const [mapMode, setMapMode] = useState<'satellite' | 'dark'>('satellite');

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up any existing map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Default center point between origin and destination
    const midLat = (origin.lat + destination.lat) / 2;
    const midLon = (origin.lon + destination.lon) / 2;

    const map = L.map(mapContainerRef.current, {
      center: [midLat, midLon],
      zoom: distanceKm > 1000 ? 4 : distanceKm > 200 ? 6 : 11,
      zoomControl: false,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    // Esri High-Resolution Satellite Tiles
    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 18,
        subdomains: ['server'],
      }
    );

    // Esri Labels & Boundaries Overlay
    const labelsLayer = L.tileLayer(
      'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 18,
      }
    );

    // CartoDB Dark Matter for Radar Mode
    const darkLayer = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        maxZoom: 19,
        subdomains: 'abcd',
      }
    );

    layersRef.current = {
      satellite: satelliteLayer,
      dark: darkLayer,
      labels: labelsLayer,
    };

    if (mapMode === 'satellite') {
      satelliteLayer.addTo(map);
      labelsLayer.addTo(map);
    } else {
      darkLayer.addTo(map);
    }

    // Custom Origin Marker (Pulsing Cyan Dot)
    const originIcon = L.divIcon({
      className: 'custom-origin-pin',
      html: `
        <div class="relative flex items-center justify-center w-8 h-8 -translate-x-4 -translate-y-4">
          <div class="absolute w-8 h-8 rounded-full bg-cyan-400/40 animate-radar-ping"></div>
          <div class="w-4 h-4 rounded-full bg-cyan-500 border-2 border-white shadow-lg flex items-center justify-center">
            <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const originMarker = L.marker([origin.lat, origin.lon], { icon: originIcon }).addTo(map);
    originMarker.bindPopup(`
      <div class="space-y-1 text-xs">
        <div class="font-bold text-cyan-400 flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-cyan-400"></span>
          Payment Origin (Sender)
        </div>
        <div class="font-bold text-slate-100">${origin.city}, ${origin.country}</div>
        <div class="text-[11px] text-slate-300">Device: ${origin.device || 'Mobile Device'}</div>
        <div class="text-[11px] text-slate-400 font-mono">IP: ${origin.ip || '103.21.244.78'}</div>
      </div>
    `, { className: 'guardian-leaflet-popup' });

    // Custom Destination Marker (Pulsing Red / Amber / Green Dot)
    const destColor = geofenceStatus === 'CRITICAL' ? 'rose' : geofenceStatus === 'SUSPICIOUS' ? 'amber' : 'emerald';
    const destHex = geofenceStatus === 'CRITICAL' ? '#f43f5e' : geofenceStatus === 'SUSPICIOUS' ? '#f59e0b' : '#10b981';

    const destIcon = L.divIcon({
      className: 'custom-dest-pin',
      html: `
        <div class="relative flex items-center justify-center w-8 h-8 -translate-x-4 -translate-y-4">
          <div class="absolute w-8 h-8 rounded-full ${geofenceStatus === 'CRITICAL' ? 'bg-rose-500/40' : geofenceStatus === 'SUSPICIOUS' ? 'bg-amber-500/40' : 'bg-emerald-500/40'} animate-radar-ping"></div>
          <div class="w-4 h-4 rounded-full ${geofenceStatus === 'CRITICAL' ? 'bg-rose-600' : geofenceStatus === 'SUSPICIOUS' ? 'bg-amber-600' : 'bg-emerald-600'} border-2 border-white shadow-lg flex items-center justify-center">
            <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const destMarker = L.marker([destination.lat, destination.lon], { icon: destIcon }).addTo(map);
    destMarker.bindPopup(`
      <div class="space-y-1 text-xs">
        <div class="font-bold ${geofenceStatus === 'CRITICAL' ? 'text-rose-400' : 'text-emerald-400'} flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full ${geofenceStatus === 'CRITICAL' ? 'bg-rose-400' : 'bg-emerald-400'}"></span>
          Beneficiary Endpoint
        </div>
        <div class="font-bold text-slate-100">${destination.entity || destination.city}</div>
        <div class="text-[11px] text-slate-300">Location: ${destination.city}, ${destination.country}</div>
        <div class="text-[11px] font-bold ${geofenceStatus === 'CRITICAL' ? 'text-rose-400' : 'text-emerald-400'}">
          ${geofenceStatus} ROUTE (${distanceKm.toLocaleString()} km)
        </div>
      </div>
    `, { className: 'guardian-leaflet-popup' });

    // Curved Geodesic / Arc Line
    // Compute intermediate arc points for realistic orbital curvature
    const arcPoints: [number, number][] = [];
    const steps = 30;
    const curveHeight = Math.min(distanceKm / 500, 3.5);

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lat = origin.lat + (destination.lat - origin.lat) * t;
      const lon = origin.lon + (destination.lon - origin.lon) * t;
      // Parabolic arc offset for visual curvature
      const arcOffset = Math.sin(t * Math.PI) * curveHeight;
      arcPoints.push([lat + arcOffset, lon]);
    }

    const routeLine = L.polyline(arcPoints, {
      color: destHex,
      weight: 3.5,
      opacity: 0.9,
      className: 'leaflet-geodesic-animated',
    }).addTo(map);

    // Fit map bounds to encompass both endpoints with comfortable padding
    const bounds = L.latLngBounds([
      [origin.lat, origin.lon],
      [destination.lat, destination.lon],
    ]);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [origin, destination, distanceKm, geofenceStatus, mapMode]);

  const toggleLayer = () => {
    setMapMode((prev) => (prev === 'satellite' ? 'dark' : 'satellite'));
  };

  const recenter = () => {
    if (mapInstanceRef.current) {
      const bounds = L.latLngBounds([
        [origin.lat, origin.lon],
        [destination.lat, destination.lon],
      ]);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  };

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-md ${className}`}>
      {/* Map Canvas */}
      <div ref={mapContainerRef} style={{ height }} className="w-full z-0 bg-slate-900" />

      {/* Top Floating Telemetry Overlay Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Status Pill */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-lg text-xs">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="font-bold text-white tracking-wide">
            {origin.city}
          </span>
          <span className="text-slate-400">→</span>
          <span className="font-bold text-white tracking-wide">
            {destination.city}
          </span>
          <span className="text-slate-400">|</span>
          <span className="font-mono text-cyan-300 font-bold">
            {distanceKm.toLocaleString()} km
          </span>
        </div>

        {/* Threat Level Badge */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          <div
            className={`px-3 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider backdrop-blur-md border shadow-lg flex items-center gap-1.5 ${
              geofenceStatus === 'CRITICAL'
                ? 'bg-rose-950/90 text-rose-300 border-rose-500/40'
                : geofenceStatus === 'SUSPICIOUS'
                ? 'bg-amber-950/90 text-amber-300 border-amber-500/40'
                : 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
            }`}
          >
            {geofenceStatus === 'CRITICAL' ? (
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>{geofenceStatus} GEOFENCE</span>
          </div>

          {/* Map Controls */}
          <button
            onClick={toggleLayer}
            title={`Switch to ${mapMode === 'satellite' ? 'Dark Radar' : 'Satellite'} Basemap`}
            className="p-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 backdrop-blur-md border border-white/10 text-white shadow-lg transition-colors cursor-pointer"
          >
            <Layers className="w-4 h-4 text-slate-200" />
          </button>
          <button
            onClick={recenter}
            title="Recenter and Fit Route Bounds"
            className="p-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 backdrop-blur-md border border-white/10 text-white shadow-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-slate-200" />
          </button>
        </div>
      </div>

      {/* Bottom Route Summary Card */}
      <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none">
        <div className="pointer-events-auto bg-slate-950/85 backdrop-blur-md p-2.5 rounded-xl border border-white/10 shadow-lg text-[11px] text-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-2 truncate pr-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span className="text-slate-400 font-medium">Trajectory Anomaly:</span>
            <span className="text-white font-semibold truncate">{geofenceDetails}</span>
          </div>
          <div className="font-mono text-slate-400 shrink-0 font-medium">
            Latency ~{latencyMs}ms
          </div>
        </div>
      </div>
    </div>
  );
};
