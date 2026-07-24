'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.login(values);

      if (response.user.role.toLowerCase() === 'driver') {
        setError('Access Denied: Drivers must use the mobile application.');
        setIsLoading(false);
        return;
      }

      setAuth(response.user, response.accessToken, response.refreshToken);
      router.push('/dashboard');

    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">

      <Card className="w-full max-w-md border shadow-sm">

        {/* HEADER */}

        <CardHeader className="space-y-4">

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>

            <span className="text-sm font-semibold tracking-tight">
              SM-ROD AI
            </span>
          </div>

          <div className="space-y-1">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Sign in
            </CardTitle>

            <CardDescription className="text-sm">
              Enter your credentials to access the dashboard.
            </CardDescription>
          </div>

        </CardHeader>

        {/* BODY */}

        <CardContent>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5"
            >

              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-sm px-4 py-3">
                  {error}
                </div>
              )}

              {/* EMAIL */}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>

                    <FormControl>
                      <Input
                        placeholder="admin@example.com"
                        {...field}
                        disabled={isLoading}
                        className="h-11"
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* PASSWORD */}

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>

                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>

                      <Link
                        href="/forgot-password"
                        className="text-sm text-muted-foreground hover:text-primary"
                      >
                        Forgot?
                      </Link>
                    </div>

                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        disabled={isLoading}
                        className="h-11"
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* BUTTON */}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>

            </form>
          </Form>

        </CardContent>

      </Card>

    </div>
  );
}