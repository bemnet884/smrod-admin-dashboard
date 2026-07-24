'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driverService } from '@/services/driver.service';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Users, Search, Loader2, UserCheck,
  UserX, Mail, Phone, ScanFace, AlertCircle, Trash2
} from 'lucide-react';
import RegisterUserDialog from '@/components/shared/register-user-dialog';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import { User, ApiResponse } from '@/types';
import { PaginationControls } from '@/components/shared/pagination-controls';

export default function DriversPage() {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const limit = 10;

  // --- UPDATE QUERY ---
  const { data: response, isLoading, isError } = useQuery<ApiResponse<User[]>>({
    queryKey: ['drivers', user?.role, page, searchTerm],
    queryFn: () => driverService.getDrivers(
      user?.role?.toLowerCase() === 'owner',
      { search: searchTerm || undefined, page, limit }
    ),
    placeholderData: (prev) => prev,
  });


  // --- SAFE DATA & META EXTRACTION ---
  const driversList = response?.data || [];
  const meta = {
    currentPage: response?.meta?.page ?? response?.meta?.currentPage ?? 1,
    totalPages: response?.meta?.totalPages ?? 1,
    totalItems: response?.meta?.total ?? response?.meta?.totalItems ?? 0,
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  // 2. Toggle Status Mutation (PATCH /users/:id)
  const statusMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      driverService.toggleDriverStatus(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success("Account status updated");
    }
  });

  // 3. Delete Mutation (DELETE /users/:id)
  const deleteMutation = useMutation({
    mutationFn: (id: string) => driverService.removeDriver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success("Driver removed from system");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Cannot delete driver with history.");
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2 uppercase tracking-tight">
            <Users className="w-6 h-6 text-orange-600" />
            Driver Registry
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Total control over authorized vehicle operators.</p>
        </div>
        <Button onClick={() => setIsRegisterOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 shadow-sm">
          <UserCheck className="w-4 h-4 mr-2" /> Register Driver
        </Button>
      </div>

      <div className="flex items-center justify-between bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            className="pl-9 border-none focus-visible:ring-0"
            value={searchTerm}
            onChange={handleSearch}
          />

          <div className="text-xs text-muted-foreground font-medium px-4 border-l">
            {meta.totalItems} Drivers
          </div>

        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow>
              <TableHead className="font-bold text-slate-700">Driver Profile</TableHead>
              <TableHead className="font-bold text-slate-700">Contact</TableHead>
              <TableHead className="font-bold text-slate-700">Hardware Status</TableHead>
              <TableHead className="font-bold text-slate-700">Status</TableHead>
              <TableHead className="text-right font-bold text-slate-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="h-48 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" /></TableCell></TableRow>
            ) : isError ? (
                <TableRow><TableCell colSpan={5} className="h-48 text-center text-destructive"><AlertCircle className="mx-auto mb-2" />Error loading registry.</TableCell></TableRow>
            ) : driversList.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="h-48 text-center text-muted-foreground">No operators found.</TableCell></TableRow>
            ) : (
              driversList.map((driver) => (
                <TableRow key={driver.id} className="hover:bg-slate-50/50 transition-colors group">
                  <TableCell>
                    <div className="font-bold text-foreground">{driver.name}</div>
                    <div className="text-[10px] text-muted-foreground font-mono uppercase">{driver.id.substring(0, 8)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-xs text-slate-600">
                      {driver.email && <div className="flex items-center gap-2"><Mail className="w-3 h-3" /> {driver.email}</div>}
                      {driver.phone && <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> {driver.phone}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={driver.avatarUrl ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-50 text-muted-foreground"}>
                      <ScanFace className="w-3 h-3 mr-1" />
                      {driver.avatarUrl ? "Face Enrolled" : "Pending Face ID"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={driver.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                      {driver.isActive ? "Active" : "Suspended"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="outline" size="icon" className="h-8 w-8"
                        onClick={() => statusMutation.mutate({ id: driver.id, active: !driver.isActive })}
                      >
                        {driver.isActive ? <UserX className="w-4 h-4 text-amber-600" /> : <UserCheck className="w-4 h-4 text-primary" />}
                      </Button>
                      <Button
                        variant="outline" size="icon" className="h-8 w-8 hover:bg-red-50 text-muted-foreground hover:text-red-600"
                        onClick={() => confirm("Delete this driver?") && deleteMutation.mutate(driver.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <PaginationControls
          currentPage={meta.currentPage}
          totalPages={meta.totalPages}
          totalItems={meta.totalItems}
          onPageChange={(newPage) => {
            if (!isNaN(newPage) && newPage >= 1) setPage(newPage);
          }}
        />
      </div>

      <RegisterUserDialog open={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
    </div>
  );
}