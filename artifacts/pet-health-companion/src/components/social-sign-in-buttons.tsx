import { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';

// On the signup page, Google sign-in creates an account exactly like the
// email form does — so it needs the same "agreed to the Terms" gate, not
// just the email path. `disabled` lets the signup page block it until the
// checkbox is checked; the login page (existing users, not account
// creation) renders this with no `disabled` prop and gets the old behavior.
export default function SocialSignInButtons({ disabled = false }: { disabled?: boolean }) {
  const [error, setError] = useState<string | null>(null);

  const signInWithGoogle = async () => {
    setError(null);
    // Must be absolute, not a bare "/" — the OAuth round-trip leaves the
    // page entirely (redirects to Google and back), so this redirect is
    // issued server-side after the callback completes. A relative path
    // resolves against the *api-server's* own origin there, not the
    // frontend's, landing on a 404 (confirmed: the server has no route
    // for a bare GET /). window.location.origin gives the frontend's
    // real origin in every environment without hardcoding it.
    const { error: signInError } = await authClient.signIn.social({
      provider: 'google',
      callbackURL: `${window.location.origin}/`,
    });

    if (signInError) {
      setError(signInError.message ?? 'Could not sign in with Google.');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or continue with</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full h-11 rounded-full"
        onClick={signInWithGoogle}
        disabled={disabled}
      >
        <FcGoogle size={18} />
        Google
      </Button>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
      )}
    </div>
  );
}
