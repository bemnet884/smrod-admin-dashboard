'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertService } from '@/services/alert.service';
import { vehicleService } from '@/services/vehicle.service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertCircle, ShieldAlert, Zap,
  Trash2, Clock, MapPin, Loader2, Gauge, Plus, X,
  Shield, Terminal, Activity
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { PaginationControls } from '@/components/shared/pagination-controls';

type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export default function AlertCenterPage() {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // --- PAGINATION STATE ---
  const [page, setPage] = useState(1);
  const limit = 10;

  // 1. Fetch Real Alerts with Pagination params
  const { data: response, isLoading } = useQuery({
    queryKey: ['alerts', page],
    queryFn: () => alertService.getAlerts({ limit, page }),
    refetchInterval: 10000,
    placeholderData: (prev) => prev, // Keeps list stable while fetching next page
  });

  const deleteMutation = useMutation({
    mutationFn: alertService.deleteAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success("Incident Acknowledged", {
        description: "Alert cleared from active monitoring."
      });
    }
  });
  // --- SAFE EXTRACTION ---
  const alerts: any[] = response?.data || [];
  const meta = {
    currentPage: response?.meta?.page ?? response?.meta?.currentPage ?? 1,
    totalPages: response?.meta?.totalPages ?? 1,
    totalItems: response?.meta?.total ?? response?.meta?.totalItems ?? 0,
  };

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'THEFT':
      case 'TAMPER':
        return { icon: ShieldAlert, color: "text-red-600", bg: "bg-red-50", border: "border-l-red-600", severity: "CRITICAL" as Severity, category: "Security" };
      case 'ACCIDENT':
      case 'SOS':
        return { icon: Zap, color: "text-orange-600", bg: "bg-orange-50", border: "border-l-orange-500", severity: "HIGH" as Severity, category: "Emergency" };
      case 'FAST_DRIVING':
      case 'SLOW_DRIVING':
        return { icon: Gauge, color: "text-amber-600", bg: "bg-amber-50", border: "border-l-amber-500", severity: "MEDIUM" as Severity, category: "Driving" };
      default:
        return { icon: Activity, color: "text-blue-600", bg: "bg-blue-50", border: "border-l-blue-500", severity: "LOW" as Severity, category: "System" };
    }
  };

  const filteredAlerts = useMemo(() => {
    if (!selectedType) return alerts;
    return alerts.filter(alert => {
      const style = getAlertStyle(alert.alertType);
      return style.category.toLowerCase() === selectedType.toLowerCase();
    });
  }, [alerts, selectedType]);

  // Handle local filter change (reset to page 1)
  const handleFilterSelect = (type: string | null) => {
    setSelectedType(type);
    setPage(1);
  };

  if (isLoading && alerts.length === 0) return (
    <div className="h-full flex flex-col items-center justify-center gap-4 py-20">
      <Loader2 className="animate-spin text-emerald-500 w-8 h-8" />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Syncing Incident Logs</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-10 max-w-[1200px] mx-auto animate-in fade-in duration-500">

      {/* --- COMMAND HEADER --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground uppercase tracking-tighter flex items-center gap-2">
            <Terminal className="w-6 h-6 text-red-600" />
            Security Incident Center
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Live Monitoring: {meta.totalItems} Active Records
            </p>
          </div>
        </div>
      </div>

      {/* --- TACTICAL FILTERS --- */}
      <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl w-fit border border-slate-200 shadow-sm">
        <FilterButton active={!selectedType} onClick={() => handleFilterSelect(null)} label="All Logs" />
        <FilterButton active={selectedType === 'security'} onClick={() => handleFilterSelect('security')} label="Security" />
        <FilterButton active={selectedType === 'emergency'} onClick={() => handleFilterSelect('emergency')} label="Emergency" />
        <FilterButton active={selectedType === 'driving'} onClick={() => handleFilterSelect('driving')} label="Behavior" />
      </div>

      {/* --- INCIDENT LOGS --- */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="space-y-0 divide-y divide-slate-100">
          {filteredAlerts.length === 0 ? (
            <div className="bg-white p-20 text-center">
              <Shield className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">No Active Threats Detected</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const style = getAlertStyle(alert.alertType);
              return (
                <div key={alert.id} className={cn("group flex items-center gap-4 p-4 bg-white transition-all hover:bg-slate-50", style.border)}>

                  {/* Visual Identity */}
                  <div className={cn("p-2.5 rounded-lg shrink-0", style.bg)}>
                    <style.icon className={cn("w-5 h-5", style.color)} />
                  </div>

                  {/* Content HUD */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[11px] font-black text-foreground uppercase tracking-tight">
                        {alert.alertType.replace(/_/g, ' ')}
                      </span>
                      <Badge className={cn("text-[8px] font-black px-1.5 h-4 border-none",
                        style.severity === 'CRITICAL' ? 'bg-red-600 text-white' :
                          style.severity === 'HIGH' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600'
                      )}>
                        {style.severity}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      {alert.vehicle && (
                        <span className="text-[10px] font-mono text-primary font-bold">
                          ASSET: {alert.vehicle.plateNumber}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                      </span>
                      <span className="text-[10px] font-mono text-slate-300">
                        REF_ID: {alert.id.substring(0, 8)}
                      </span>
                    </div>
                  </div>

                  {/* Tactical Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost" size="sm"
                      className="h-8 text-[10px] font-black uppercase text-muted-foreground hover:text-primary hover:bg-emerald-50 opacity-0 group-hover:opacity-100 transition-all"
                      onClick={() => window.location.href = `/dashboard/fleet/${alert.vehicleId}`}
                    >
                      Locate
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="h-8 w-8 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100"
                      onClick={() => deleteMutation.mutate(alert.id)}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* --- PAGINATION --- */}
        <PaginationControls
          currentPage={meta.currentPage}
          totalPages={meta.totalPages}
          totalItems={meta.totalItems}
          onPageChange={(newPage) => {
            if (!isNaN(newPage) && newPage >= 1) setPage(newPage);
          }}
        />
      </div>
    </div>
  );
}

// --- SUB COMPONENTS ---
function FilterButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
        active ? "bg-white text-foreground shadow-sm border border-slate-200" : "text-muted-foreground hover:text-slate-600"
      )}
    >
      {label}
    </button>
  );
}