import { useState } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { HeartPulse, ShieldAlert } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { authClient } from '@/lib/auth-client';

const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(8, 'Use at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const search = useSearch();
  const [formError, setFormError] = useState<string | null>(null);

  // better-auth's own emailed link redirects here as
  // /reset-password?token=... on success, or ?error=INVALID_TOKEN if the
  // token was already used or expired — read straight from the URL rather
  // than component state so a page refresh doesn't lose it.
  const params = new URLSearchParams(search);
  const token = params.get('token');
  const linkInvalid = !token || params.get('error') === 'INVALID_TOKEN';

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!token) return;
    setFormError(null);
    const { error } = await authClient.resetPassword({
      newPassword: values.newPassword,
      token,
    });

    if (error) {
      setFormError(error.message ?? 'Could not reset your password — try requesting a fresh link.');
      return;
    }

    toast({ title: 'Password updated', description: 'Sign in with your new password.' });
    setLocation('/login');
  };

  if (linkInvalid) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <HeartPulse size={24} strokeWidth={2.5} />
            </div>
            <span className="font-serif text-2xl font-medium text-foreground tracking-tight">Furchive</span>
          </div>

          <Card className="rounded-3xl shadow-sm">
            <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                <ShieldAlert size={24} />
              </div>
              <h1 className="text-xl font-serif font-medium text-foreground">This link isn't valid</h1>
              <p className="text-muted-foreground text-sm">
                It may have already been used, or it's expired (links last an hour). Request a fresh one below.
              </p>
              <Link href="/forgot-password" className="mt-2">
                <Button type="button" variant="outline" size="sm" className="rounded-full">
                  Request a new link
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <HeartPulse size={24} strokeWidth={2.5} />
          </div>
          <span className="font-serif text-2xl font-medium text-foreground tracking-tight">Furchive</span>
        </div>

        <Card className="rounded-3xl shadow-sm">
          <CardHeader className="text-center pb-2">
            <h1 className="text-2xl font-serif font-medium text-foreground">Choose a new password</h1>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New password</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="new-password" className="h-11 rounded-full" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm new password</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="new-password" className="h-11 rounded-full" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {formError && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{formError}</p>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full rounded-full"
                  disabled={form.formState.isSubmitting}
                >
                  Update password
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
