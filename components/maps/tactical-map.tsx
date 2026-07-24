'use client';

import React, { useEffect, useMemo } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
  InfoWindow,
} from '@vis.gl/react-google-maps';
import { Car, Gauge, Battery, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// --- GEOFENCE LAYER ---
const GeofenceCircle = ({ center, radius, isActive }: any) => {
  const map = useMap();
  const circle = useMemo(() => new google.maps.Circle(), []);
  useEffect(() => {
    if (!map) return;
    circle.setOptions({
      map, center, radius: Number(radius),
      fillColor: isActive ? 'oklch(0.7 0.18 150)' : 'oklch(0.4 0.05 247.858)', fillOpacity: 0.15,
      strokeColor: isActive ? 'oklch(0.7 0.18 150)' : 'oklch(0.4 0.05 247.858)', strokeOpacity: 0.5, strokeWeight: 2,
      visible: true
    });
  }, [map, center, radius, isActive, circle]);
  useEffect(() => { return () => circle.setMap(null); }, [circle]);
  return null;
};

// --- BREADCRUMB LAYER ---
const BreadcrumbTrail = ({ path }: { path: { lat: number; lng: number }[] }) => {
  const map = useMap();
  const polyline = useMemo(() => new google.maps.Polyline(), []);
  useEffect(() => {
    if (!map || path.length < 2) return;
    polyline.setOptions({ map, path, strokeColor: 'oklch(0.7 0.18 150)', strokeOpacity: 0.5, strokeWeight: 3 });
  }, [map, path, polyline]);
  useEffect(() => { return () => polyline.setMap(null); }, [polyline]);
  return null;
};

// --- UPDATED INTERFACE ---
interface TacticalMapProps {
  vehicles: any[]; // Changed from 'vehicle' to 'vehicles'
  telemetry?: any; // Active telemetry for the focused/selected vehicle
  history?: { lat: number; lng: number }[];
  geofences?: any[];
  config?: { showHistory: boolean; showFences: boolean };
  center: { lat: number; lng: number };
  zoom?: number;
  onVehicleClick?: (id: string) => void;
}

export default function TacticalMap({
  vehicles,
  telemetry,
  history = [],
  geofences = [],
  config,
  center,
  zoom = 15,
  onVehicleClick
}: TacticalMapProps) {
  const [selectedVehicle, setSelectedVehicle] = React.useState<any>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyB0Nolu2WSLm0C-NfCQzcO7oaZU1oLENEI";

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={center}
        defaultZoom={zoom}
        mapId="bf51a910020fa566"
        disableDefaultUI={true}
        zoomControl={true}
      >
        <MapAutoCenter center={center} />

        {/* LAYER: GEOFENCES */}
        {config?.showFences && geofences.map(f => (
          <GeofenceCircle key={f.id} center={{ lat: Number(f.latitude), lng: Number(f.longitude) }} radius={f.radius} isActive={f.isActive} />
        ))}

        {/* LAYER: BREADCRUMBS (Only for focused vehicle) */}
        {config?.showHistory && history.length > 0 && <BreadcrumbTrail path={history} />}

        {/* LAYER: MULTIPLE VEHICLE MARKERS */}
        {vehicles.map((v) => {
          const tel = v.latestTelemetry || (v.telemetries && v.telemetries[0]);
          if (!tel?.gps?.[0]) return null;

          const pos = {
            lat: Number(tel.gps[0].latitude),
            lng: Number(tel.gps[0].longitude)
          };

          // Online check
          const isOnline = v.devices?.[0]?.lastSeen &&
            new Date(v.devices[0].lastSeen).getTime() > Date.now() - (24 * 60 * 60 * 1000);

          return (
            <React.Fragment key={v.id}>
              <AdvancedMarker
                position={pos}
                onClick={() => {
                  setSelectedVehicle(v);
                  onVehicleClick?.(v.id);
                }}
              >
                <div
                  style={{ transform: `rotate(${tel.direction || 0}deg)` }}
                  className="transition-all duration-1000 ease-in-out relative cursor-pointer"
                >
                  <div className={cn(
                    "p-2 bg-card rounded-full shadow-2xl border-2 flex items-center justify-center transition-transform hover:scale-125",
                    isOnline ? "border-secondary" : "border-muted grayscale"
                  )}>
                    <Car size={20} className="text-card-foreground fill-current" />
                  </div>
                  {isOnline && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-secondary rounded-full border-2 border-background animate-pulse shadow-[0_0_10px_var(--secondary)]" />}
                </div>
              </AdvancedMarker>

              {selectedVehicle?.id === v.id && (
                <InfoWindow
                  position={pos}
                  onCloseClick={() => setSelectedVehicle(null)}
                >
                  <div className="p-3 min-w-[190px] bg-card text-card-foreground font-sans rounded-2xl border border-border/50 shadow-2xl">
                    <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
                      <span className="text-xs font-black uppercase tracking-tighter">{v.plateNumber}</span>
                      <Badge className={cn("text-[9px] px-2 py-0.5 border-none font-bold", isOnline ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground")}>
                        {isOnline ? "ONLINE" : "OFFLINE"}
                      </Badge>
                    </div>
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-muted/50"><Gauge size={12} className="text-muted-foreground" /></div>
                        <span className="text-[10px] font-black tabular-nums">{tel.speed || 0} <span className="text-[8px] opacity-50">KM/H</span></span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-muted/50"><Battery size={12} className="text-muted-foreground" /></div>
                        <span className="text-[10px] font-black tabular-nums">{tel.batteryLevel || 0}<span className="text-[8px] opacity-50">%</span></span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-muted/50"><Activity size={12} className="text-muted-foreground" /></div>
                        <span className="text-[10px] font-bold opacity-80 truncate">{v.name}</span>
                      </div>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </React.Fragment>
          );
        })}
      </Map>
    </APIProvider>
  );
}

function MapAutoCenter({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => { if (map && center.lat && center.lng) map.panTo(center); }, [center, map]);
  return null;
}