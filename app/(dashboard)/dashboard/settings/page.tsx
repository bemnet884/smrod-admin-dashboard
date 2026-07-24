'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Lock, Bell, Loader2, Save, Shield } from 'lucide-react';
import { userService } from '@/services/user.service';
import { toast } from 'sonner';

// --- SCHEMAS ---
const profileSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password required"),
  newPassword: z.string().min(6, "Min 6 characters"),
  confirmPassword: z.string().min(6, "Min 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  // --- FORMS ---
  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
    }
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" }
  });

  // --- HANDLERS ---
  const onUpdateProfile = async (values: any) => {
    if (!user?.id) return;
    setLoadingProfile(true);
    try {
      // Call API
      await userService.updateUser(user.id, values);

      // Update Local State
      updateUser(values);

      toast.success("Profile Updated", { description: "Your details have been saved." });
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setLoadingProfile(false);
    }
  };

  const onChangePassword = async (values: any) => {
    if (!user?.id) return;
    setLoadingPassword(true);
    try {
      await userService.changePassword(user.id);
      toast.success("Password Changed", { description: "You can use your new password next time." });
      passwordForm.reset();
    } catch (error) {
      toast.error("Failed to change password");
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Account Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your profile information and security preferences.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">

        {/* --- LEFT COL: PROFILE --- */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-primary" /> Public Profile
              </CardTitle>
              <CardDescription>Your basic account information.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-16 w-16 border-2 border-slate-100">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xl font-bold">
                    {user?.name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-foreground">{user?.name}</h3>
                  <Badge variant="outline" className="bg-slate-50 text-slate-600 capitalize mt-1">
                    {user?.role?.toLowerCase()}
                  </Badge>
                </div>
              </div>

              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-4">
                  <FormField control={profileForm.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-1">
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <Input value={user?.email} disabled className="bg-slate-50 text-muted-foreground" />
                      <p className="text-[10px] text-muted-foreground">Email cannot be changed manually.</p>
                    </FormItem>
                  </div>

                  <FormField control={profileForm.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl><Input placeholder="+251..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button type="submit" className="bg-slate-900 hover:bg-slate-800 w-full" disabled={loadingProfile}>
                    {loadingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* --- NOTIFICATIONS --- */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="w-5 h-5 text-orange-500" /> Notifications
              </CardTitle>
              <CardDescription>Manage how we communicate with you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Critical Security Alerts</p>
                  <p className="text-xs text-muted-foreground">Receive SMS for thefts/crashes.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Email Reports</p>
                  <p className="text-xs text-muted-foreground">Weekly fleet summaries.</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- RIGHT COL: SECURITY --- */}
        <div className="space-y-6">
          <Card className="border-red-100 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lock className="w-5 h-5 text-red-600" /> Security
              </CardTitle>
              <CardDescription>Ensure your account stays safe.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
                  <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl><Input type="password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Separator />
                  <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl><Input type="password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl><Input type="password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button type="submit" variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50" disabled={loadingPassword}>
                    {loadingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="bg-slate-50 border-slate-200">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Shield className="w-4 h-4" /> Account Role
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span className="font-medium text-foreground capitalize">{user?.role}</span>
                {user?.role?.toLowerCase() === 'admin' && (
                  <Badge className="bg-violet-600">Superuser</Badge>
                )}
                {user?.role?.toLowerCase() === 'owner' && (
                  <Badge className="bg-emerald-600">Fleet Owner</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Your role determines your access level to vehicles, drivers, and financial data.
              </p>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}