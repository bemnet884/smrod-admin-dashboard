'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import { Navigation, Battery, Gauge, AlertTriangle, History } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- SUB-COMPONENT: CIRCULAR GEOFENCE ---
const GeofenceCircle = ({ center, radius, isActive }: any) => {
  const map = useMap();
  const circle = useMemo(() => new google.maps.Circle(), []);

  useEffect(() => {
    if (!map) return;
    circle.setOptions({
      map,
      center,
      radius,
      fillColor: isActive ? '#10b981' : '#94a3b8',
      fillOpacity: 0.15,
      strokeColor: isActive ? '#10b981' : '#64748b',
      strokeOpacity: 0.8,
      strokeWeight: 2,
    });
  }, [map, center, radius, isActive, circle]);

  useEffect(() => { return () => circle.setMap(null); }, [circle]);
  return null;
};

// --- SUB-COMPONENT: TRACK HISTORY (POLYLINE) ---
const TrackHistory = ({ path }: { path: { lat: number; lng: number }[] }) => {
  const map = useMap();
  const polyline = useMemo(() => new google.maps.Polyline(), []);

  useEffect(() => {
    if (!map || path.length < 2) return;
    polyline.setOptions({
      map,
      path,
      strokeColor: '#6366f1', // Indigo color for breadcrumbs
      strokeOpacity: 0.6,
      strokeWeight: 3,
      icons: [{
        icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW },
        offset: '100%',
        repeat: '50px'
      }]
    });
  }, [map, path, polyline]);

  useEffect(() => { return () => polyline.setMap(null); }, [polyline]);
  return null;
};

interface LiveMapProps {
  vehicles: any[];
  geofences?: any[];
  historyPath?: { lat: number; lng: number }[];
  center: { lat: number; lng: number };
  zoom?: number;
}

export default function LiveMap({ vehicles, geofences = [], historyPath = [], center, zoom = 12 }: LiveMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  return (
    <APIProvider apiKey={apiKey}>
      <div className="w-full h-full relative">
        <Map
          defaultCenter={center}
          defaultZoom={zoom}
          mapId="bf51a910020fa566"
          disableDefaultUI={true}
          zoomControl={true}
        >
          <MapAutoBounds vehicles={vehicles} />

          {/* LAYER 1: Geofences */}
          {geofences.map((fence) => (
            <GeofenceCircle
              key={fence.id}
              center={{ lat: Number(fence.latitude), lng: Number(fence.longitude) }}
              radius={Number(fence.radius)}
              isActive={fence.isActive}
            />
          ))}

          {/* LAYER 2: History Trail */}
          {historyPath.length > 0 && <TrackHistory path={historyPath} />}

          {/* LAYER 3: Active Vehicle Markers */}
          {vehicles.map((v) => (
            <VehicleMarker key={v.id} vehicle={v} />
          ))}
        </Map>
      </div>
    </APIProvider>
  );
}

// --- VEHICLE MARKER ---
function VehicleMarker({ vehicle }: { vehicle: any }) {
  const [open, setOpen] = useState(false);
  const tel = vehicle.latestTelemetry || (vehicle.telemetries && vehicle.telemetries[0]);
  if (!tel?.gps?.[0]) return null;

  const position = { lat: Number(tel.gps[0].latitude), lng: Number(tel.gps[0].longitude) };
  const lastSeen = vehicle.devices?.[0]?.lastSeen;
  const isOnline = lastSeen && new Date(lastSeen).getTime() > Date.now() - (24 * 60 * 60 * 1000);

  return (
    <>
      <AdvancedMarker position={position} onClick={() => setOpen(true)}>
        <div style={{ transform: `rotate(${tel.direction || 0}deg)` }} className="transition-all duration-500">
          <Navigation size={32} fill={isOnline ? '#10b981' : '#64748b'} className="text-white drop-shadow-xl" strokeWidth={2} />
        </div>
      </AdvancedMarker>
      {open && (
        <InfoWindow position={position} onCloseClick={() => setOpen(false)}>
          <div className="p-2 min-w-[140px] text-foreground">
            <p className="font-black text-xs uppercase border-b pb-1 mb-1">{vehicle.plateNumber}</p>
            <p className="text-[10px] font-bold text-primary uppercase">Speed: {tel.speed} km/h</p>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function MapAutoBounds({ vehicles }: { vehicles: any[] }) {
  const map = useMap();
  useEffect(() => {
    if (!map || vehicles.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    vehicles.forEach(v => {
      const pos = v.latestTelemetry?.gps?.[0] || v.telemetries?.[0]?.gps?.[0];
      if (pos) bounds.extend({ lat: Number(pos.latitude), lng: Number(pos.longitude) });
    });
    map.fitBounds(bounds, {
      top: 80,
      bottom: 80,
      left: 80,
      right: 80,
    });
  }, [vehicles, map]);
  return null;
}