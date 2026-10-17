import { createAuthClient } from 'better-auth/react';
import { sentinelClient } from '@better-auth/infra/client';

// Deliberately back to the default same-origin/relative behavior (via
// Render's /api/* rewrite proxy), same as every other request this app
// makes — NOT pointed directly at the api-server's own origin. An earlier
// version of this file did that, to fix Google sign-in's state_mismatch
// error, reasoning that the OAuth state cookie needed to be scoped to
// wherever Google's callback redirects to. That was correct as far as it
// went, but incomplete: onrender.com is on the Public Suffix List, so
// furchive-frontend.onrender.com and the api-server's own
// furchive-api-*.onrender.com are different *sites* to the browser, not
// just different origins — and modern Chrome blocks a cookie from being
// *set* by a cross-site background fetch/XHR outright, regardless of
// CORS or `credentials: include` (confirmed: the fix deployed correctly,
// the request correctly targeted the api-server directly, and Google
// sign-in still failed the same way). SameSite=Lax protects a cookie set
// via a real top-level navigation across sites; it does not protect one
// set via a script-initiated request, which is exactly what a direct
// cross-origin authClient call is.
//
// The actual fix is server-side: see oAuthProxy() in lib/auth/src/auth.ts,
// which avoids depending on any cookie surviving the cross-site round
// trip through Google at all — it rides the OAuth state through an
// encrypted URL parameter instead, which isn't subject to cookie policy.
// That only works correctly if sign-in requests keep arriving same-site
// (via this proxy), which is what this file reverts to.

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
