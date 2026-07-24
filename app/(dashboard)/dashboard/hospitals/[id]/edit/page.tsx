'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { hospitalService, Hospital } from '@/services/hospital.service';
import { PageHeader } from '@/components/shared/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export const editHospitalSchema = z.object({
  name: z.string({ message: "Name is required" }),
  phone: z.string({ message: "Phone is required" }),
  email: z.string().email({ message: "Invalid email" }).optional(),
  address: z.string({ message: "Address is required" }),
  latitude: z.number({ message: "Latitude is required" }),
  longitude: z.number({ message: "Longitude is required" }),
});

type HospitalFormValues = z.infer<typeof editHospitalSchema>;

export default function EditHospitalPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['hospital', id],
    queryFn: () => hospitalService.getHospitalDetails(id),
  });

  const hospitalData: Hospital | undefined = data?.data;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<HospitalFormValues>({
    resolver: zodResolver(editHospitalSchema),
  });

  // Pre-fill the form once data is loaded
  useEffect(() => {
    if (hospitalData) {
      setValue('name', hospitalData.name);
      setValue('phone', hospitalData.phone);
      setValue('email', hospitalData.email || '');
      setValue('address', hospitalData.address);
      setValue('latitude', hospitalData.latitude);
      setValue('longitude', hospitalData.longitude);
    }
  }, [hospitalData, setValue]);

  const mutation = useMutation({
    mutationFn: (payload: HospitalFormValues) =>
      hospitalService.updateHospital(id, payload),
    onSuccess: (updated) => {
      toast.success('Hospital updated successfully');
      queryClient.invalidateQueries({ queryKey: ['hospital', id] });
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
      router.push(`/dashboard/hospitals/${id}`);
    },
    onError: () => toast.error('Failed to update hospital'),
  });

  if (isLoading || !hospitalData) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="animate-spin w-6 h-6 text-primary" />
      </div>
    );
  }

  const onSubmit = (values: HospitalFormValues) => {
    mutation.mutate(values);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader title="Edit Hospital" subtitle={`Update details for ${hospitalData.name}`} />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm"
      >
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground">Name</label>
            <Input {...register('name')} />
            {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground">Phone</label>
            <Input {...register('phone')} />
            {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <Input {...register('email')} />
            {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground">Address</label>
            <Input {...register('address')} />
            {errors.address && <p className="text-red-500 text-xs">{errors.address.message}</p>}
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground">Latitude</label>
            <Input type="number" step="any" {...register('latitude', { valueAsNumber: true })} />
            {errors.latitude && <p className="text-red-500 text-xs">{errors.latitude.message}</p>}
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground">Longitude</label>
            <Input type="number" step="any" {...register('longitude', { valueAsNumber: true })} />
            {errors.longitude && <p className="text-red-500 text-xs">{errors.longitude.message}</p>}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}