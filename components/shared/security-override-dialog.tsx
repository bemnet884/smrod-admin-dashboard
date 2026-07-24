'use client';

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ShieldAlert, Loader2, AlertCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";

const formSchema = z.object({
  answer: z.string().min(1, "Please provide your security answer"),
});

type FormValues = z.infer<typeof formSchema>;

interface SecurityOverrideDialogProps {
  vehicleId: string;
  plateNumber: string; // Just to display in the UI for clarity
}

export function SecurityOverrideDialog({ vehicleId, plateNumber }: SecurityOverrideDialogProps) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { answer: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => authService.securityOverride(vehicleId, values.answer),
    onSuccess: (data) => {
      toast.success("Security Override Successful", {
        description: data?.message || "Emergency command dispatched to the vehicle.",
      });
      setOpen(false);
      form.reset();
      setServerError(null);
    },
    onError: (error: any) => {
      console.error(error);
      const status = error.response?.status;

      if (status === 401) {
        setServerError("Invalid security answer. Please try again.");
      } else if (status === 403) {
        setServerError("Access Denied: You are not authorized to override this vehicle.");
      } else {
        setServerError(error.response?.data?.message || "An unexpected error occurred.");
      }
    }
  });

  const onSubmit = (values: FormValues) => {
    setServerError(null);
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) {
        setServerError(null);
        form.reset();
      }
      setOpen(val);
    }}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="shadow-lg shadow-red-500/20">
          <ShieldAlert className="w-4 h-4 mr-2" /> Emergency Override
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-red-600 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" />
            Security Override
          </DialogTitle>
          <DialogDescription>
            You are initiating an emergency command for vehicle <strong>{plateNumber}</strong>.
            This action requires your security answer to bypass normal authentications.
          </DialogDescription>
        </DialogHeader>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3 text-sm animate-in fade-in zoom-in duration-200">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="font-medium">{serverError}</p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <Controller
              control={form.control}
              name="answer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-bold">Security Answer</FormLabel>
                  <Input
                    type="password"
                    placeholder="Enter your secret answer..."
                    {...field}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                className="flex-1"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
                ) : (
                  "Execute Override"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}