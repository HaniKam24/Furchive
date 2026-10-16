import { useState } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { HeartPulse, UserPlus, MailCheck } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { signUp, authClient } from '@/lib/auth-client';
import SocialSignInButtons from '@/components/social-sign-in-buttons';

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
  agreedToTerms: z.boolean().refine((v) => v === true, {
    message: 'You need to agree to the Terms of Service and Privacy Policy to create an account',
  }),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function Signup() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [formError, setFormError] = useState<string | null>(null);
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [resendError, setResendError] = useState<string | null>(null);

  // Deliberately read from the URL (?awaitingVerification=...), not local
  // component state. better-auth's client appears to trigger a session
  // re-check right after sign-up/sign-in completes (to keep useSession() in
  // sync) — App.tsx's Router briefly shows its full-page loader while that
  // re-check is in flight, which unmounts and remounts this component,
  // silently wiping any local useState. Confirmed the hard way: console
  // logs showed setAwaitingVerificationEmail firing exactly once, correctly,
  // immediately followed by a remount that reverted the screen to the blank
  // form with no error anywhere. A URL param survives that remount, since
  // it's re-read from scratch on every render rather than carried in memory.
  const awaitingVerificationEmail = new URLSearchParams(search).get('awaitingVerification');

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '', agreedToTerms: false },
  });
  const agreedToTerms = form.watch('agreedToTerms');

  const onSubmit = async (values: SignupFormValues) => {
    setFormError(null);
    const { data, error } = await signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
      callbackURL: `${window.location.origin}/`,
    });

    if (error) {
      setFormError(error.message ?? 'Could not create your account.');
      return;
    }

    if (!data.token) {
      setLocation(`/signup?awaitingVerification=${encodeURIComponent(values.email)}`);
      return;
    }

    setLocation('/');
  };

  const handleResend = async () => {
    if (!awaitingVerificationEmail) return;
    setResendState('sending');
    setResendError(null);
    // Matches the {data, error} shape signUp.email already uses above —
    // better-auth's client resolves with an `error` field on failure
    // rather than rejecting, same reasoning as resend.emails.send() in
    // lib/auth/src/auth.ts. The try/catch is a defensive fallback in case
    // it ever does reject instead; without either, a failure left this
    // button stuck on "Sending…" forever with no way to retry.
    try {
      const { error } = await authClient.sendVerificationEmail({
        email: awaitingVerificationEmail,
        callbackURL: `${window.location.origin}/`,
      });
      if (error) {
        setResendState('idle');
        setResendError(error.message ?? 'Could not resend the verification email.');
        return;
      }
      setResendState('sent');
    } catch (err) {
      setResendState('idle');
      setResendError(err instanceof Error ? err.message : 'Could not resend the verification email.');
    }
  };

  if (awaitingVerificationEmail) {
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
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <MailCheck size={24} />
              </div>
              <h1 className="text-xl font-serif font-medium text-foreground">Check your email</h1>
              {/* Deliberately doesn't claim "we just sent you a link" — if this
                  email already has an unverified account, better-auth's
                  sign-up/email silently sends nothing here (same generic
                  response either way, so a prior signup attempt at this
                  address can't be detected from the outside). The Resend
                  button below is the one path guaranteed to actually send,
                  so the copy points there instead of promising an email that
                  may not exist yet. */}
              <p className="text-muted-foreground text-sm">
                Click the verification link for{' '}
                <span className="font-medium text-foreground">{awaitingVerificationEmail}</span> to finish creating
                your account. Don't see it? Use the button below to send a fresh one.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full mt-2"
                disabled={resendState === 'sending'}
                onClick={handleResend}
              >
                {resendState === 'sent' ? 'Email sent' : resendState === 'sending' ? 'Sending…' : 'Resend email'}
              </Button>
              {resendError && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{resendError}</p>
              )}
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
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
            <h1 className="text-2xl font-serif font-medium text-foreground">Create your account</h1>
            <p className="text-muted-foreground text-sm mt-1">Up to 3 pets, one place for their whole history.</p>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your name</FormLabel>
                      <FormControl>
                        <Input autoComplete="name" placeholder="Jamie Rivera" className="h-11 rounded-full" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" autoComplete="email" placeholder="you@example.com" className="h-11 rounded-full" {...field} />
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
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="new-password" className="h-11 rounded-full" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="agreedToTerms"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-start gap-2.5">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="mt-0.5"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal text-muted-foreground leading-snug">
                          I agree to the{' '}
                          <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-foreground underline hover:text-primary">
                            Terms of Service
                          </Link>{' '}
                          and{' '}
                          <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="text-foreground underline hover:text-primary">
                            Privacy Policy
                          </Link>
                        </FormLabel>
                      </div>
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
                  <UserPlus size={18} />
                  Create account
                </Button>
              </form>
            </Form>

            <div className="mt-6">
              <SocialSignInButtons disabled={!agreedToTerms} />
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
