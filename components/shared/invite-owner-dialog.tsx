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
import { Form, FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { invitationService } from "@/services/invitation.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, MailPlus, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// Schema WITHOUT name
const formSchema = z.object({
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  phone: z.string().min(10, "Phone number too short").optional().or(z.literal('')),
}).refine(data => data.email || data.phone, {
  message: "Provide either an email or phone number",
  path: ["email"],
});

type FormValues = z.infer<typeof formSchema>;

export function InviteOwnerDialog() {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", phone: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: any = { role: 'owner' };
      if (values.email) payload.email = values.email;
      if (values.phone) payload.phone = values.phone;

      return invitationService.createInvitation(payload);
    },
    onSuccess: (axiosResponse) => {
      queryClient.invalidateQueries({ queryKey: ["owners"] });

      // Axios puts the JSON in .data, and your backend puts the info in .data
      const jsonBody = axiosResponse; // if your service returns data directly
      const inviteData = jsonBody?.data || jsonBody;

      if (inviteData?.sentVia && inviteData.sentVia.length > 0) {
        // SMS/Email was successful
        toast.success("Invitation Sent", {
          description: `Link successfully sent via: ${inviteData.sentVia.join(', ')}`
        });
      } else {
        // SMS/Email failed, but invitation is in the database
        toast.warning("Invite Created (SMS/Mail Offline)", {
          description: `Server could not send message. Manual link generated.`,
          duration: 8000,
        });

        // Show the manual link inside the dialog before closing
        const manualLink = `http://localhost:3000/register?token=${inviteData?.token}`;
        console.log("MANUAL LINK:", manualLink);
        alert(`Message system offline. Copy this link to register:\n\n${manualLink}`);
      }

      setOpen(false);
      form.reset();
      setServerError(null);
    },
    onError: (error: any) => {
      console.error("Invite Error:", error);

      // Extract specific backend error details
      const status = error.response?.status;
      // Depending on NestJS setup, error message could be in data.message or data.error.message
      const backendMessage = error.response?.data?.error?.message || error.response?.data?.message;

      // Handle specific HTTP Status Codes
      if (status === 409) {
        setServerError("An active invitation already exists for this email or phone number.");
      } else if (status === 403) {
        setServerError("Access Denied: You do not have permission to invite owners.");
      } else if (status === 500) {
        setServerError("Internal Server Error: The backend crashed trying to process this request.");
      } else if (!error.response) {
        setServerError("Network Error: Could not reach the server. Check your connection or CORS.");
      } else {
        setServerError(backendMessage || "An unexpected error occurred.");
      }

      toast.error("Failed to generate invitation");
    }
  });

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) {
        setServerError(null); // Clear errors when closed
        form.reset();
      }
      setOpen(val);
    }}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:opacity-90">
          <MailPlus className="mr-2 h-4 w-4" /> Invite New Owner
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border border-border shadow-xl">
        <DialogHeader>
          <DialogTitle>Invite Vehicle Owner</DialogTitle>
          <DialogDescription>
            The owner will receive a secure link to set up their account.
          </DialogDescription>
        </DialogHeader>

        {/* --- INLINE ERROR MESSAGE --- */}
        {serverError && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg flex items-start gap-3 text-sm mb-2 animate-in fade-in zoom-in duration-200">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="font-medium">{serverError}</p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl><Input placeholder="owner@company.com" {...field} /></FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Controller
              control={form.control}
              name="phone"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl><Input placeholder="+251..." {...field} /></FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:opacity-90 mt-2 h-11"
              disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "Generate Invite Link"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}