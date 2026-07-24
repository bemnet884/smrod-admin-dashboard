'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Loader2, Search, Car, Navigation, Battery, Gauge, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { vehicleService } from '@/services/vehicle.service';
import { useAuthStore } from '@/store/useAuthStore'; // 1. Need this
import { ROLES } from '@/lib/rbac';                // 2. Need this
import { ApiResponse, Vehicle } from '@/types';

// Dynamic Map
const TacticalMap = dynamic(() => import('@/components/maps/tactical-map'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-50 flex items-center justify-center animate-pulse">Loading Map...</div>
});

export default function TrackingPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // 3. Fix: Define role here so TypeScript knows what it is
  const { user } = useAuthStore();
  const role = user?.role?.toLowerCase();

  const { data: response, isLoading } = useQuery<ApiResponse<Vehicle[]>>({
    queryKey: ['vehicles-live', role], // Added role to key
    queryFn: () => vehicleService.getVehicles(role), // Added role to function
    refetchInterval: 5000,
  });

  const vehicles = response?.data || [];

  const filteredVehicles = useMemo(() => {
    if (!searchTerm) return vehicles;
    const lower = searchTerm.toLowerCase();
    return vehicles.filter(v =>
      v.plateNumber?.toString().includes(lower) ||
      v.name?.toLowerCase().includes(lower)
    );
  }, [vehicles, searchTerm]);

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-600 h-8 w-8" /></div>;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-y-4 animate-in fade-in duration-500">

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Live Fleet Tracking</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1 flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />
            Real-time telemetry stream active
          </p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden rounded-2xl border border-border">

        {/* SIDEBAR */}
        <div className="w-[320px] border-r border-border bg-card flex flex-col">

          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
                className="pl-8 h-9 text-xs bg-background"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {filteredVehicles.map((v: any) => (
                <div
                  key={v.id}
                  className="p-3 rounded-lg hover:bg-muted cursor-pointer text-sm transition"
                >
                  <div className="font-bold">{v.plateNumber}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">
                    {v.name}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

        </div>

        {/* MAP */}
        <div className="flex-1 relative bg-background">

          <TacticalMap
            vehicles={filteredVehicles}
            center={{ lat: 9.023, lng: 38.746 }}
          />

        </div>

      </div>
    </div>
  );
}