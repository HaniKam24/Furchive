# Compliance & Privacy — Working Notes

**This is not legal advice, and nothing in this file is a compliance claim made to
users.** It's an engineering-facing working document: what data this app actually
collects, where it actually flows, what's already in place, and what's genuinely
missing. Before anything here gets turned into a public privacy policy or an actual
compliance claim, get a real privacy/legal professional to review it — especially
before marketing to or signing up users in the EU (GDPR), California (CCPA/CPRA),
or any jurisdiction with its own rules.

Last verified against the codebase: 2026-10-11. (Previous verification was 2026-10-08 —
two real sub-processors, Google sign-in and the Better Auth dashboard, were merged
2026-10-09 and this doc wasn't updated for them until now. Caught while fact-checking
the new privacy policy page against the actual code — see gap #1. Same 2026-10-11
session also added the Terms of Service — gap #12 — and gated signup on agreeing
to both documents.)

## 1. What data this app actually collects

**Account data:** name, email, password (hashed, never stored in plain text — see
`lib/auth/src/auth.ts`, handled by better-auth).

**Pet data:** name, species, breed, sex, birth date, weight, photo, free-text notes,
vet contact info (name, clinic, phone, address).

**Health data:** health records (visit/vaccine/lab/surgery/note, each with an
optional uploaded document or linked URL), medications (dose, schedule), symptom
logs and structured symptom journal entries (appetite, energy, stool quality,
vomiting, limping, behavior notes), weight logs.

**AI interaction data:** every Pawlie conversation — the owner's question and the
full generated answer — stored indefinitely per pet (`insights` table), plus any
AI-proposed action (`ai_actions`) and its outcome.

**Uploaded documents:** vet reports/invoices (PDF or image), stored in a private
Supabase Storage bucket. Pet photos, stored in a separate public bucket (see
`lib/storage.ts` — this split is deliberate, see §3 below).

**Sitter-sharing data:** when an owner creates a share link, a subset of the above
becomes viewable by anyone with the link — no account required on the sitter's end.
Re-checked directly against `/share/:token`'s actual response shape in
`share-links.ts` (the previous note here — "vet and emergency vet contacts,
allergies, critical-info summary/details, active medications, and
feeding/handling/routine notes" — was still an undercount, missed while fixing the
privacy policy's wording to match the same route): the response also includes the
pet's name, species, sex, breed, color, weight, microchip ID, and photo, plus the
general free-text `notes` field — not just the dedicated sitter-brief fields. Links
are read-only, expire, and can be revoked.

**Technical/session data:** the auth session cookie, server request logs
(deliberately minimal — method, path, status code only; no headers or request
bodies logged, see `app.ts`'s `pinoHttp` config). Since adding Sentry (PR #79),
error reports may include an IP-derived approximate geographic location — see the
open question in §5.

**Sign-in data (new, PR #82):** if someone uses "Sign in with Google," better-auth
receives their Google name, email, and profile photo to create/link the account —
no password is stored for these accounts since Google handled that authentication.

**Auth security/monitoring data (new, PR #81):** the `@better-auth/infra` `dash()`
plugin connects this app's login system to Better Auth's own hosted dashboard
(`dash.better-auth.com`) for sign-in monitoring and abuse detection. Confirmed by
reading the plugin's bundled source, not assumed: it sends account email, sign-in/
sign-up/password-change/account-linking event types, and — on every auth request,
not just failures — the requester's IP address and a `visitorId` fingerprint, to a
real-time `/security/check` endpoint for bot/credential-stuffing detection. On a
failed login specifically, it also sends an HMAC-keyed fingerprint of the attempted
password (keyed by the API key, not the raw password or a reversible hash) to check
it against known-breached-password lists — this is a privacy-preserving technique,
not the actual password leaving our infrastructure. Our own database (via
`drizzleAdapter`) remains the only place the real password hash is stored. Not
exhaustively reverse-engineered beyond this — worth asking Better Auth directly for
a full data-flow description if this needs to be stated with full precision later.

## 2. Who else this data flows to (sub-processors)

| Service | What it receives | Why |
|---|---|---|
| **Supabase** | All of §1 — it's the database and file storage | Primary data store |
| **Anthropic (Claude API)** | Pet records relevant to a Pawlie question or Smart Upload document, sent as part of the AI prompt | Powers Pawlie chat and document extraction |
| **Render** | Everything, as the hosting platform | Runs the app |
| **Sentry** | Error reports: stack traces, request context, approximate IP-derived location (see §5) | Error tracking (PR #79) |
| **Google** (sign-in) | Name, email, profile photo on "Sign in with Google" (PR #82) | Social login |
| **Better Auth** (infra dashboard) | Account email, auth event types, IP address, visitor fingerprint; an HMAC password fingerprint on failed logins (see §1) (PR #81) | Sign-in security monitoring |

~~**Google Fonts** — visitor IP address, a side effect of loading fonts live from
`fonts.googleapis.com`.~~ **Removed** (PR #83) — fonts are now self-hosted, so this
is no longer a sub-processor relationship at all, not just a fixed problem with one.

Anthropic receiving real pet health data as part of every Pawlie/Smart-Upload call
is worth being deliberately aware of — it's the one sub-processor relationship where
actual health content (not just account metadata) leaves Supabase and goes to a
third party on every AI interaction. This is inherent to how the AI features work,
not a bug, but it belongs in any real privacy policy's sub-processor list.

**Google is a different kind of relationship than the other five.** Checked
directly against Google's own API Terms of Service: for "Sign in with Google,"
Google and Furchive are each treated as independent data controllers under the
"Google Controller-Controller Data Protection Terms," not a processor relationship
— unlike Supabase/Anthropic/Render/Sentry/Better Auth, where we're the controller
and they process data on our behalf. This matters because it means the usual
"get a DPA" step (§4b, §5 gap #10) doesn't apply to Google the same way — there's a
different, already-existing Google legal framework governing this instead, not a
gap to close.

## 3. What's already in place (verified, not assumed)

- Every pet-scoped database query is checked against the authenticated owner —
  confirmed by reviewing all ~50 API routes, not just spot-checked.
- Vet documents (the actually sensitive uploads) live in a **private** storage
  bucket behind short-lived (1-hour) signed URLs, minted fresh per view — never a
  long-lived link. Pet photos are deliberately in a separate **public** bucket,
  since they're not sensitive and need to load repeatedly without re-signing.
- Sitter share links are read-only, have an expiration date, and can be revoked
  early by the owner.
- Pet-level deletion exists today: an owner can remove a pet's profile and its
  records from the profile page.
- Passwords are hashed, never stored or logged in plain text.
- CORS, security headers, rate limiting, and known dependency vulnerabilities were
  hardened in PR #78 — see that PR for detail.
- Session cookie flags (`HttpOnly`, `Secure` in production, `SameSite=Lax`) were
  verified correct by reading the actual auth library's source, not just assumed.
- A real, published Privacy Policy now exists at `/privacy`, linked from both the
  logged-out homepage footer and the logged-in account menu — resolves most of gap
  #1 and all of gap #7 below. Still a first draft; see gap #1 for what's left.

## 4. Regulatory landscape — what likely applies

- **HIPAA — does not apply.** HIPAA covers human health information held by
  covered entities (providers, insurers, etc.). Pet/veterinary data isn't in scope.
  Already correctly noted in `docs/PRD.md`.
- **COPPA (children's privacy)** — likely not applicable; this app isn't directed
  at or knowingly collecting from children. Worth a deliberate "13+ only" statement
  in terms of service if one ever gets written, mostly as a formality.
- **State-level veterinary/pet-data-specific rules** — none identified. This is a
  consumer record-keeping app, not a licensed veterinary practice or pharmacy, so
  veterinary-practice-specific regulation likely doesn't apply, but this hasn't
  been researched deeply and isn't a legal conclusion.

### 4a. USA specifics

- **No single comprehensive federal privacy law.** The US regulates privacy
  sector-by-sector (HIPAA for health, COPPA for kids, GLBA for financial) plus one
  broad catch-all: **the FTC Act's ban on "unfair or deceptive practices."** In
  practice, this means: once a privacy policy exists and makes promises, the FTC
  can enforce against the company for not actually following them. Reason to write
  one carefully, not a reason to avoid writing one.
- **Every US state now has a data breach notification law** — if personal data is
  ever breached, there's a legal obligation to notify affected individuals (and
  sometimes the state AG) within a set window, commonly 30–60 days depending on
  the state. This applies *regardless of company size* — no revenue or user-count
  threshold. See gap in §5.
- **State comprehensive privacy laws (California's CCPA/CPRA, plus a fast-growing
  list — Virginia, Colorado, Connecticut, and others since 2023)** grant rights
  like access, deletion, and opt-out of sale. Each has its own applicability
  thresholds — CCPA/CPRA's are roughly: $25M+ annual revenue, OR personal data on
  100,000+ consumers, OR 50%+ of revenue from selling/sharing personal data. **At
  this app's current scale, these almost certainly don't apply yet.** Worth
  knowing the thresholds so effort isn't spent on something not yet legally
  required — but also worth building the underlying capability (deletion, export)
  before crossing them, since retrofitting under pressure is worse than having it
  ready.

### 4b. EU specifics

- **GDPR** — would apply the moment any EU resident signs up. Relevant rights:
  access, erasure ("right to be forgotten"), portability, and a lawful basis for
  processing every category of data collected. See gaps in §5 — several of these
  aren't implemented yet.
- **Pet health data is very likely *not* GDPR "special category data."** Article
  9's strictest protections (effectively requiring explicit consent, not just
  ordinary justification) apply to health data about *identifiable natural
  persons*. A dog's vaccine record isn't that — same reasoning as the HIPAA
  finding above, just under a different law. Good news, not a gap — noted here so
  it's a deliberate conclusion, not an assumption.
- **Data Processing Agreements (DPAs) are required with every sub-processor**
  handling EU personal data — Supabase, Anthropic, Render, Sentry, and now also
  Better Auth (see §2's table). All five are mainstream SaaS vendors that already
  publish standard GDPR-ready DPAs; for most, accepting one is a checkbox in their
  own dashboard, not a document either of us would draft. Still needs to actually
  be done per vendor — see gap in §5. Google is excluded from this list
  deliberately — see §2's note on why it's a controller-to-controller relationship,
  not a processor one.
- **International data transfers** — all five processor-relationship sub-processors
  are US-based, so GDPR requires a valid transfer mechanism for each. Confirmed
  directly against each vendor's own DPA (see `docs/vendor-data-transfer-mechanisms.md`,
  gap #11): all five already have one. Render and Sentry hold actual EU-US Data
  Privacy Framework certification; Supabase, Anthropic, and Better Auth rely on
  Standard Contractual Clauses instead — an equally valid mechanism, just a
  different one. Google's OAuth sign-in relies on its own separate
  controller-to-controller transfer terms, not SCCs or DPF.
- **EU representative (GDPR Article 27)** — a company with no EU presence that
  offers services to EU residents technically needs to appoint an EU
  representative, unless processing is occasional/low-risk. Easy to overlook for
  a small US team. Only relevant once EU signups are actually being accepted, not
  before.
- **The EU AI Act** — a current, real EU regulation specifically for AI systems,
  directly relevant here because of Pawlie. It sorts AI systems into risk tiers;
  a pet-advice chatbot that explicitly discloses it's AI and isn't medical advice
  (which Pawlie's UI already does — the "Written by AI · not medical advice"
  labeling) almost certainly lands in the lower-risk "transparency obligation"
  tier, not the high-risk tier (which covers things like actual medical device
  software). Worth awareness, not urgent, and the app's existing disclaimer
  design already happens to align with what that tier expects.

## 5. Open gaps (concrete, not yet built)

Roughly in order of how foundational they are:

1. ~~No privacy policy exists anywhere.~~ **Live**, see `/privacy` — written from
   this doc's own findings, then fact-checked sentence-by-sentence directly against
   the codebase (schema fields, storage/signed-URL behavior, share-link contents,
   cascade-delete behavior, Sentry config, the sub-processor list) rather than just
   copied from here. Still a first draft — get real legal review before leaning on
   it hard with real users, same caveat as every doc in this folder. **A terms of
   service still doesn't exist** — split out as its own gap, #12 below, since a
   privacy policy and a ToS cover different things and conflating them here was
   imprecise.
2. **No full-account deletion.** Pet-level deletion exists, but there's no path to
   delete an entire account and all associated data — relevant to GDPR's right to
   erasure and CCPA's right to delete. (In progress — see PR #89, open, not yet
   merged. The new privacy policy documents the interim manual process: email us
   and we delete it by hand.)
3. ~~No data export.~~ **Fixed** (PR #86) — "Download my data" in the account menu
   lets an owner download everything stored about their account/pets. This gap was
   actually resolved before this doc's last update but never marked here — caught
   while fact-checking the new privacy policy against actual shipped features, not
   just this doc's own (stale) gap list.
4. ~~Sentry's IP-derived geolocation.~~ **Fixed** (PR #79) — confirmed, by reading
   the SDK's own source, that this is real default behavior on every live request
   (`dataCollection.userInfo` defaults to `true`), not just a test-script
   artifact. `Sentry.init()` now explicitly opts out.
5. ~~Google Fonts loaded live from Google's CDN.~~ **Fixed** (PR #83) — sent every
   visitor's IP to Google on every page load; a 2022 German court ruling
   specifically flagged this pattern as a GDPR issue independent of cookies.
   Fonts are now self-hosted via `@fontsource-variable`, verified zero requests
   to `fonts.googleapis.com`/`fonts.gstatic.com` in both dev and a production
   build.
6. ~~No documented data retention policy.~~ **Draft exists**, see
   `docs/data-retention-policy.md`. Core pet/health data being kept indefinitely
   turns out to be deliberate (it's the whole point of the product), not an
   oversight — but writing that doc also surfaced a real, separate bug: deleting
   a pet cleans up its health-record documents from storage but not its photo,
   which gets orphaned. See that doc's §2 for the fix.
7. ~~No formal sub-processor disclosure to users.~~ **Fixed** — the new privacy
   policy's §3 publicly lists all six sub-processors (Supabase, Anthropic, Render,
   Sentry, Google, Better Auth) and what each receives, in plain language.
8. **No cookie consent banner — and per the conversation that led to this doc,
   none is currently needed.** The only cookie in use is the strictly-necessary
   session cookie, exempt under GDPR/ePrivacy and CCPA-style frameworks. Documented
   here so the reasoning isn't lost, not because it's unresolved.
9. ~~No breach notification plan.~~ **Draft exists**, see
   `docs/breach-notification-plan.md` — a working "what do we actually do"
   process (detection, containment, who/what/when to notify). Still needs real
   legal review before being treated as final, especially the notification
   timing, which genuinely varies by state. Every US state legally requires
   notifying affected users within a set window if personal data is breached —
   this one applies regardless of company size, unlike the threshold-gated
   state privacy laws, so having a draft in place is worth more here than for
   most of the other gaps in this list. **Until today, the plan only covered the
   US side.** GDPR Article 33's separate 72-hour EU-supervisory-authority
   notification requirement was missing entirely — added just now, caught while
   answering a "how close to GDPR compliance" question rather than while
   originally writing the plan. Worth remembering this kind of one-sided gap can
   hide in a doc that looks complete at a glance.
10. **No Data Processing Agreements signed with any sub-processor** (Supabase,
    Anthropic, Render, Sentry, and now also Better Auth) — required under GDPR
    once EU users are in the picture. Per `docs/vendor-data-transfer-mechanisms.md`,
    four of the five describe their DPA as already automatically in effect via the
    standard terms of service — this is likely "confirm and keep a record," not
    "sign something new." **A concrete, per-vendor action-item checklist now
    exists** at the bottom of that doc, checked against each vendor's own
    help-center docs (not guessed) — Sentry is the only one with a real
    self-service signing flow (Organization Settings → Legal & Compliance →
    DocuSign, Owner/Billing role required); the rest are either already automatic
    or need a direct ask to support. Still needs Samih/Hani to actually work
    through it — not something to delegate. Google is deliberately not on this
    list — see §2's note on why it's a different (controller-to-controller) legal
    relationship, not a DPA situation.
11. ~~International data transfer mechanisms not confirmed per vendor.~~
    **Researched**, see `docs/vendor-data-transfer-mechanisms.md` — checked
    directly against each vendor's own published DPA, not assumed. All five
    processor-relationship vendors already have a valid mechanism: Render and
    Sentry hold actual EU-US Data Privacy Framework certification, Supabase,
    Anthropic, and Better Auth rely on Standard Contractual Clauses (an equally
    valid, just different, mechanism). Google uses its own separate
    controller-to-controller terms, not this framework at all.
12. ~~No terms of service exist anywhere.~~ **Live**, see `/terms` — covers
    acceptable use, account termination, a formal "Pawlie isn't a vet" disclaimer,
    no-warranty, and limitation of liability. Same first-draft caveat as the
    privacy policy: get real legal review before leaning on it, especially §11
    (governing law), which deliberately doesn't name a specific state yet.
    **New since this doc's last update: signup itself is now gated on agreeing to
    both documents** — the email signup form and the "Sign in with Google" button
    on the signup page are both blocked by a checkbox until both are accepted;
    this is a real, enforced consent step now, not just two documents sitting
    unlinked. Login's Google button (which can also create a first-time account)
    isn't gated the same way — blocking a returning user's sign-in isn't
    reasonable — but carries a passive "by continuing you agree" notice instead.

## 6. Suggested next steps, if this gets pursued further

None of this is committed to yet — these are options to discuss, not a plan:

- ~~Write an actual privacy policy~~ — live at `/privacy`, see gap #1. Still get
  real legal input before treating it as binding, not just an AI-drafted
  document.
- ~~Write a terms of service~~ — live at `/terms`, see gap #12. Still get real
  legal input before treating it as binding.
- ~~Decide whether data export is worth building~~ — built (PR #86). Decide
  whether full-account deletion (in progress, PR #89) is worth finishing before
  or after the first real external users, given the PRD's own billing/plan work
  is similarly still "if pursued at all."
- ~~Decide whether to self-host fonts~~ — done, see gap #5.
- Check each sub-processor's dashboard for a DPA to accept (Supabase, Anthropic,
  Render, Sentry, Better Auth) — likely low-effort, hasn't been done yet. This one
  needs Samih/Hani directly — accepting a vendor's legal agreement isn't
  something to delegate.
- ~~Write down an actual breach-notification process~~ — draft done, see
  `docs/breach-notification-plan.md`. Still needs real legal review before being
  treated as final.
- **Revisit this file whenever a new third-party service gets added** — this
  specifically didn't happen for Google sign-in (PR #82) and the Better Auth
  dashboard (PR #81), both merged three days before this update. Worth treating
  "does this touch compliance.md?" as a standing question on any PR that adds a
  new env var for an external API key, not just something to remember after the
  fact.
