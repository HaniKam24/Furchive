import { createAuthClient } from 'better-auth/react';
import { sentinelClient } from '@better-auth/infra/client';

// sentinelClient() is the browser half of the server's dash() plugin
// (lib/auth/src/auth.ts) — it fingerprints the visitor and solves any
// proof-of-work challenge the server issues, attaching the result as
// headers on auth requests. Without it, the dash plugin's security checks
// (bot/credential-stuffing detection) still run server-side, just with no
// visitor identification to work from. Added per the Better Auth
// dashboard's own setup instructions, which this had been missing.
export const authClient = createAuthClient({
  plugins: [sentinelClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
