'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hospitalService, Hospital } from '@/services/hospital.service';
import { PageHeader } from '@/components/shared/page-header';
import { DataFilterBar } from '@/components/shared/data-filter-bar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Phone, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { CreateHospitalDialog } from '@/components/shared/create-hospital-dialog';
import { useRouter } from 'next/navigation';

export default function HospitalsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const router = useRouter();

  // Fetch hospitals
  const { data: response, isLoading } = useQuery({
    queryKey: ['hospitals'],
    queryFn: () => hospitalService.getHospitals({ limit: 50 })
  });

  const hospitals = response?.data || [];

  // Filter hospitals based on search term
  const filteredHospitals = hospitals.filter((h) =>
    h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle hospital status mutation (currently commented out)
  const toggleMutation = useMutation({
    mutationFn: hospitalService.toggleHospitalStatus,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['hospitals'] });
      const previous = queryClient.getQueryData(['hospitals']);
      queryClient.setQueryData(['hospitals'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((h: Hospital) =>
            h.id === id ? { ...h, isActive: !h.isActive } : h
          )
        };
      });
      return { previous };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(['hospitals'], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
    },
    onSuccess: () => {
      toast.success("Hospital status updated");
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Header + Create Dialog */}
      <div className="flex justify-between items-center">
        <PageHeader
          title="Emergency Facilities"
          subtitle="Manage registered hospitals for emergency dispatch."
        />
        <CreateHospitalDialog />
      </div>

      {/* Search Filter */}
      <DataFilterBar
        searchTerm={searchTerm}
        onSearch={setSearchTerm}
        totalItems={filteredHospitals.length}
        label="Hospitals"
      />

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/60">
            <TableRow>
              <TableHead>Facility</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <Loader2 className="animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : filteredHospitals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                  No hospitals found
                </TableCell>
              </TableRow>
            ) : (
              filteredHospitals.map((h: Hospital) => (
                <TableRow key={h.id} className="hover:bg-muted/40">
                  <TableCell>
                    <p className="font-semibold">{h.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {h.id.slice(0, 8)}
                    </p>
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        {h.address}
                      </span>
                      <span className="flex items-center gap-2">
                        <Phone className="w-3 h-3" />
                        {h.phone}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant={h.isActive ? "secondary" : "destructive"}>
                      {h.isActive ? "ACTIVE" : "INACTIVE"}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right space-x-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => router.push(`/dashboard/hospitals/${h.id}`)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {/* Uncomment to enable toggle
                    <Button
                      size="sm"
                      disabled={toggleMutation.isPending}
                      variant={h.isActive ? "destructive" : "secondary"}
                      onClick={() => toggleMutation.mutate(h.id)}
                    >
                      {toggleMutation.isPending ? "Updating..." : h.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    */}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}