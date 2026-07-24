'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleService } from '@/services/vehicle.service';
import { geofenceService } from '@/services/geofence.service';
import { telemetryService } from '@/services/telemetry.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Loader2, Battery, Signal, Gauge, MapPin, ShieldAlert,
  Cpu, Activity, AlertTriangle, ChevronLeft,
  Users as UsersIcon, MoreHorizontal, Zap, Clock, Globe,
  ShieldCheck, CheckCircle2, Trash2
} from 'lucide-react';
import { SecurityOverrideDialog } from '@/components/shared/security-override-dialog';
import { AssignDriverModal } from '@/components/shared/assign-driver-modal';
import { CreateGeofenceDialog } from '@/components/shared/create-geofence-dialog';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { User, ApiResponse, Vehicle } from '@/types';
import dynamic from 'next/dynamic';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';

// Use TacticalMap for all instances
const TacticalMap = dynamic(() => import('@/components/maps/tactical-map'), { ssr: false });

export default function VehicleCommandCenter() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const queryClient = useQueryClient();
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // 1. Queries
  const { data: vResponse, isLoading: loadingV, isError } = useQuery<ApiResponse<Vehicle>>({
    queryKey: ['vehicle-details', id],
    queryFn: () => vehicleService.getVehicleById(id) as any,
  });

  const { data: tRes } = useQuery({
    queryKey: ["telemetry-latest", id],
    queryFn: () => telemetryService.getLatest(id),
    refetchInterval: 5000,
  });

  const { data: hRes } = useQuery({
    queryKey: ["telemetry-history", id],
    queryFn: () => telemetryService.getHistory(id),
    enabled: !!id,
  });

  const { data: gRes, refetch: refetchFences } = useQuery({
    queryKey: ['geofences', id],
    queryFn: () => geofenceService.getForVehicle(id),
  });

  // --- MUTATIONS ---
  const commandMutation = useMutation({
    mutationFn: (cmd: string) => vehicleService.sendCommand(id, cmd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-details', id] });
      toast.success("Command dispatched to hardware");
    },
  });

  const toggleFenceMutation = useMutation({
    mutationFn: ({ fId, active }: { fId: string, active: boolean }) =>
      geofenceService.toggle(fId, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geofences', id] });
      toast.success("Perimeter updated");
    }
  });

  const removeFenceMutation = useMutation({
    mutationFn: (fId: string) => geofenceService.remove(fId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geofences', id] });
      toast.success("Perimeter removed");
    }
  });

  // --- LOADING / ERROR GUARDS ---
  if (loadingV) return (
    <div className="h-screen flex flex-col items-center justify-center gap-6 ">
      <div className="relative">
        <Loader2 className="animate-spin text-emerald-500 w-12 h-12" />
        <div className="absolute inset-0 blur-xl bg-emerald-500/20 animate-pulse" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-500/50">Establishing Tactical Uplink</p>
    </div>
  );

  if (isError || !vResponse) return (
    <div className="h-screen flex flex-col items-center justify-center space-y-6 ">
      <div className="p-4 bg-red-500/10 rounded-full border border-red-500/20 glow-red">
        <AlertTriangle className="w-12 h-12 text-destructive" />
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Link Critical Failure</h2>
        <p className="text-muted-foreground text-xs mt-1 uppercase tracking-widest">Node Response Timeout</p>
      </div>
      <Button variant="outline" onClick={() => router.back()} className="border-slate-800 text-muted-foreground hover:bg-slate-900">
        Return to Fleet Registry
      </Button>
    </div>
  );

  // --- DATA EXTRACTION ---
  const vehicle = vResponse?.data || (vResponse as unknown as Vehicle);
  const telemetry = tRes?.data || (vehicle?.telemetries && vehicle.telemetries[0]) || {};
  const recentAlerts = vehicle?.recentAlerts || vehicle?.alerts || [];
  const drivers = vehicle?.drivers || [];
  const devices = vehicle?.devices || [];
  const fences = Array.isArray(gRes) ? gRes : (gRes?.data || []);

  const gpsEntry = telemetry?.gps?.[0];
  const currentLat = gpsEntry?.latitude ? Number(gpsEntry.latitude) : undefined;
  const currentLng = gpsEntry?.longitude ? Number(gpsEntry.longitude) : undefined;

  const rawHistory = (hRes?.data || []);
  const historyPath = rawHistory
    .filter((t: any) => t.gps?.[0])
    .map((t: any) => ({ lat: Number(t.gps[0].latitude), lng: Number(t.gps[0].longitude) }))
    .reverse();

  // Chart Data preparation
  const telemetryHistory = rawHistory.slice(0, 20).reverse().map((t: any) => ({
    time: new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    speed: t.speed || 0,
    battery: t.batteryLevel || 0,
    fuel: t.fuelLevel || 0
  }));

  const stats = {
    totalDevices: vehicle?.statistics?.totalDevices ?? devices.length,
    totalAlerts: vehicle?.statistics?.totalAlerts ?? recentAlerts.length,
    totalEvents: vehicle?.statistics?.totalTelemetry ?? (vehicle?.telemetries?.length || 0)
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] text-foreground dark:text-slate-100 transition-colors duration-500">

      {/* HEADER SECTION */}
      <header className="sticky top-0 z-50 glass dark:glass-dark border-b px-6 py-4 mb-6">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="rounded-full hover:bg-muted dark:hover:bg-slate-800 transition-all border dark:border-white/10"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Badge className="bg-primary hover:bg-primary/90 text-[10px] font-bold uppercase py-0.5 px-2.5 rounded-sm">
                  {vehicle.type}
                </Badge>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <div className={cn("w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]", vehicle.status === 'ACTIVE' && 'animate-pulse')} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">{vehicle.status}</span>
                </div>
              </div>
              <h1 className="text-2xl font-black text-foreground dark:text-white tracking-tighter uppercase flex items-center gap-3">
                {vehicle.name} <span className="text-emerald-500 font-mono text-sm opacity-50 tracking-normal">[{vehicle.plateNumber}]</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em]">Node Identifier</span>
              <span className="text-sm font-mono font-bold text-slate-600 dark:text-muted-foreground">{vehicle.id.substring(0, 16)}</span>
            </div>
            <SecurityOverrideDialog vehicleId={vehicle.id} plateNumber={vehicle.plateNumber.toString()} />
            <Button variant="outline" size="icon" className="rounded-xl dark:border-white/10">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 pb-20 space-y-8">

        {/* TOP METRICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <MetricCard
            label="Real-time Speed"
            value={telemetry.speed || 0}
            unit="KM/H"
            subText={telemetry.speed > (vehicle.speedLimit || 80) ? "Overspeed Detected" : "Satellite Sync Active"}
            icon={Gauge}
            chartData={telemetryHistory}
            dataKey="speed"
            color={telemetry.speed > (vehicle.speedLimit || 80) ? "#ef4444" : "#ec4899"}
            warning={telemetry.speed > (vehicle.speedLimit || 80)}
            limit={vehicle.speedLimit}
          />
          <MetricCard
            label="Power Reserve"
            value={telemetry.batteryLevel || 0}
            unit="%"
            subText="Stable Discharge"
            icon={Battery}
            chartData={telemetryHistory}
            dataKey="battery"
            color="#10b981"
          />
          <MetricCard
            label="Fuel Level"
            value={telemetry.fuelLevel || 0}
            unit="%"
            subText="Optimal Pressure"
            icon={Zap}
            chartData={telemetryHistory}
            dataKey="fuel"
            color="#f59e0b"
          />
          <KPISlot title="Module Stack" value={stats.totalDevices} icon={Cpu} sub="Active Hardware" />
          <KPISlot title="Protocol Logs" value={stats.totalAlerts} icon={Activity} sub="Events Recorded" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

          {/* LEFT: TELEMETRY & CONTROLS */}
          <div className="xl:col-span-8 space-y-8">
            <Tabs defaultValue="overview" className="w-full">
              <div className="flex items-center justify-between mb-6">
                <TabsList className="bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl h-11 border dark:border-white/5">
                  <TabsTrigger value="overview" className="rounded-lg px-6 font-bold text-xs uppercase data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 shadow-sm transition-all">Telemetry</TabsTrigger>
                  <TabsTrigger value="proximity" className="rounded-lg px-6 font-bold text-xs uppercase data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 shadow-sm transition-all">Zones</TabsTrigger>
                  <TabsTrigger value="diagnostics" className="rounded-lg px-6 font-bold text-xs uppercase data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 shadow-sm transition-all">Hardware</TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1" />
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Live Uplink Stream</span>
                </div>
              </div>

              <TabsContent value="overview" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* MAIN MAP */}
                  <Card className="lg:col-span-2 border-none shadow-2xl rounded-3xl overflow-hidden bg-slate-950 min-h-[500px] relative group">
                    {(currentLat && currentLng) ? (
                      <TacticalMap
                        vehicles={[vehicle]}
                        telemetry={telemetry}
                        history={historyPath}
                        geofences={fences}
                        config={{ showHistory: true, showFences: true }}
                        center={{ lat: currentLat, lng: currentLng }}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center flex-col gap-4 opacity-40">
                        <Globe className="w-12 h-12 text-emerald-500 animate-pulse" />
                        <p className="text-xs font-black uppercase tracking-[0.2em]">Acquiring Satellite Lock</p>
                      </div>
                    )}
                    {/* Floating Map Overlays */}
                    <div className="absolute bottom-6 left-6 flex flex-col gap-2">
                      <div className="glass-dark p-3 rounded-2xl flex items-center gap-3 animate-float">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
                          <MapPin className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-muted-foreground">Current Vector</p>
                          <p className="text-xs font-mono font-bold text-white">{currentLat?.toFixed(6)}, {currentLng?.toFixed(6)}</p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* SIDE CONTROLS & STATUS */}
                  <div className="space-y-6">
                    <Card className="glass dark:glass-dark border-none rounded-3xl p-6">
                      <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" /> Executive Controls
                      </h3>
                      <div className="space-y-4">
                        <ControlToggle
                          label="Engine Immobilizer"
                          description="Remote disconnect power"
                          active={vehicle.config?.isEngineLocked}
                          onToggle={(checked: boolean) => commandMutation.mutate(checked ? 'LOCK_ENGINE' : 'UNLOCK_ENGINE')}
                          loading={commandMutation.isPending}
                          danger
                        />
                        <ControlToggle
                          label="Maintenance Mode"
                          description="Disable alerts during service"
                          active={maintenanceMode}
                          onToggle={(checked: boolean) => setMaintenanceMode(checked)}
                        />
                      </div>
                    </Card>

                    <Card className="bg-[#0F172A] border-none rounded-3xl p-6 text-white overflow-hidden relative group">
                      <div className="absolute -top-4 -right-4 p-8 opacity-5 rotate-12 transition-transform group-hover:scale-110 duration-700">
                        <Activity className="w-32 h-32" />
                      </div>
                      <div className="relative z-10">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Uplink Health</h3>
                        <div className="flex items-end justify-between mb-4">
                          <span className="text-3xl font-black italic uppercase italic tracking-tighter">
                            {(() => {
                              const diff = telemetry?.createdAt ? (Date.now() - new Date(telemetry.createdAt).getTime()) / 1000 : 999;
                              if (diff < 15) return 'Excellent';
                              if (diff < 60) return 'Stable';
                              if (diff < 300) return 'Degraded';
                              return 'Critical';
                            })()}
                          </span>
                          <Signal className={cn(
                            "w-6 h-6",
                            (() => {
                              const diff = telemetry?.createdAt ? (Date.now() - new Date(telemetry.createdAt).getTime()) / 1000 : 999;
                              if (diff < 15) return 'text-emerald-500 glow-emerald';
                              if (diff < 60) return 'text-blue-500 glow-blue';
                              return 'text-destructive glow-red animate-pulse';
                            })()
                          )} />
                        </div>
                        <div className="space-y-4">
                          <TechProgress label="Uplink Latency" value={Math.min(100, Math.round((telemetry?.createdAt ? (Date.now() - new Date(telemetry.createdAt).getTime()) / 1000 : 999) / 10))} color="blue" />
                          <TechProgress label="Buffer Load" value={Math.floor(Math.random() * 20) + 5} color="emerald" />
                        </div>
                      </div>
                    </Card>
                    <Card className="glass dark:glass-dark border-none rounded-3xl p-6 relative overflow-hidden group">
                      <div className="relative z-10">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Mechanical Vitals
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border dark:border-white/5">
                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-2">Engine</p>
                            <div className="flex items-center gap-2">
                              <div className={cn("w-2 h-2 rounded-full", telemetry.engineStatus ? "bg-emerald-500 glow-emerald" : "bg-red-500 glow-red")} />
                              <span className="text-xs font-black uppercase">{telemetry.engineStatus ? 'Ignited' : 'Standby'}</span>
                            </div>
                          </div>
                          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border dark:border-white/5">
                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-2">Security</p>
                            <div className="flex items-center gap-2">
                              <div className={cn("w-2 h-2 rounded-full", telemetry.doorStatus ? "bg-red-500 glow-red" : "bg-emerald-500 glow-emerald")} />
                              <span className="text-xs font-black uppercase">{telemetry.doorStatus ? 'Door Open' : 'Secured'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>

                {/* HISTORICAL TELEMETRY CHART */}
                <Card className="glass dark:glass-dark border-none rounded-3xl p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-lg font-black text-foreground dark:text-white uppercase tracking-tighter">Velocity Profile</h3>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Last 20 Signal Transmissions</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-pink-500" />
                        <span className="text-[10px] uppercase font-black text-muted-foreground">Speed (KM/H)</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={telemetryHistory}>
                        <defs>
                          <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                        <XAxis
                          dataKey="time"
                          stroke="#94a3b8"
                          fontSize={9}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => val.split(':')[1] % 5 === 0 ? val : ''}
                        />
                        <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase'
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="speed"
                          stroke="#ec4899"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorSpeed)"
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="proximity" className="animate-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <Card className="lg:col-span-4 glass dark:glass-dark border-none rounded-3xl flex flex-col h-[600px] overflow-hidden">
                    <div className="p-6 border-b dark:border-white/5 flex items-center justify-between">
                      <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Security Zones</h3>
                      <CreateGeofenceDialog vehicleId={id} currentLat={currentLat} currentLng={currentLng} />
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                      <div className="divide-y dark:divide-white/5">
                        {fences.length > 0 ? fences.map((fence: any) => (
                          <div key={fence.id} className="p-6 hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-10 h-10 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 border",
                                fence.isActive ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-slate-100 dark:bg-white/5 border-transparent text-muted-foreground"
                              )}>
                                <Globe className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-sm font-bold uppercase truncate max-w-[120px]">{fence.name}</p>
                                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">RADIUS: {fence.radius}M</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={fence.isActive}
                                onCheckedChange={(v: boolean) => toggleFenceMutation.mutate({ fId: fence.id, active: v })}
                                className="data-[state=checked]:bg-emerald-500 scale-90"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-300 hover:text-destructive hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                                onClick={() => removeFenceMutation.mutate(fence.id)}
                                disabled={removeFenceMutation.isPending}
                              >
                                {removeFenceMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </Button>
                            </div>
                          </div>
                        )) : (
                          <div className="p-10 text-center flex flex-col items-center justify-center h-full opacity-30">
                            <MapPin className="w-10 h-10 mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest">No Active Perimeters</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                  <Card className="lg:col-span-8 border-none shadow-2xl rounded-3xl overflow-hidden bg-slate-900 h-[600px]">
                    <TacticalMap
                      vehicles={[vehicle]}
                      telemetry={telemetry}
                      geofences={fences}
                      config={{ showHistory: false, showFences: true }}
                      center={{ lat: currentLat || 9.023, lng: currentLng || 38.746 }}
                    />
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="diagnostics" className="animate-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {devices.map((dev: any) => (
                    <Card key={dev.id} className="glass dark:glass-dark border-none rounded-3xl p-6 hover:scale-[1.02] transition-all duration-500">
                      <div className="flex items-start justify-between mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/10">
                          {dev.type === 'GPS' ? <MapPin className="w-6 h-6 text-emerald-500" /> :
                            dev.type === 'PASSKEY' ? <ShieldCheck className="w-6 h-6 text-blue-500" /> :
                              dev.type === 'ALCHOL_SENSOR' ? <Zap className="w-6 h-6 text-orange-500" /> :
                                <Cpu className="w-6 h-6 text-muted-foreground" />}
                        </div>
                        <Badge className={cn("text-[9px] font-black px-2 py-0.5 border-none", dev.status === 'ONLINE' || dev.status === 'ACTIVE' ? 'bg-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-400 text-white')}>
                          {dev.status}
                        </Badge>
                      </div>
                      <h4 className="text-sm font-black uppercase mb-1 tracking-tight">{dev.name}</h4>
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="outline" className="text-[8px] font-black px-1.5 h-4 border-slate-200 text-muted-foreground">
                          {dev.type || 'SENS_UNIT'}
                        </Badge>
                        <p className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">SN: {dev.serialNumber}</p>
                      </div>
                      <div className="pt-4 border-t dark:border-white/5 flex items-center justify-between text-[10px] font-bold text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {dev.lastSeen ? formatDistanceToNow(new Date(dev.lastSeen), { addSuffix: true }) : 'Never seen'}
                        </span>
                        <div className={cn("w-2 h-2 rounded-full", dev.status === 'ACTIVE' || dev.status === 'ONLINE' ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* RIGHT: REGISTRY & LOGS */}
          <div className="xl:col-span-4 space-y-8">

            {/* ALERT FEED */}
            <Card className="glass dark:glass-dark border-none rounded-3xl flex flex-col max-h-[500px] overflow-hidden">
              <div className="p-6 border-b dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500 rounded-lg glow-red"><ShieldAlert className="w-4 h-4 text-white" /></div>
                  <h3 className="text-sm font-black uppercase tracking-tighter">Duty Log</h3>
                </div>
                <Badge variant="outline" className="text-[9px] font-black border-slate-200 text-muted-foreground">{recentAlerts.length} Events</Badge>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="divide-y dark:divide-white/5">
                  {recentAlerts.length > 0 ? recentAlerts.map((alert: any) => (
                    <div key={alert.id} className="p-5 hover:bg-red-50/30 dark:hover:bg-red-500/5 transition-all flex items-start gap-4 group">
                      <div className="w-2 h-2 rounded-full border border-red-500 bg-red-500 mt-2 shrink-0 animate-pulse" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[11px] font-black uppercase text-red-600 dark:text-red-400 tracking-tight">{alert.alertType}</p>
                          <span className="text-[9px] font-bold text-muted-foreground">{formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground dark:text-muted-foreground leading-relaxed truncate">{alert.message || 'Anomaly detected in propulsion system'}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="p-20 text-center flex flex-col items-center justify-center opacity-20">
                      <Activity className="w-10 h-10 mb-2" />
                      <p className="text-[10px] font-black uppercase">No Protocol Breaches</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* CREW REGISTRY */}
            <Card className="glass dark:glass-dark border-none rounded-3xl flex flex-col max-h-[500px] overflow-hidden">
              <div className="p-6 border-b dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500 rounded-lg glow-emerald"><UsersIcon className="w-4 h-4 text-white" /></div>
                  <h3 className="text-sm font-black uppercase tracking-tighter">Crew Registry</h3>
                </div>
                <AssignDriverModal vehicleId={vehicle.id} plateNumber={vehicle.plateNumber.toString()} />
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="divide-y dark:divide-white/5">
                  {drivers.length > 0 ? drivers.map((driver: User) => (
                    <div key={driver.id} className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center text-sm font-black text-emerald-500 border border-white/10 uppercase shadow-lg group-hover:scale-110 transition-transform">
                          {driver.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-black uppercase tracking-tight">{driver.name}</p>
                          <div className="flex flex-col gap-0.5 mt-1">
                            <p className="text-[10px] font-bold text-emerald-500 flex items-center uppercase">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" /> Verified Operator
                            </p>
                            {driver.phone && (
                              <p className="text-[9px] font-mono text-muted-foreground flex items-center gap-1">
                                <span className="opacity-50">TEL:</span> {driver.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-emerald-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  )) : (
                    <div className="p-20 text-center flex flex-col items-center justify-center opacity-20 grayscale">
                      <UsersIcon className="w-10 h-10 mb-2" />
                      <p className="text-[10px] font-black uppercase">Uncrewed Unit</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* OWNERSHIP CARD */}
            <Card className="bg-slate-900 rounded-3xl p-6 text-white border-none overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12 transition-transform group-hover:scale-110">
                <Zap className="w-24 h-24" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6 font-black uppercase tracking-[0.2em]">Administrative Ownership</h3>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-xl font-black text-emerald-500 border border-white/10 shadow-inner uppercase">
                  {vehicle.owner?.name?.[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-black text-sm truncate uppercase tracking-tight">{vehicle.owner?.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate lowercase font-mono mt-1">{vehicle.owner?.email}</p>
                </div>
              </div>
              <div className="space-y-4">
                <TechProgress label="Network Access Level" value={100} color="emerald" hidePercent />
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-10 text-[10px] font-black uppercase bg-white/5 border-white/10 hover:bg-white/20 text-white rounded-xl">Inquire</Button>
                  <Button variant="outline" className="h-10 text-[10px] font-black uppercase bg-white/5 border-white/10 hover:bg-white/20 text-white rounded-xl">History</Button>
                </div>
              </div>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
}

// --- SUB COMPONENTS ---

function MetricCard({ label, value, unit, subText, icon: Icon, chartData, dataKey, color, warning, limit }: any) {
  return (
    <Card className={cn(
      "glass dark:glass-dark border-none rounded-3xl p-6 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500",
      warning && "border-2 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
    )}>
      <div className={cn(
        "absolute top-6 right-6 p-3 rounded-2xl border dark:border-white/10 transition-colors",
        warning ? "bg-red-500/10 text-destructive border-red-500/20" : "bg-slate-100 dark:bg-white/5 text-muted-foreground group-hover:text-primary"
      )}>
        <Icon size={20} className={cn(warning && "animate-pulse")} />
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-1">{label}</p>
        <div className="flex items-baseline gap-2 mb-2">
          <span className={cn(
            "text-4xl font-black tracking-tighter italic uppercase transition-colors",
            warning ? "text-destructive" : "text-foreground dark:text-white"
          )}>
            {value}
          </span>
          <span className="text-xs font-bold text-muted-foreground uppercase">{unit}</span>
        </div>
        <div className={cn(
          "text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5",
          warning ? "text-destructive animate-pulse" : "text-emerald-500"
        )}>
          <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", warning ? "bg-red-500" : "bg-emerald-500")} />
          {subText}
          {limit && <span className="text-muted-foreground ml-1">/ {limit} LIMIT</span>}
        </div>
      </div>
      {/* Mini Trend Chart */}
      <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30 group-hover:opacity-60 transition-opacity">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <Area type="monotone" dataKey={dataKey} stroke={color} fill={color} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function KPISlot({ title, value, icon: Icon, sub }: any) {
  return (
    <Card className="glass dark:glass-dark border-none rounded-3xl p-6 flex items-center gap-5 group hover:scale-[1.02] transition-all duration-500">
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border dark:border-white/10 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
        <Icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-0.5">{title}</p>
        <h4 className="text-2xl font-black tracking-tight text-foreground dark:text-white mb-0.5">{value} Units</h4>
        <p className="text-[9px] font-bold text-muted-foreground uppercase">{sub}</p>
      </div>
    </Card>
  );
}

function ControlToggle({ label, description, active, onToggle, loading, danger }: any) {
  return (
    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border dark:border-white/10 flex items-center justify-between group hover:border-slate-300 dark:hover:border-white/20 transition-all">
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-3 h-3 rounded-full border border-white shadow-lg transition-all",
          active ? (danger ? "bg-red-500 glow-red" : "bg-emerald-500 glow-emerald") : "bg-slate-300"
        )} />
        <div>
          <p className="text-xs font-black uppercase tracking-tight text-slate-700 dark:text-slate-200">{label}</p>
          <p className="text-[10px] text-muted-foreground font-bold uppercase mt-0.5 tracking-tight">{description}</p>
        </div>
      </div>
      <Switch
        checked={!!active}
        onCheckedChange={onToggle}
        disabled={loading}
        className={cn("scale-90", danger ? "data-[state=checked]:bg-red-500" : "data-[state=checked]:bg-emerald-500")}
      />
    </div>
  );
}

function TechProgress({ label, value, color, hidePercent }: any) {
  const colors = {
    emerald: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]",
    blue: "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]",
    pink: "bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.4)]",
  };
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-[9px] font-black uppercase text-muted-foreground tracking-widest">
        <span>{label}</span>
        {!hidePercent && <span className="tabular-nums">{value}%</span>}
      </div>
      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all duration-1000 ease-in-out", colors[color as keyof typeof colors])}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}