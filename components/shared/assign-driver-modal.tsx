'use client';

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vehicleService } from "@/services/vehicle.service";
import { userService } from "@/services/user.service"; // Import userService
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, UserCheck, Users, AlertCircle, ShieldQuestion } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";

export function AssignDriverModal({ vehicleId, plateNumber, currentDriverId }: any) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  // 1. Get Vehicle Details to find out who the owner is
  const { data: vResponse } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: () => vehicleService.getVehicleById(vehicleId),
    enabled: open
  });
  const vehicleOwnerId = vResponse?.ownerId;

  // 2. Fetch Drivers belonging to that Owner
  const { data: dResponse, isLoading, isError } = useQuery({
    queryKey: ['available-drivers', vehicleOwnerId],
    queryFn: () => {
      // If we have an ownerId, get their drivers. 
      // If we are Admin and ownerId is missing, get ALL drivers.
      if (vehicleOwnerId) return vehicleService.getDriversByOwner(vehicleOwnerId);
      return userService.getUsers({ role: 'driver' });
    },
    enabled: open && (!!vehicleOwnerId || isAdmin),
  });

  const drivers = dResponse?.data || [];

  const mutation = useMutation({
    mutationFn: (driverId: string) => vehicleService.assignDriver(vehicleId, driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success("Driver linked successfully");
      setOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Assignment failed")
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs font-bold text-violet-600 border-violet-100 hover:bg-violet-50">
          <UserCheck className="w-3.5 h-3.5 mr-1.5" /> Assign
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Assign Driver to {plateNumber}</DialogTitle>
          {vResponse?.owner && (
            <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1">
              Fleet Owner: <span className="text-primary">{vResponse.owner.name}</span>
            </p>
          )}
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {isLoading ? (
            <div className="flex flex-col items-center py-10"><Loader2 className="animate-spin text-violet-600" /></div>
          ) : drivers.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-xl border-2 border-dashed">
              <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm text-muted-foreground font-bold">No Drivers Available</p>
                <p className="text-[11px] text-muted-foreground mt-1 px-8">
                The owner of this vehicle has not registered any drivers yet.
              </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {drivers.map((driver: any) => (
                  <div key={driver.id} className="flex items-center justify-between p-3 border rounded-xl hover:border-slate-300 transition-all">
                    <div>
                      <p className="font-bold text-sm text-foreground">{driver.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{driver.phone || driver.email}</p>
                      {!driver.ownerId && <Badge className="mt-1 bg-amber-50 text-amber-600 border-none text-[8px]">Unassigned to Owner</Badge>}
                    </div>
                  <Button
                    size="sm" variant="ghost" className="text-violet-600 font-black text-xs"
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate(driver.id)}
                  >
                    {mutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "SELECT"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}