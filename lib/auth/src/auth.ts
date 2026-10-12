import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { oAuthProxy } from "better-auth/plugins";
import { Resend } from "resend";
import { dash } from "@better-auth/infra";
import { db, users, sessions, accounts, verifications } from "@workspace/db";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be set. Did you forget to provision it?`);
  }
  return value;
}

const webOrigins = (process.env["WEB_ORIGIN"] ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Constructed lazily (inside sendVerificationEmail below), not at module
// load — this file is a single shared module for the whole auth system, so
// requireEnv("RESEND_API_KEY") running at import time meant a missing key
// crashed email/password AND Google OAuth login, not just the verification
// feature it actually belongs to. A missing key now only breaks sending an
// actual verification email, the same way a missing SENTRY_DSN only
// disables error tracking rather than taking the server down (see
// artifacts/api-server/src/instrument.ts).
let resend: Resend | undefined;
function getResendClient(): Resend {
  if (!resend) {
    resend = new Resend(requireEnv("RESEND_API_KEY"));
  }
  return resend;
}
// Resend's sandbox-only default sender — works without any setup, but can
// only deliver to the email address on the Resend account itself until a
// real sending domain is verified there. Override once one exists.
const resendFromEmail = process.env["RESEND_FROM_EMAIL"] ?? "PetHealth <onboarding@resend.dev>";

const googleClientId = process.env["GOOGLE_CLIENT_ID"];
const googleClientSecret = process.env["GOOGLE_CLIENT_SECRET"];

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { users, sessions, accounts, verifications },
  }),
  secret: requireEnv("BETTER_AUTH_SECRET"),
  baseURL: requireEnv("BETTER_AUTH_URL"),
  trustedOrigins: webOrigins,
  emailAndPassword: {
    enabled: true,
    // A password account can't be trusted as "really belongs to this
    // email" until verification exists — see emailVerification below.
    // Google sign-in is unaffected: an OAuth provider's own confirmation
    // already satisfies this, better-auth doesn't re-require it there.
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    // Also fires on a blocked sign-in attempt (unverified account trying
    // to log in) — a built-in "forgot to check your email" recovery path
    // with no extra code needed here.
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    async sendVerificationEmail({ user, url }) {
      // resend.emails.send() doesn't throw on a rejected send (e.g.
      // sandbox mode refusing a non-owner recipient) — it resolves with
      // an `error` field instead, which silently does nothing unless
      // explicitly checked. Confirmed this the hard way: a real signup
      // reported success with no email ever sent and nothing logged
      // anywhere pointing at why.
      const { error } = await getResendClient().emails.send({
        from: resendFromEmail,
        to: user.email,
        subject: "Verify your email for PetHealth",
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h1 style="font-size: 20px;">Verify your email</h1>
            <p>Click the button below to verify ${user.email} and finish setting up your PetHealth account.</p>
            <p style="margin: 24px 0;">
              <a href="${url}" style="background: #0f766e; color: #fff; padding: 12px 20px; border-radius: 999px; text-decoration: none; font-weight: bold;">
                Verify email
              </a>
            </p>
            <p style="color: #666; font-size: 13px;">If you didn't create a PetHealth account, you can ignore this email.</p>
          </div>
        `,
      });
      if (error) {
        // Thrown so better-auth's own internal error handling logs it too
        // (confirmed in its source: this runs via runInBackgroundOrAwait,
        // which awaits this call inline — since advanced.backgroundTasks
        // isn't configured — and logger.errors whatever it throws). But
        // that's an internal implementation detail of a dependency we don't
        // control and could change on an update, so this is logged
        // directly here as well, not left solely to that assumption.
        console.error(`Resend failed to send a verification email to ${user.email}:`, error.message);
        throw new Error(`Resend failed to send a verification email to ${user.email}: ${error.message}`);
      }
    },
  },
  // Google "sign in with" button. Only turns on once its real credentials
  // are set — until then these env vars are unset and the provider is left
  // out entirely, so this is safe to deploy early.
  // Apple sign-in was dropped for now (needs a paid $99/year Apple Developer
  // account) — revisit if that becomes worth it.
  socialProviders: {
    ...(googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          },
        }
      : {}),
  },
  user: { modelName: "users" },
  session: { modelName: "sessions" },
  account: {
    modelName: "accounts",
    accountLinking: {
      // Google always reports email_verified: true for its standard
      // scope (confirmed against a real OAuth response, not assumed) —
      // explicit here anyway per better-auth's own docs example, rather
      // than relying silently on that external behavior staying true.
      trustedProviders: ["google"],
      // better-auth's default (true, i.e. this is left unset) requires the
      // *existing local* account's row to already have emailVerified: true
      // before letting a new OAuth sign-in attach to it — real protection
      // against someone pre-registering a password account at your email
      // (one they don't own), then you later inheriting their fake account
      // when you sign in with Google, while they still hold the password
      // they set.
      //
      // This was previously forced to `false`, from before this app had
      // any email verification at all — back then every local account's
      // emailVerified was permanently false, so leaving the real default
      // on would have blocked Google linking for every existing user, not
      // just guarded against the attack it's meant for. Now that
      // verification exists (see emailVerification above), that's no
      // longer true: every account that existed before verification
      // shipped was already one-time backfilled to emailVerified: true
      // directly in the database (86 users, confirmed only 1 was already
      // true before the backfill), so they're unaffected by the real
      // default. Only an account that hasn't actually verified — which,
      // post-backfill, means a brand new signup that skipped verification
      // — would now get blocked from linking, which is exactly the
      // protection this flag exists for. Using better-auth's real default
      // again instead of overriding it.
    },
  },
  verification: { modelName: "verifications" },
  advanced: {
    database: {
      generateId: "serial",
    },
  },
  plugins: [
    dash({
      apiKey: requireEnv("BETTER_AUTH_API_KEY"),
    }),
    // Fixes Google sign-in failing with a CSRF/state_mismatch error:
    // onrender.com is on the Public Suffix List, so this frontend
    // (pethealth-frontend.onrender.com) and this api-server
    // (pethealth-api-*.onrender.com) are different *sites* to the browser,
    // not just different origins. Google's OAuth callback redirects the
    // browser directly to this api-server's own address, bypassing the
    // frontend's same-origin /api/* proxy entirely — and a cookie set
    // during the earlier, proxied sign-in request (scoped to the
    // frontend's site) simply isn't sent back on that direct, cross-site
    // request. SameSite=Lax protects a cookie surviving a top-level
    // cross-site *navigation* (which is the normal OAuth redirect dance);
    // it does not protect one being set by a script-initiated cross-site
    // request, which is what directly calling this api-server's origin
    // from the frontend would be (confirmed the hard way: pointing the
    // frontend straight at this origin, with CORS and credentials: include
    // both correctly configured, still failed identically).
    //
    // oAuthProxy() sidesteps the problem instead of fighting it: rather
    // than depending on a cookie surviving the cross-site hop to Google and
    // back, it rides the OAuth state through an encrypted URL query
    // parameter — which isn't subject to any cookie policy at all, same-
    // site or not. The browser only sets a real cookie again at the very
    // end, once it's bounced back to the site sign-in actually started on
    // (see currentURL below), which is a same-site operation. This plugin
    // is built into better-auth itself (not @better-auth/infra) — its
    // README-documented use case is a changing preview-deploy URL, but the
    // actual mechanism it uses to solve that (never relying on a cookie
    // surviving a cross-origin/cross-site redirect) is exactly what this
    // app's permanent frontend/api-server split also needs.
    //
    // currentURL is set explicitly, rather than left to the plugin's own
    // auto-detection (which tries a few hosting-provider env vars, none of
    // which Render sets, before falling back to inferring it from the
    // incoming request) — WEB_ORIGIN is already the verified-correct
    // source of truth for exactly this value (see the api-server's own
    // CORS config, which trusts the same thing). productionURL is left
    // unset deliberately; it already defaults to BETTER_AUTH_URL, the same
    // value this file requires above.
    oAuthProxy({
      currentURL: webOrigins[0],
    }),
  ],
});
