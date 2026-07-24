'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { deviceService } from '@/services/device.service';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Cpu, AlertCircle, Terminal, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { PageHeader } from '@/components/shared/page-header';
import { DataFilterBar } from '@/components/shared/data-filter-bar';

export default function DevicesRegistryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // 1. Fetch Hardware Data
  const { data: response, isLoading, isError } = useQuery({
    queryKey: ['devices-registry', page, searchTerm],
    queryFn: () => deviceService.getDevices(), // Update if backend adds pagination
    refetchInterval: 30000,
  });

  const allDevices = response?.data || [];

  // 2. Filtered list (Matches your search term)
  const filteredDevices = allDevices.filter((d: any) =>
    d.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.vehiclePlate?.toString().includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">

      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="Hardware Registry"
          subtitle="Global device inventory & connectivity status"
        />
        {/* Placeholder for future add device action if needed */}
      </div>

      {/* --- TOOLBAR --- */}
      <DataFilterBar
        searchTerm={searchTerm}
        onSearch={(val) => { setSearchTerm(val); setPage(1); }}
        placeholder="Search by serial number or asset..."
        totalItems={filteredDevices.length}
        label="Devices"
      />

      {/* --- TABLE AREA --- */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow>
              <TableHead className="font-semibold text-slate-700">Device Identity</TableHead>
              <TableHead className="font-semibold text-slate-700">Installation Node</TableHead>
              <TableHead className="font-semibold text-slate-700">Status</TableHead>
              <TableHead className="font-semibold text-slate-700">Network Pulse</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="h-48 text-center"><Loader2 className="animate-spin h-6 w-6 mx-auto text-emerald-600" /></TableCell></TableRow>
            ) : isError ? (
                <TableRow><TableCell colSpan={5} className="h-48 text-center text-red-500"><AlertCircle className="w-6 h-6 mx-auto mb-2" /> Connection failed.</TableCell></TableRow>
            ) : filteredDevices.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-48 text-center text-slate-400 italic">No hardware units found.</TableCell></TableRow>
            ) : (
                    filteredDevices.slice((page - 1) * limit, page * limit).map((device: any) => {
                const isOnline = device.lastSeen && new Date(device.lastSeen).getTime() > Date.now() - 10 * 60 * 1000;
                return (
                  <TableRow key={device.id} className="hover:bg-slate-50 transition-colors group">
                    <TableCell>
                      <div className="font-bold text-slate-900 text-sm uppercase">{device.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono tracking-widest">{device.serialNumber}</div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-slate-100"><Car className="w-3.5 h-3.5 text-slate-500" /></div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">{device.vehiclePlate || "Standalone"}</p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{device.vehicleName}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge className={cn(
                        "uppercase text-[9px] font-black border-none",
                        device.status === 'ACTIVE' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-600"
                      )}>
                        {device.status}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={cn("w-2 h-2 rounded-full", isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700">{isOnline ? "Broadcasting" : "Silent"}</span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-tighter">
                            {device.lastSeen ? formatDistanceToNow(new Date(device.lastSeen), { addSuffix: true }) : 'Never Seen'}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-600">
                        <Terminal className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        <PaginationControls
          currentPage={page}
          totalPages={Math.ceil(filteredDevices.length / limit) || 1}
          totalItems={filteredDevices.length}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}