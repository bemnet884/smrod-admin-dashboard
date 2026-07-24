'use client';

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Plus, Loader2, Phone, Mail } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { hospitalService } from "@/services/hospital.service";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(2, "Hospital name required"),
  address: z.string().min(5, "Address required"),
  phone: z.string().min(10, "Valid phone required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  latitude: z.string().refine((val) => !isNaN(Number(val)), "Invalid latitude"),
  longitude: z.string().refine((val) => !isNaN(Number(val)), "Invalid longitude"),
});

export function CreateHospitalDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      email: "",
      latitude: "",
      longitude: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: any) =>
      hospitalService.createHospital({
        ...values,
        latitude: Number(values.latitude),
        longitude: Number(values.longitude),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospitals"] });
      toast.success("Facility Commissioned", {
        description: "Hospital added to emergency network.",
      });
      setOpen(false);
      form.reset();
    },
    onError: (err: any) =>
      toast.error("Deployment failed", { description: err.message }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* TRIGGER */}
      <DialogTrigger asChild>
        <Button
          variant="default"
          size="sm"
          className="uppercase tracking-widest text-[11px] font-semibold glow-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Register Facility
        </Button>
      </DialogTrigger>

      {/* CONTENT */}
      <DialogContent className="sm:max-w-[520px] glass">

        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-tight">
            Register Hospital
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            className="space-y-5 pt-2"
          >

            {/* NAME */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Hospital Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. St. Paul's Hospital"
                      {...field}
                      className="h-10"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* CONTACT */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <Phone className="w-3 h-3" />
                      Emergency Phone
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="+251..." {...field} className="h-10" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <Mail className="w-3 h-3" />
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="admin@hospital.com"
                        {...field}
                        className="h-10"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* ADDRESS */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Physical Address
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Street, City" {...field} className="h-10" />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* COORDINATES */}
            <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-xl border border-border">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Latitude
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="h-9 text-sm font-mono"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Longitude
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="h-9 text-sm font-mono"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* SUBMIT */}
            <Button
              type="submit"
              className="w-full uppercase tracking-widest text-[11px] font-semibold glow-primary"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                "Deploy Facility"
              )}
            </Button>

          </form>
        </Form>

      </DialogContent>
    </Dialog>
  );
}