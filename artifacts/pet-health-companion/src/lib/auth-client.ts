import { createAuthClient } from 'better-auth/react';
import { sentinelClient } from '@better-auth/infra/client';

// Deliberately NOT a relative/same-origin request, unlike every other API
// call this app makes. Without this, auth requests go through Render's
// static-site rewrite proxy (/api/* -> the api-server), which means the
// browser sees the response — and any Set-Cookie it carries — as having
// come from *this* frontend's own origin. That's invisible for ordinary
// session cookies, but breaks Google sign-in specifically: Google's OAuth
// callback redirects the browser directly to the api-server's own real
// address (registered in Google Cloud Console), bypassing the proxy
// entirely. The short-lived "state" cookie better-auth sets right before
// redirecting to Google — scoped to the frontend's origin by the proxied
// request — then simply doesn't exist on the api-server's distinct origin
// when Google sends the browser back, and better-auth rejects the
// callback as a CSRF mismatch (confirmed directly: replaying the exact
// cookie straight to the api-server's callback endpoint verifies cleanly;
// the proxied version of the same request scopes the cookie to the wrong
// origin instead, confirmed by inspecting the actual Set-Cookie response).
//
// Pointing this client directly at the api-server's own origin keeps the
// whole OAuth round trip — and its cookie — on one consistent origin from
// the start, the same one Google redirects back to. This isn't a new
// capability bolted on: the api-server's CORS config already explicitly
// allows credentialed cross-origin requests from this frontend's origin
// (see artifacts/api-server/src/app.ts's `cors` setup, driven by the same
// WEB_ORIGIN env var as better-auth's own trustedOrigins) — this was
// already supported, just never actually used by the frontend until now.
//
// Falls back to the default same-origin/relative behavior (via the proxy)
// if the env var isn't set, so a missing VITE_API_BASE_URL fails safe —
// email/password auth keeps working exactly as before, only the Google
// sign-in cookie-origin fix is lost until it's configured.
const apiBaseURL = import.meta.env.VITE_API_BASE_URL || undefined;

// sentinelClient() is the browser half of the server's dash() plugin
// (lib/auth/src/auth.ts) — it fingerprints the visitor and solves any
// proof-of-work challenge the server issues, attaching the result as
// headers on auth requests. Without it, the dash plugin's security checks
// (bot/credential-stuffing detection) still run server-side, just with no
// visitor identification to work from. Added per the Better Auth
// dashboard's own setup instructions, which this had been missing.
export const authClient = createAuthClient({
  baseURL: apiBaseURL,
  plugins: [sentinelClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
