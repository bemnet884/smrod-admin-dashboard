'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLES, canAccess } from '@/lib/rbac';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RegisterVehicleWizard } from '@/components/shared/register-vehicle-wizard';
import {
  Car, Users, ShieldAlert, Cpu, Activity, Signal,
  Map as MapIcon, ChevronRight, AlertTriangle,
  Wifi, WifiOff, Loader2, Plus, Zap, Clock,
  ArrowUpRight, Monitor, Search
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { vehicleService } from '@/services/vehicle.service';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';



import dynamic from 'next/dynamic';
import { DataFilterBar } from '@/components/shared/data-filter-bar';

// Dynamically import the map to avoid SSR (Server-Side Rendering) errors
const TacticalMap = dynamic(() => import('@/components/maps/tactical-map'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 animate-pulse" />
});

export default function DashboardOverview() {
  const { user } = useAuthStore();
  const role = user?.role?.toLowerCase();
  const isAdmin = role === ROLES.ADMIN;
  const [activitySearch, setActivitySearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: response, isLoading } = useQuery({
    queryKey: ['dashboard-intel', role],
    queryFn: () => isAdmin
      ? vehicleService.getAllVehiclesEnriched({ limit: 100 }) // Fetch up to 100
      : vehicleService.getVehicles(role, { limit: 100 }),    // Fetch up to 100
    refetchInterval: 10000,
  });

  const fleet = response?.data || [];

  const intelligence = useMemo(() => {
    // 1. Use the metadata provided by the backend, NOT the local array length
    const total = response?.meta?.totalItems ?? fleet.length;

    // 2. Use metadata totalDevices if provided (Total hardware in the whole fleet)
    // We assume backend meta can provide totalDevices, or we sum them if the endpoint returns full list
    const totalDevices = response?.meta?.totalDevices ??
      fleet.reduce((acc: number, v: any) => acc + (v.devices?.length || 0), 0);

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Online is based on the current fleet view (Page 1)
    const online = fleet.filter((v: any) =>
      v.devices?.some((d: any) => d.lastSeen && new Date(d.lastSeen) > fiveMinutesAgo)
    ).length;

    // Security & Health
    const threats = fleet.reduce((acc: number, v: any) => acc + (v.statistics?.totalAlerts || v.alerts?.length || 0), 0);
    const assignedDrivers = fleet.filter((v: any) => v.drivers?.length > 0 || v.driverId).length;

    // Health Score calculation
    const healthScore = total > 0 ? Math.min(100, Math.round(((online / (fleet.length || 1)) * 60) + ((assignedDrivers / (total || 1)) * 40))) : 100;

    // Activity Stream Construction
    const activities: any[] = [];
    fleet.forEach((v: any) => {
      activities.push({ id: `v-${v.id}`, type: 'REG', title: 'Asset Linked', sub: `Plate: ${v.plateNumber}`, time: new Date(v.createdAt), severity: 'info' });
      const alerts = v.recentAlerts || v.alerts || [];
      alerts.forEach((a: any) => {
        activities.push({ id: a.id, type: 'ALERT', title: a.alertType, sub: `Vehicle: ${v.plateNumber}`, time: new Date(a.createdAt), severity: 'critical' });
      });
    });

    return {
      total,
      online,
      offline: Math.max(0, total - online),
      totalDevices,
      noDevices: fleet.filter((v: any) => !v.devices?.length).length,
      threats,
      healthScore,
      activities: activities.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 15)
    };
  }, [fleet, response?.meta]);

  const filteredActivities = useMemo(() => {
    if (!activitySearch) return intelligence.activities;

    const lowerSearch = activitySearch.toLowerCase();

    return intelligence.activities.filter(act => {
      // Safely convert to string first, just in case the value is a Number (like plateNumber)
      const safeTitle = act.title ? String(act.title).toLowerCase() : "";
      const safeSub = act.sub ? String(act.sub).toLowerCase() : "";

      return safeTitle.includes(lowerSearch) || safeSub.includes(lowerSearch);
    });
  }, [intelligence.activities, activitySearch]);

  if (isLoading) return (
    <div className="h-full flex flex-col items-center justify-center gap-6 py-20">
      <div className="relative flex items-center justify-center">
        <div className="absolute w-16 h-16 border-4 border-secondary/20 rounded-full" />
        <Loader2 className="animate-spin text-secondary w-8 h-8" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Loading Command OS</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-10 max-w-400 mx-auto animate-in fade-in duration-700">

      {/* --- MINIMAL HEADER --- */}
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div className="space-y-1">
          <h1 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
            <Monitor className="w-5 h-5 text-secondary" />
            {isAdmin ? "SYSTEM OVERVIEW" : "FLEET COMMAND"}
          </h1>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
              {user?.name} / {role} / {new Date().toLocaleTimeString([], { hour12: false })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canAccess(role, [ROLES.ADMIN, ROLES.OWNER]) && (
            // ✅ We removed the static <Button> and dropped in our smart component
            <RegisterVehicleWizard />
          )}
          <Button variant="outline" className="h-8 w-8 p-0" onClick={() => window.location.reload()}>
            <Activity className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* --- KPI STRIP: ULTRA MINIMAL --- */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPIItem title="Fleet" value={intelligence.total} icon={Car} color="slate" />
        <KPIItem title="Live" value={intelligence.online} icon={Wifi} color="secondary" glow />
        <KPIItem title="Silent" value={intelligence.offline} icon={WifiOff} color="amber" />
        <KPIItem title="Alerts" value={intelligence.threats} icon={ShieldAlert} color="primary" danger={intelligence.threats > 0} />
        <KPIItem title="Units" value={intelligence.totalDevices - intelligence.noDevices} icon={Cpu} color="blue" />
        <KPIItem title="Healthy" value={`${intelligence.healthScore}%`} icon={Activity} color="secondary" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

        {/* --- LEFT: TECHNICAL METRICS --- */}
        <div className="xl:col-span-3 space-y-6">
          <Card className="border-none bg-[#0F172A] text-white shadow-2xl shadow-slate-200">
            <CardHeader className="pb-2">
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Platform Index</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 mb-8">
                <div className="relative">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-white/5" />
                    <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="3" fill="transparent"
                      strokeDasharray={226} strokeDashoffset={226 - (226 * intelligence.healthScore) / 100}
                      className="text-emerald-500 transition-all duration-1000" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center font-black text-lg">{intelligence.healthScore}%</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-400">OPTIMAL</p>
                  <p className="text-[9px] text-muted-foreground uppercase font-bold mt-1">Fleet Integrity</p>
                </div>
              </div>
              <div className="space-y-4">
                <TechMetric label="Connectivity" value={Math.round((intelligence.online / intelligence.total) * 100)} />
                <TechMetric label="SLA Uptime" value={99.9} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-none bg-white">
            <CardHeader className="py-3 px-4 border-b">
              <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Priority Risks</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {fleet.filter((v: any) => v.statistics?.totalAlerts > 0).length === 0 ? (
                <div className="p-6 text-center italic text-slate-300 text-[10px]">No high-risk detection.</div>
              ) : (
                fleet.filter((v: any) => v.statistics?.totalAlerts > 0).slice(0, 3).map((v: any) => (
                  <div key={v.id} className="p-4 border-b border-slate-50 flex items-center justify-between group cursor-default">
                    <div className="min-w-0">
                      <p className="text-xs font-black text-foreground tracking-tighter">{v.plateNumber}</p>
                      <p className="text-[9px] text-muted-foreground uppercase mt-0.5 truncate">{v.owner?.name}</p>
                    </div>
                    <span className="text-[9px] font-black text-red-600 bg-red-50 px-2 py-1 rounded tracking-tighter">{v.statistics.totalAlerts} ALERTS</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* --- CENTER: SYSTEM LOG STREAM --- */}
        {/* --- SECTION 3: LIVE ACTIVITY STREAM (CENTER) --- */}
        <Card className="xl:col-span-6 border-slate-100 shadow-none flex flex-col">
          <CardHeader className="py-3 px-6 border-b space-y-3 bg-white">
            <div className="flex flex-row items-center justify-between">
              <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                Operational Intelligence Stream
              </CardTitle>

              <div className="flex items-center gap-1.5 bg-secondary/10 text-secondary px-2 py-1 rounded text-[9px] font-bold">
                <div className="w-1 h-1 bg-secondary rounded-full animate-pulse" />
                SECURE_SYNC
              </div>
            </div>

            {/* SEARCH */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by event type, plate number, or asset name..."
                className="pl-8 h-8 text-xs bg-muted border-none focus-visible:ring-primary font-medium"
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* MOBILE + DESKTOP SAFE HEIGHT */}
            <ScrollArea className="h-[60vh] md:h-[480px]">
              <div className="divide-y divide-border">

                {filteredActivities.length === 0 ? (
                  <div className="p-16 text-center">
                    <Activity className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      No matching logs found.
                    </p>
                  </div>
                ) : (
                  filteredActivities.map((act) => (
                    <div
                      key={act.id}
                      className="px-6 py-4 flex gap-4 items-start hover:bg-muted/40 transition-colors group"
                    >
                      <div
                        className={cn(
                          "p-2 rounded-lg shrink-0 mt-0.5 shadow-sm",
                          act.severity === "critical"
                            ? "bg-destructive text-destructive-foreground"
                            : "bg-muted text-muted-foreground group-hover:text-primary"
                        )}
                      >
                        {act.type === "ALERT"
                          ? <AlertTriangle className="w-3.5 h-3.5" />
                          : <Plus className="w-3.5 h-3.5" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="text-[11px] font-black text-foreground uppercase tracking-tight leading-none">
                            {act.title}
                          </p>

                          <span className="text-[9px] font-medium text-muted-foreground">
                            {formatDistanceToNow(act.time, { addSuffix: true })}
                          </span>
                        </div>

                        <p className="text-[10px] text-muted-foreground mt-1.5 font-mono">
                          {act.sub}
                        </p>
                      </div>
                    </div>
                  ))
                )}

              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        {/* --- RIGHT: ASSET VISIBILITY --- */}
        <div className="xl:col-span-3 space-y-6">


          <Card className="border-none pt-0 shadow-sm overflow-hidden h-[280px] group relative">
            <CardContent className="h-full p-0 relative bg-slate-100">

              {/* REAL LIVE MAP LAYER */}
              <div className="absolute inset-0 grayscale group-hover:grayscale-0 transition-all duration-700 opacity-80">
                <TacticalMap
                  vehicles={fleet} // Pass the real fleet data here
                  center={{ lat: 9.023, lng: 38.746 }} // Default center (Addis Ababa)
                  config={{ showHistory: false, showFences: false }} // Keep it clean for the widget
                />
              </div>

              {/* GRADIENT OVERLAY (Makes text readable) */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent pointer-events-none" />

              {/* TEXT & UI OVERLAY */}
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none">
                <div>
                  <p className="text-[24px] font-black text-white leading-none tracking-tighter">
                    {intelligence.online}
                  </p>
                  <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest mt-1">Units Moving</p>
                </div>

                {/* EXPAND BUTTON */}
                <Button
                  size="sm"
                  className="h-7 text-[9px] font-black uppercase bg-emerald-600 hover:bg-emerald-500 border-none pointer-events-auto shadow-lg"
                  onClick={() => window.location.href = '/dashboard/map'}
                >
                  Expand
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-none p-5 bg-white">
            <div className="flex justify-between items-center mb-4">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Hardware Load</p>
              <p className="text-xs font-black text-foreground">{(intelligence.total - intelligence.noDevices)} / {intelligence.total}</p>
            </div>
            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-900 transition-all duration-1000"
                style={{ width: `${((intelligence.total - intelligence.noDevices) / intelligence.total) * 100}%` }}
              />
            </div>
            <p className="text-[9px] text-muted-foreground mt-3 italic font-medium leading-relaxed">
              Distribution of activated IoT modules across registered assets.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function KPIItem({ title, value, icon: Icon, color, glow, danger }: any) {
  const themes = {
    slate: "text-muted-foreground bg-muted border-border",
    secondary: "text-secondary bg-secondary/10 border-secondary/20",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
    primary: "text-primary bg-primary/10 border-primary/20",
    blue: "text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400",
  };

  return (
    <div className={cn(
      "bg-white border rounded-xl p-3.5 flex items-center gap-3.5 transition-all duration-300",
      danger ? "border-red-200 animate-pulse" : "border-slate-100 hover:border-slate-200"
    )}>
      <div className={cn("p-2.5 rounded-lg border", themes[color as keyof typeof themes])}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.15em] leading-none mb-1">{title}</p>
        <div className="flex items-center gap-1.5">
          <h3 className="text-lg font-black text-foreground tracking-tighter tabular-nums leading-none">{value}</h3>
          {glow && <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />}
        </div>
      </div>
    </div>
  );
}

function TechMetric({ label, value }: any) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-[9px] font-black uppercase text-muted-foreground tracking-widest">
        <span>{label}</span>
        <span className="text-foreground tabular-nums">{value}%</span>
      </div>
      <div className="h-0.5 w-full bg-border/20 rounded-full overflow-hidden">
        <div className="h-full bg-secondary transition-all duration-1000" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}