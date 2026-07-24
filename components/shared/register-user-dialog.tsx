"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  registerUserSchema,
  RegisterUserFormValues,
} from "@/schemas/register-user-schema";
import api from "@/lib/axios";
import { toast } from "sonner"; // Ensure this is imported

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

interface RegisterUserDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function RegisterUserDialog({
  open,
  onClose,
}: RegisterUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { user } = useAuthStore(); 

  const form = useForm<RegisterUserFormValues>({
    resolver: zodResolver(registerUserSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      role: "driver",
      securityQuestion: "",
      securityAnswer: "",
    },
  });

  const onSubmit = async (values: RegisterUserFormValues) => {
    setServerError(null); // Reset error state
    try {
      setLoading(true);

      // 1. Clean the payload (Do NOT send ownerId, and remove empty email/phone)
      const payload: any = {
        name: values.name,
        password: values.password,
        role: values.role,
        securityQuestion: values.securityQuestion,
        securityAnswer: values.securityAnswer,
      };

      if (values.email) payload.email = values.email;
      if (values.phone) payload.phone = values.phone;

      // 2. Make the request
      await api.post("/auth/register-direct", payload);

      // 3. Show Success Message
      toast.success("User successfully registered", {
        description: `${values.name} can now log in to the platform.`,
      });

      // 4. Reset and Close
      form.reset();
      onClose();
    } catch (error: any) {
      console.error(error);

      // Handle specific error codes
      const status = error.response?.status;
      const backendMessage = error.response?.data?.message;

      if (status === 403) {
        setServerError("Access Denied: You do not have permission to register users directly. Only Owners can perform this action.");
      } else if (status === 409) {
        setServerError("A user with this email or phone already exists.");
      } else {
        setServerError(backendMessage || "An unexpected error occurred. Please try again.");
      }

      toast.error("Registration Failed");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) {
        setServerError(null);
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-137.5">
        <DialogHeader>
          <DialogTitle>Register New Driver</DialogTitle>
        </DialogHeader>

        {/* --- UI ERROR MESSAGE BOX --- */}
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3 text-sm animate-in fade-in zoom-in duration-200">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{serverError}</p>
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Controller
              control={form.control}
              name="name"
              render={({ field }) => <Input placeholder="Full Name" {...field} />}
            />
            <Controller
              control={form.control}
              name="role"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="driver">Driver</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Controller
              control={form.control}
              name="email"
              render={({ field }) => <Input type="email" placeholder="Email (optional)" {...field} />}
            />
            <Controller
              control={form.control}
              name="phone"
              render={({ field }) => <Input placeholder="Phone (optional)" {...field} />}
            />
          </div>

          <Controller
            control={form.control}
            name="password"
            render={({ field }) => <Input type="password" placeholder="Temporary Password" {...field} />}
          />

          <div className="p-4 bg-slate-50 rounded-lg space-y-3 border">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Security Question (For Identity Recovery)</p>
            <Controller
              control={form.control}
              name="securityQuestion"
              render={({ field }) => <Input className="bg-white" placeholder="Secret Question (e.g. First pet's name)" {...field} />}
            />
            <Controller
              control={form.control}
              name="securityAnswer"
              render={({ field }) => <Input className="bg-white" placeholder="Secret Answer" {...field} />}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 h-11">
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Registering...</>
            ) : (
              "Complete Registration"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}