'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { invitationService } from '@/services/invitation.service';
import { useAuthStore } from '@/store/useAuthStore';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const schema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const setAuth = useAuthStore((state) => state.setAuth);

  const [isValidating, setIsValidating] = useState(true);
  const [inviteData, setInviteData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('No invitation token found.');
      setIsValidating(false);
      return;
    }

    invitationService
      .validateToken(token)
      .then((res) => setInviteData(res))
      .catch((err) =>
        setError(
          err.response?.data?.message ||
          'Invalid or expired invitation.'
        )
      )
      .finally(() => setIsValidating(false));
  }, [token]);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { full_name: '', password: '' },
  });

  const onSubmit = async (values: any) => {
    try {
      const res = await invitationService.registerFromInvite({
        token: token!,
        ...values,
      });

      setAuth(res.user, res.access_token, '');
      toast.success('Account created successfully!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Registration failed'
      );
    }
  };

  if (isValidating)
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-sm px-6 py-6 text-center">
        <AlertCircle className="w-5 h-5" />
        <p className="font-medium">{error}</p>

        <Button
          variant="link"
          className="text-primary"
          onClick={() => router.push('/login')}
        >
          Back to Login
        </Button>
      </div>
    );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5"
      >
        <div className="rounded-lg border bg-muted/40 text-sm px-4 py-3">
          Registering as{' '}
          <span className="font-medium text-foreground">
            {inviteData?.role?.toUpperCase()}
          </span>
          <div className="text-muted-foreground text-xs mt-1">
            {inviteData?.email || inviteData?.phone}
          </div>
        </div>

        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="John Doe"
                  {...field}
                  className="h-11"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Create Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...field}
                  className="h-11"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full h-11"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            'Complete Registration'
          )}
        </Button>
      </form>
    </Form>
  );
}

export default function InvitationRegistrationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border shadow-sm">
        <CardHeader className="space-y-4 text-center">

          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>

          <div className="space-y-1">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Welcome to SM-ROD
            </CardTitle>

            <CardDescription className="text-sm">
              Finish setting up your account to get started.
            </CardDescription>
          </div>

        </CardHeader>

        <CardContent>
          <Suspense
            fallback={
              <div className="flex justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <RegisterForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}