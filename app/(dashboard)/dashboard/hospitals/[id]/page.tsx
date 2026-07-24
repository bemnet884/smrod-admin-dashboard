'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hospitalService, Hospital } from '@/services/hospital.service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, MapPin, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { HospitalGoogleMap } from '@/components/maps/hospital-map';
import { HospitalAlertFeed } from '@/components/alerts/hospital-alert-feed';
import { useState, useEffect } from 'react';

export default function HospitalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['hospital', id],
    queryFn: () => hospitalService.getHospitalDetails(id)
  });

  const hospitalData: Hospital | undefined = data?.data;

  // 🔹 Local state for instant UI update
  const [hospital, setHospital] = useState<Hospital | undefined>(hospitalData);

  useEffect(() => {
    if (hospitalData) setHospital(hospitalData);
  }, [hospitalData]);

  const toggleMutation = useMutation({
    mutationFn: hospitalService.toggleHospitalStatus,
    onSuccess: (updated: Hospital) => {
      setHospital(updated); // update local state immediately
      queryClient.invalidateQueries({ queryKey: ['hospital', id] });
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
      toast.success('Hospital status updated');
    }
  });

  if (isLoading || !hospital) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary w-6 h-6" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* BACK */}
      <Button variant="ghost" className="flex items-center gap-2" onClick={() => router.push('/dashboard/hospitals')} >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>

      {/* GRID */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* LEFT INFO */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{hospital.name}</h2>
                <p className="text-xs text-muted-foreground font-mono">{hospital.id}</p>
              </div>
              {/* <Button
                variant={hospital.isActive ? 'destructive' : 'secondary'}
                onClick={() =>
                  toggleMutation.mutate(hospital.id, {
                    onSuccess: (updatedHospital) => setHospital(updatedHospital),
                  })
                }
              >
                {hospital.isActive ? 'Deactivate' : 'Activate'}
              </Button> */}
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                {hospital.phone || 'No phone'}
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                {hospital.email || 'No email'}
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
                <span>{hospital.address}</span>
              </div>
            </div>

            <div className="bg-muted/40 rounded-xl p-3 text-xs font-mono">
              <p>Lat: {hospital.latitude}</p>
              <p>Lng: {hospital.longitude}</p>
            </div>

            <div className="flex gap-3 pt-2">
              {/* <Button
                variant={hospital.isActive ? 'destructive' : 'secondary'}
                onClick={() => toggleMutation.mutate(hospital.id)}
              >
                {hospital.isActive ? 'Deactivate' : 'Activate'}
              </Button> */}

              {/* EDIT BUTTON */}
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/hospitals/${hospital.id}/edit`)}
              >
                Edit
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT → MAP + ALERTS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border bg-card p-4 shadow-sm space-y-3">
            <p className="text-sm font-semibold">Facility Location</p>
            <HospitalGoogleMap
              latitude={Number(hospital.latitude)}
              longitude={Number(hospital.longitude)}
            />
          </div>

          <HospitalAlertFeed hospitalId={hospital.id} />
        </div>
      </div>
    </div>
  );
}