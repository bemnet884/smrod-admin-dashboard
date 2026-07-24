'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Search, Cpu, Activity, ShieldCheck, Loader2, ArrowUpDown, ArrowUp, ArrowDown,
  Eye, Car as CarIcon, AlertCircle, User as UserIcon
} from 'lucide-react';
import { PaginationControls } from '@/components/shared/pagination-controls';

import { vehicleService } from '@/services/vehicle.service';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RegisterVehicleWizard } from '@/components/shared/register-vehicle-wizard';
import { AssignDriverModal } from '@/components/shared/assign-driver-modal';
import { ROLES, canAccess } from '@/lib/rbac';
import { useAuthStore } from '@/store/useAuthStore';

// Explicitly import types to satisfy TypeScript
import { Vehicle, ApiResponse } from '@/types';
import { cn } from '@/lib/utils';
import { DataFilterBar } from '@/components/shared/data-filter-bar';
import { PageHeader } from '@/components/shared/page-header';

export default function FleetPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const { user } = useAuthStore();
  const role = user?.role?.toLowerCase();
  const isAdmin = role === ROLES.ADMIN;
  const [page, setPage] = useState(1);
  const limit = 10; 

  // 1. Fetch data (Strictly Typed)
  const { data: response, isLoading, isError } = useQuery<ApiResponse<Vehicle[]>>({
    queryKey: ['vehicles', role, page, searchTerm],
    queryFn: () => vehicleService.getVehicles(role, {
      page,
      limit,
      search: searchTerm || undefined
    }),
    placeholderData: (previousData) => previousData,
  });

  // THE GOLDEN RULE FOR TS(18048)
  const vehicles = response?.data || [];
  const meta = {
    currentPage: response?.meta?.page ?? response?.meta?.currentPage ?? 1,
    totalPages: response?.meta?.totalPages ?? 1,
    totalItems: response?.meta?.total ?? response?.meta?.totalItems ?? 0,
  };


  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const hasModule = (vehicle: Vehicle, keyword: string) => {
    if (!vehicle.devices || !Array.isArray(vehicle.devices)) return false;
    return vehicle.devices.some((d: any) => d.name?.toLowerCase().includes(keyword.toLowerCase()));
  };

  const processedVehicles = useMemo(() => {
    let result = [...vehicles];

    if (sortConfig) {
      result.sort((a: any, b: any) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'owner') {
          aValue = a.owner?.name || '';
          bValue = b.owner?.name || '';
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [vehicles, sortConfig]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return <ArrowUpDown className="ml-2 h-3.5 w-3.5 opacity-30" />;
    return sortConfig.direction === 'asc' ?
      <ArrowUp className="ml-2 h-3.5 w-3.5 text-primary" /> :
      <ArrowDown className="ml-2 h-3.5 w-3.5 text-primary" />;
  };

  const getStatusBadge = (status?: string) => {
    const safeStatus = status || 'OFFLINE';
    switch (safeStatus) {
      case 'ACTIVE':
      case 'ONLINE': return <Badge className="bg-emerald-50 text-emerald-700 border-none font-black text-[9px] uppercase">Online</Badge>;
      case 'INACTIVE':
      case 'OFFLINE': return <Badge variant="outline" className="text-muted-foreground bg-slate-50 border-slate-200 font-black text-[9px] uppercase">Offline</Badge>;
      case 'CRITICAL': return <Badge className="bg-red-50 text-red-600 border-none font-black text-[9px] uppercase animate-pulse">Critical</Badge>;
      default: return <Badge variant="outline" className="font-black text-[9px] uppercase">{safeStatus}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader title="Fleet Management" subtitle="Monitor vehicle health and assignments." />
        <RegisterVehicleWizard />
      </div>

      {/* 2. Standardized Toolbar */}
      <DataFilterBar
        searchTerm={searchTerm}
        onSearch={(val) => { setSearchTerm(val); setPage(1); }}
        placeholder="Search plate, VIN, or make..."
        totalItems={meta.totalItems}
        label="Vehicles"
      />
      {/* --- TABLE AREA --- */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead
                onClick={() => handleSort('name')}
                className="cursor-pointer hover:bg-muted transition-colors"
              >
                <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Asset Identity {getSortIcon('name')}
                </div>
              </TableHead>

              {isAdmin && (
                <TableHead onClick={() => handleSort('owner')} className="cursor-pointer hover:bg-muted transition-colors">
                  <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Owning Entity {getSortIcon('owner')}</div>
                </TableHead>
              )}

              <TableHead onClick={() => handleSort('status')} className="cursor-pointer hover:bg-muted transition-colors">
                <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status {getSortIcon('status')}</div>
              </TableHead>

              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Installed Modules</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Security</TableHead>

              <TableHead onClick={() => handleSort('updatedAt')} className="cursor-pointer hover:bg-muted transition-colors">
                <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Last Sync {getSortIcon('updatedAt')}</div>
              </TableHead>

              <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 7 : 6} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Syncing Fleet Data...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 6} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-destructive">
                      <AlertCircle className="h-6 w-6" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Link to central DB failed.</span>
                    </div>
                </TableCell>
              </TableRow>
              ) : processedVehicles.length === 0 ? (
              <TableRow>
                    <TableCell colSpan={isAdmin ? 7 : 6} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <CarIcon className="h-10 w-10 opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-widest italic">No assets found.</p>
                      </div>
                </TableCell>
              </TableRow>
            ) : (
                    processedVehicles.map((vehicle: Vehicle) => (
                      <TableRow key={vehicle.id} className="hover:bg-muted/40 transition-colors group">

                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-black text-sm text-foreground tracking-tight uppercase leading-none mb-1">{vehicle.name || "UNNAMED"}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground font-mono font-bold tracking-widest">
                                {vehicle.plateNumber}
                              </span>
                              {vehicle.drivers?.[0] && (
                                <Badge className="text-[8px] h-4 px-1.5 font-black bg-slate-100 text-muted-foreground border-none uppercase tracking-tighter">
                                  OP: {vehicle.drivers[0].name.split(' ')[0]}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {isAdmin && (
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-muted-foreground text-[10px] font-black uppercase shadow-sm">
                                {vehicle.owner?.name?.[0] || <UserIcon className="w-3 h-3" />}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-xs text-foreground leading-none">{vehicle.owner?.name || "System"}</span>
                              </div>
                            </div>
                          </TableCell>
                        )}

                  <TableCell>{getStatusBadge(vehicle.status)}</TableCell>

                  <TableCell>
                          <div className="flex gap-1.5">
                            <TooltipProvider delayDuration={0}>
                              {hasModule(vehicle, 'PassKey') && (
                                <Tooltip><TooltipTrigger asChild><div className="p-1.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100"><Cpu className="h-3.5 w-3.5" /></div></TooltipTrigger><TooltipContent className="text-[10px] font-bold">PASSKEY (AUTH)</TooltipContent></Tooltip>
                              )}
                              {hasModule(vehicle, 'Tracking') && (
                                <Tooltip><TooltipTrigger asChild><div className="p-1.5 rounded-md bg-emerald-50 text-primary border border-emerald-100"><Activity className="h-3.5 w-3.5" /></div></TooltipTrigger><TooltipContent className="text-[10px] font-bold">GPS TRACKING</TooltipContent></Tooltip>
                              )}
                              {hasModule(vehicle, 'Governor') && (
                                <Tooltip><TooltipTrigger asChild><div className="p-1.5 rounded-md bg-violet-50 text-violet-600 border border-violet-100"><ShieldCheck className="h-3.5 w-3.5" /></div></TooltipTrigger><TooltipContent className="text-[10px] font-bold">SPEED GOVERNOR</TooltipContent></Tooltip>
                              )}
                              {(!vehicle.devices || vehicle.devices.length === 0) && (
                                <span className="text-[9px] text-muted-foreground font-bold italic uppercase tracking-tighter">No Hardware</span>
                              )}
                      </TooltipProvider>
                    </div>
                  </TableCell>

                        <TableCell>
                          {(vehicle.statistics?.totalAlerts ?? 0) > 0 ? (
                            <div className="flex items-center gap-1.5 text-red-600 font-black text-[9px] uppercase tracking-widest bg-red-50 w-fit px-2 py-1 rounded">
                              <AlertCircle className="w-3 h-3" />
                              {vehicle.statistics?.totalAlerts} Incidents
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-primary font-black text-[9px] uppercase tracking-widest w-fit px-2 py-1 rounded opacity-50">
                              <ShieldCheck className="w-3 h-3" />
                              Secure
                            </div>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-700">
                              {vehicle.updatedAt ? new Date(vehicle.updatedAt).toLocaleDateString() : 'N/A'}
                            </span>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                              {vehicle.updatedAt ? new Date(vehicle.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : ''}
                            </span>
                          </div>
                  </TableCell>

                        <TableCell className="text-right align-middle">
                          <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <AssignDriverModal
                              vehicleId={vehicle.id}
                              plateNumber={vehicle.plateNumber.toString()}
                              currentDriverId={vehicle.drivers?.[0]?.id}
                            />
                      <Link
                        href={`/dashboard/fleet/${vehicle.id}`}
                              className="flex items-center text-[10px] font-black uppercase tracking-widest text-primary hover:text-emerald-700 bg-white hover:bg-emerald-50 px-3 py-1.5 rounded-md transition-colors border shadow-sm"
                      >
                              <Eye className="w-3 h-3 mr-1" /> View
                      </Link>
                    </div>
                  </TableCell>
                      </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* --- PAGINATION --- */}
        <PaginationControls
          currentPage={meta.currentPage}
          totalPages={meta.totalPages}
          totalItems={meta.totalItems}
          onPageChange={(newPage) => {
            // Extra safety check to prevent NaN
            if (!isNaN(newPage) && newPage >= 1) {
              setPage(newPage);
            }
          }}
        />
      </div>
    </div>
  );
}