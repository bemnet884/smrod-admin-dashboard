'use client';

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Car, UserCircle, LayoutGrid, AlertOctagon, X, AlertCircle, MailPlus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vehicleService } from "@/services/vehicle.service";
import { ownerService } from "@/services/owner.service";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { registerVehicleSchema, RegisterVehicleFormValues } from "@/schemas/register-vehicle-schema";
import { cn } from "@/lib/utils";

export function RegisterVehicleWizard() {
  const [step, setStep] = useState(1);
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { user } = useAuthStore();
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  const { data: ownersResponse, isLoading: loadingOwners } = useQuery({
    queryKey: ['owners-list'],
    queryFn: () => ownerService.getOwners(),
    enabled: isAdmin && open,
  });
  const owners = ownersResponse?.data || [];

  const form = useForm<RegisterVehicleFormValues>({
    resolver: zodResolver(registerVehicleSchema),
    defaultValues: {
      plateNumber: "", make: "", model: "", vin: "",
      type: "CAR", ownerId: "", tracking: true, passKey: false, governor: false
    }
  });

  const mutation = useMutation({
    mutationFn: (values: RegisterVehicleFormValues) => {
      setServerError(null);

      const devices = [];
      if (values.tracking) devices.push({ name: "Tracking Module", serialNumber: `TRK-${Date.now()}` });
      if (values.passKey) devices.push({ name: "PassKey Module", serialNumber: `PK-${Date.now()}` });
      if (values.governor) devices.push({ name: "Speed Governor", serialNumber: `GOV-${Date.now()}` });

      const payload: any = {
        name: `${values.make} ${values.model}`,
        plateNumber: parseInt(values.plateNumber, 10),
        type: values.type,
        description: values.vin ? `VIN: ${values.vin}` : undefined,
        devices: devices,
      };

      if (isAdmin && values.ownerId) payload.ownerId = values.ownerId;
      return vehicleService.registerVehicle(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success("Asset Successfully Commissioned");
      setOpen(false);
      setStep(1);
      form.reset();
    },
    onError: (error: any) => {
      const statusCode = error?.response?.status;
      const backendMessage = error?.response?.data?.message || error?.response?.data?.error?.message || error?.message || "Unknown server error";

      if (statusCode === 409) {
        const message = "This plate number is already registered.";
        form.setError("plateNumber", { type: "server", message: message });
        setServerError(message);
        setStep(1);
        setTimeout(() => { form.setFocus("plateNumber"); }, 50);
      } else {
        setServerError(backendMessage);
      }

      toast.error("Registration Rejected", { description: backendMessage });
    }
  });

  const onSubmit = (values: RegisterVehicleFormValues) => {
    mutation.mutate(values);
  };

  const handleNextStep = async () => {
    const fieldsToValidate: any[] = ["plateNumber", "make", "model", "type"];
    if (isAdmin) fieldsToValidate.push("ownerId");

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) setStep(2);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) {
        setServerError(null);
        setStep(1);
        form.reset();
      }
    }}>
      <DialogTrigger asChild>

        <Button className="bg-primary text-primary-foreground hover:opacity-90">
          + Add Asset
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-125 border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="uppercase tracking-tighter font-black text-xl italic">Asset Commissioning</DialogTitle>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Protocol Step {step} of 2</p>
        </DialogHeader>

        {serverError && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 animate-in slide-in-from-top-2 duration-300">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="flex-1 font-medium text-xs leading-tight">
              {serverError}
            </div>
            <button type="button" onClick={() => setServerError(null)} className="p-1 hover:bg-red-100 rounded-md transition-colors">
              <X className="w-3.5 h-3.5 opacity-60 hover:opacity-100 transition-opacity" />
            </button>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">

                {isAdmin && (
                  <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                    <FormField
                      control={form.control}
                      name="ownerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                            <UserCircle className="w-3.5 h-3.5 text-primary" />
                            Target Ownership Entity
                          </FormLabel>

                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger
                                className="
    h-11
    bg-muted/40
    border border-border
    text-foreground
    text-sm
    font-medium
    rounded-md
    transition-all
    hover:bg-muted
    focus:ring-2
    focus:ring-primary/30
    focus:border-primary
  "
                              >
                                <SelectValue
                                  placeholder={
                                    loadingOwners
                                      ? "Syncing Owners..."
                                      : "Select Fleet Owner"
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>

                            <SelectContent className="bg-popover border border-border rounded-md shadow-lg">
                              {owners.map((owner: any) => (
                                <SelectItem
                                  key={owner.id}
                                  value={owner.id}
                                  className="
  py-2.5
  px-3
  text-sm
  cursor-pointer
  hover:bg-muted
  focus:bg-primary/10
  transition-colors
"
                                >
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-foreground">
                                      {owner.name}
                                    </span>

                                    <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                      {owner.email || owner.phone}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-[9px]" />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="plateNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Plate Number</FormLabel>
                        <FormControl><Input type="number" placeholder="123456" {...field} className={cn("h-9 font-mono font-bold", serverError?.includes("plate") && "border-red-500 bg-red-50 focus-visible:ring-red-500")} /></FormControl>
                        <FormMessage className="text-[9px]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Asset Class</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9 text-xs font-bold uppercase">
                              <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {["CAR", "TRUCK", "BUS", "MOTORCYCLE", "TRAILER"].map(t => <SelectItem key={t} value={t} className="text-xs font-bold">{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[9px]" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="make" render={({ field }) => (
                    <FormItem><FormLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Manufacturer</FormLabel><FormControl><Input placeholder="e.g. Toyota" {...field} className="h-9 text-xs font-bold" /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="model" render={({ field }) => (
                    <FormItem><FormLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Model</FormLabel><FormControl><Input placeholder="e.g. Hilux" {...field} className="h-9 text-xs font-bold" /></FormControl></FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="vin" render={({ field }) => (
                  <FormItem><FormLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">VIN / Chassis Number</FormLabel><FormControl><Input placeholder="Optional..." {...field} className="h-9 text-xs font-mono" /></FormControl></FormItem>
                )} />

                <Button type="button" className="w-full h-10 bg-primary text-primary-foreground hover:opacity-90 uppercase font-black text-[10px] tracking-[0.2em]" onClick={handleNextStep}>
                  Execute Phase II &rarr;
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <LayoutGrid className="w-4 h-4 text-primary" />
                    <FormLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Module Activation</FormLabel>
                  </div>
                  <ModuleCheckbox form={form} name="tracking" label="GPS Uplink" sub="SATELLITE POSITIONING" />
                  <ModuleCheckbox form={form} name="passKey" label="Biometric PassKey" sub="FACIAL AUTHENTICATION" />
                  <ModuleCheckbox form={form} name="governor" label="Speed Governor" sub="LIMIT ENFORCEMENT" />
                </div>

                <div className="flex gap-2 pt-4 border-t border-slate-100">
                  <Button type="button" variant="outline" className="flex-1 text-[10px] font-black uppercase tracking-widest h-10 hover:bg-slate-50" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button type="submit" className="flex-1 bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20 text-[10px] font-black uppercase tracking-widest h-10" disabled={mutation.isPending}>
                    {mutation.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : "Deploy Asset"}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ModuleCheckbox({ form, name, label, sub }: any) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem
          className="
            flex items-start gap-3
            p-4
            rounded-lg
            border border-border
            bg-card
            transition-all
            hover:bg-muted/40
            hover:border-primary/40
            cursor-pointer
            group
          "
        >
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
              className="
                mt-0.5
                border-border
                data-[state=checked]:bg-primary
                data-[state=checked]:border-primary
                data-[state=checked]:text-primary-foreground
              "
            />
          </FormControl>

          <div className="flex-1">
            <FormLabel
              className="
                text-sm
                font-semibold
                text-foreground
                cursor-pointer
                leading-none
              "
            >
              {label}
            </FormLabel>

            <p
              className="
                text-xs
                text-muted-foreground
                mt-1
                leading-snug
              "
            >
              {sub}
            </p>
          </div>
        </FormItem>
      )}
    />
  );
}