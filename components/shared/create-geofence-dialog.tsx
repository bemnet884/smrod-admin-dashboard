'use client';

import { useState } from "react";
import { Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Globe, Loader2, MapPin, Target, ShieldCheck } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { geofenceService } from "@/services/geofence.service";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(2, "Zone name required"),
  radius: z.number().min(10, "Radius too small").max(5000, "Radius too large"),
  latitude: z.string().refine((val) => !isNaN(Number(val)), "Invalid latitude"),
  longitude: z.string().refine((val) => !isNaN(Number(val)), "Invalid longitude"),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateGeofenceProps {
  vehicleId: string;
  currentLat?: number;
  currentLng?: number;
}

export function CreateGeofenceDialog({ vehicleId, currentLat, currentLng }: CreateGeofenceProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as unknown as Resolver<FormValues>,
    defaultValues: {
      name: "",
      radius: 500,
      latitude: "",
      longitude: "",
      isActive: true,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => geofenceService.create({
      name: values.name,
      vehicleId,
      latitude: Number(values.latitude),
      longitude: Number(values.longitude),
      radius: values.radius,
      isActive: values.isActive
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geofences', vehicleId] });
      toast.success("Tactical Perimeter Set", { description: "Virtual boundary is now active." });
      setOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error("Deployment Failed", { description: error.response?.data?.message || "Check coordinates." });
    }
  });

  const useCurrentLocation = () => {
    // These come from the dedicated /telemetry/.../latest endpoint now
    if (currentLat !== undefined && currentLng !== undefined) {
      form.setValue("latitude", currentLat.toString());
      form.setValue("longitude", currentLng.toString());
      toast.success("Coordinates Snapped", {
        description: "Successfully pulled latest GPS fix from hardware."
      });
    } else {
      toast.error("No GPS Signal", {
        description: "Hardware module has not reported location yet."
      });
    }
  };

  console.log("LAT LNG", currentLat, currentLng);

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (val && currentLat !== undefined && currentLng !== undefined) {
        form.reset({
          name: "",
          radius: 500,
          latitude: currentLat.toString(),
          longitude: currentLng.toString(),
          isActive: true
        });
      }
    }}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 font-medium">
          New Zone
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] p-6 gap-6">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Globe className="w-5 h-5 text-primary" />
            Create geofence
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Define a circular area. Exit alerts will trigger automatically.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Warehouse A" {...field} className="h-9" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="radius"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between mb-2">
                    <FormLabel className="text-sm font-medium">Radius (meters)</FormLabel>
                    <span className="text-xs font-mono font-bold text-primary bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      {field.value}M
                    </span>
                  </div>
                  <FormControl>
                    <Slider
                      min={10}
                      max={2000}
                      step={10}
                      value={[field.value]}
                      onValueChange={(vals) => field.onChange(vals[0])}
                      className="py-4"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-xl border dark:border-white/10 p-4 bg-slate-50/50 dark:bg-white/5">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm font-black uppercase tracking-tight">Activate on Save</FormLabel>
                    <FormDescription className="text-[10px] font-bold uppercase text-muted-foreground">
                      Enable perimeter immediately after deployment
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Coordinates</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={useCurrentLocation}
                  disabled={currentLat === undefined || currentLng === undefined}
                >
                  <Target className="w-3.5 h-3.5" />
                  Use current
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">Latitude</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-9 font-mono text-sm" placeholder="0.0000" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">Longitude</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-9 font-mono text-sm" placeholder="0.0000" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-2.5 h-9 bg-emerald-600 hover:bg-emerald-700 text-sm font-medium"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Creating...
                </>
              ) : (
                "Create geofence"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}