'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity, Server, Database, Cpu,
  RefreshCw, Globe, Zap, Clock, ShieldCheck,
  BarChart, LineChart as LineIcon, Network, AlertOctagon
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart as ReBarChart, Bar
} from 'recharts';

// Services
import { healthService } from '@/services/health.service';
import { vehicleService } from '@/services/vehicle.service';

// --- MOCK DATA FOR ENTERPRISE VISUALIZATION ---
const telemetryHistory = [
  { time: '08:00', packets: 420 }, { time: '09:00', packets: 850 },
  { time: '10:00', packets: 1200 }, { time: '11:00', packets: 900 },
  { time: '12:00', packets: 1100 }, { time: '13:00', packets: 1500 },
  { time: '14:00', packets: 1300 },
];

const alertFrequency = [
  { day: 'Mon', count: 12 }, { day: 'Tue', count: 18 },
  { day: 'Wed', count: 7 }, { day: 'Thu', count: 25 },
  { day: 'Fri', count: 14 }, { day: 'Sat', count: 5 },
  { day: 'Sun', count: 3 },
];

export default function SystemHealthPage() {

  // 1. Fetch Backend Pulse
  const { data: systemPulse, isLoading: loadingPulse, refetch } = useQuery({
    queryKey: ['system-health-pulse'],
    queryFn: healthService.checkSystemStatus,
    refetchInterval: 15000 // High-frequency polling for health
  });

  const { data: fleetData } = useQuery({
    queryKey: ['vehicles-health-check'],
    queryFn: () => vehicleService.getAllVehiclesEnriched(),
  });

  const vehicles = fleetData?.data || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">

      {/* --- HEADER: OPERATIONAL STATUS --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
            <Activity className="w-8 h-8 text-primary" />
            System Command Health
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Infrastructure monitoring and hardware telemetry ingestion.</p>
        </div>
        <div className="flex gap-3">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
            V1.4.2 Staging
          </Badge>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="shadow-sm">
            <RefreshCw className="w-4 h-4 mr-2" /> Force Sync
          </Button>
        </div>
      </div>

      {/* --- SECTION 1: CORE INFRASTRUCTURE PULSE --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatusCard
          title="API Gateway"
          status={systemPulse?.status === 'ok' ? 'Healthy' : 'Degraded'}
          icon={Server}
          metric="24ms latency"
        />
        <StatusCard
          title="Postgres Cluster"
          status={systemPulse?.status === 'ok' ? 'Connected' : 'Error'}
          icon={Database}
          metric="342/1000 Connections"
        />
        <StatusCard
          title="MQTT Broker"
          status="Healthy"
          icon={Network}
          metric="1.2k Subscriptions"
        />
        <StatusCard
          title="Uptime (30d)"
          status="99.98%"
          icon={ShieldCheck}
          metric="Tier-4 Data Center"
        />
      </div>

      {/* --- SECTION 2: TELEMETRY & ANALYTICS GRAPHS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Telemetry Ingestion Rate */}
        <Card className="border-slate-200 shadow-md overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" /> Telemetry Ingestion
                </CardTitle>
                <CardDescription>GPS/Sensor packets per hour</CardDescription>
              </div>
              <Badge className="bg-emerald-600 text-white">Live Feed</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetryHistory}>
                <defs>
                  <linearGradient id="colorPackets" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="packets" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPackets)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Alert Frequency */}
        <Card className="border-slate-200 shadow-md">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-orange-500" /> Security Incident Frequency
            </CardTitle>
            <CardDescription>Aggregated alerts over last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={alertFrequency}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px' }} />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={30} />
              </ReBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>

      {/* --- SECTION 3: RECENT SYSTEM EVENTS --- */}
      <Card className="border-slate-200 shadow-md">
        <CardHeader className="border-b">
          <CardTitle className="text-lg font-bold">System Event Logs</CardTitle>
          <CardDescription>Critical backend and deployment operations</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            <EventRow
              title="Database Migration Complete"
              desc="Applied vehicle_type enum update to production cluster."
              time="2 hours ago"
              type="success"
            />
            <EventRow
              title="MQTT Broker Restart"
              desc="Scheduled maintenance to apply security patches."
              time="5 hours ago"
              type="info"
            />
            <EventRow
              title="High Latency Warning"
              desc="Telemetry ingestion exceeded 3000ms in Addis Ababa region."
              time="12 hours ago"
              type="warning"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// --- REUSABLE UI COMPONENTS ---

function StatusCard({ title, status, icon: Icon, metric }: any) {
  const isHealthy = status === 'Healthy' || status === 'Connected' || status.includes('%');
  return (
    <Card className="border-none shadow-sm bg-white">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-slate-50 rounded-lg">
            <Icon className="w-5 h-5 text-muted-foreground" />
          </div>
          <Badge className={isHealthy ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"}>
            {status}
          </Badge>
        </div>
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1">{metric}</p>
      </CardContent>
    </Card>
  );
}

function EventRow({ title, desc, time, type }: any) {
  const dotColor = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    info: "bg-blue-500"
  };

  return (
    <div className="p-4 flex gap-4 items-start hover:bg-slate-50 transition">
      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dotColor[type as keyof typeof dotColor]}`} />
      <div className="flex-1">
        <p className="text-sm font-bold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
      <span className="text-[10px] font-bold text-muted-foreground uppercase">{time}</span>
    </div>
  );
}