# Vendor International Data Transfer Mechanisms — Research Notes

**This is not legal advice.** Resolves gap #11 in `docs/compliance.md`: confirming,
per sub-processor, what legal mechanism each one actually offers for moving EU
personal data to the US (all four are US-based companies). Every claim below was
checked directly against that vendor's own published DPA or an official company
page — not a third-party summary site — with the source linked. This also directly
informs gap #10 (accepting each DPA), since it answers "what will I actually find
when I go look."

Last verified: 2026-10-11. (Originally 2026-10-08, covering four vendors; Google
sign-in and the Better Auth dashboard were added to the app on 2026-10-09 via
PR #82 and PR #81 and are researched here for the first time, caught three days
late while fact-checking the new privacy policy page — see `compliance.md`'s
"last verified" note for the same gap.)

## Summary

| Vendor | Standard Contractual Clauses (SCCs) | EU-US Data Privacy Framework | How the DPA activates |
|---|---|---|---|
| **Supabase** | Yes, incorporated | Not mentioned in the DPA | Automatic — accepting Supabase's main Terms of Service has "the same effect as signing the SCCs." No separate signature. |
| **Anthropic** | Yes, incorporated (Module 2/3) | Not mentioned — SCCs are the only mechanism | DPA is incorporated into, and governed by, the Anthropic Commercial Terms of Service once the agreement references it — worth confirming our actual API account's terms explicitly reference the DPA, rather than assuming, since the DPA's own text ties activation to that reference rather than stating it's unconditionally automatic. |
| **Render** | Yes, incorporated | **Yes — actively certified** (EU-US DPF + UK extension + Swiss-US DPF, effective Jan 6, 2025) | Incorporated into the Agreement automatically; DPA is a standalone page, no separate signature described. |
| **Sentry** | Yes, incorporated (fallback) | **Yes — self-certified**, this is the *primary* mechanism, SCCs are the fallback if DPF is ever invalidated | Automatic on accepting standard terms; Sentry also offers a documented formal "execute the DPA" path via their help center for anyone who wants a signed copy on file. |
| **Better Auth** | Yes, incorporated (Module 2) | Not mentioned — SCCs are the only mechanism | DPA states it "forms part of the Terms of Service or Master Services Agreement" — same automatic-via-standard-terms pattern as Supabase. |
| **Google** (sign-in) | **Not applicable — different framework** | **Not applicable — different framework** | Not a processor relationship at all — see note below. |

**Bottom line: all five processor-relationship vendors already have a valid
transfer mechanism in place today**, two different ways:

- **Render and Sentry** both hold actual Data Privacy Framework certification —
  the stronger, more straightforward mechanism (a direct adequacy-style
  certification, not just a fallback contract clause).
- **Supabase, Anthropic, and Better Auth** rely on Standard Contractual Clauses
  only. SCCs are a fully valid, standard mechanism under GDPR — just a
  contractual commitment rather than a government-certified program. This isn't
  a gap or a weaker position, just a different (and equally common) approach.
- **Google is not on this spectrum at all.** Checked directly against Google's
  API Terms of Service: for "Sign in with Google," both parties are treated as
  independent data controllers under Google's own "Controller-Controller Data
  Protection Terms," not a controller-processor relationship. The
  SCC/DPF question this whole doc is answering (how does a US processor legally
  receive EU data from us) doesn't apply the same way here, since Google isn't
  acting as our processor for this data — it's disclosing its own user's data to
  us as a fellow controller, with the user's consent via the OAuth flow itself.
  Don't go looking for a Google DPA to accept for this feature; it's the wrong
  document for this relationship.

## Per-vendor detail

### Supabase
DPA: [supabase.com/legal/dpa](https://supabase.com/legal/dpa). Incorporates the
EU Commission's 2021 SCCs (Commission Implementing Decision (EU) 2021/914) —
Module 2 when we're the controller and Supabase the processor. The DPA text
states acceptance of Supabase's regular Terms of Service has "the same effect as
signing the Standard Contractual Clauses" — meaning this may already be in effect
simply by having a Supabase account, independent of any separate DPA-specific
action. Worth confirming directly with Supabase (or in their dashboard) whether
anything further needs to be explicitly accepted, or whether this is genuinely
already binding.

### Anthropic
DPA: [anthropic.com/legal/data-processing-addendum](https://www.anthropic.com/legal/data-processing-addendum).
Incorporates the EU Commission's 2021 SCCs (Module 2 and/or Module 3 depending on
role), automatically part of the Anthropic Commercial Terms of Service that
governs paid API usage (this app's Claude integration is exactly that — API
access via `ANTHROPIC_API_KEY`, not free consumer Claude.ai). No Data Privacy
Framework reference anywhere in the document — Anthropic relies on SCCs alone for
this.

### Render
DPA: [render.com/dpa](https://render.com/dpa). Incorporates SCCs, *and* separately
[announced EU-US Data Privacy Framework certification](https://render.com/changelog/render-achieves-certification-under-the-eu-us-data-privacy-framework)
effective January 6, 2025 — covering the EU-US DPF, its UK extension, and the
Swiss-US DPF. Of the five processor-relationship vendors, Render has the most
explicit, most recently confirmed transfer story.

### Sentry
DPA: [sentry.io/legal/dpa](https://sentry.io/legal/dpa/) (version 5.1.0, dated
May 29, 2024). States plainly: "Sentry complies with the Data Privacy Framework
in relation to transfers of Personal Data from Europe to the United States" — DPF
is the primary mechanism, with SCCs kicking in only if DPF is ever invalidated by
EU courts (as Privacy Shield, the DPF's predecessor, previously was). Sentry also
offers EU-region data hosting as an option, which would avoid the international
transfer question for this data entirely, if ever worth pursuing.

### Better Auth
DPA: [better-auth.com/legal/dpa](https://www.better-auth.com/legal/dpa). States it
"forms part of the Terms of Service or Master Services Agreement" — same
automatic-via-standard-terms pattern as Supabase. Incorporates the EU Commission's
2021 SCCs (Module 2, controller-to-processor) plus the UK International Data
Transfer Addendum for UK transfers. No Data Privacy Framework reference — SCCs
alone, same as Supabase and Anthropic. The DPA's own description of what Better
Auth's services process (identifiers, authentication credentials, login metadata,
security logs) is broader than what our specific setup actually sends — we
self-host the core auth library and only use their `dash()` monitoring add-on, so
actual passwords never leave our own database (see `compliance.md` §1 for exactly
what the dash plugin transmits, confirmed by reading its source).

### Google (sign-in)
No DPA applies here, and that's not an oversight — it's a different relationship.
Checked directly against [developers.google.com/terms](https://developers.google.com/terms)
(the Google APIs Terms of Service governing "Sign in with Google"): it points to
the "Google Controller-Controller Data Protection Terms" rather than a
processor DPA, meaning Google and PetHealth are each independent controllers of
the account data exchanged during sign-in, not a service processing data on our
behalf. SCCs and the EU-US DPF — the two mechanisms this whole document is about —
govern processor relationships specifically, so neither applies to this one. The
correct document to review here, if this ever needs closer legal attention, is the
Controller-Controller terms themselves, not a DPA.

## What this means for gap #10 (accepting each vendor's DPA)

Based on the above, accepting each DPA is likely closer to "confirm it's already
in effect" than "go sign something new" — four of the five processor-relationship
vendors (Supabase, Anthropic, Render, Better Auth) describe their DPA as
automatically incorporated into the standard terms already agreed to by having an
account (Anthropic's wording ties this to the DPA being referenced by name in the
governing agreement specifically — worth a quick check that our actual API
account's terms do that, rather than assuming). Sentry explicitly offers a formal
acceptance path if a signed-and-dated copy on file is wanted rather than relying
on implicit acceptance. Google isn't part of this list at all — see its note
above. Concretely, when Samih/Hani get to gap #10, the actual work is probably:

1. Check each of the five vendors' account/dashboard settings for an explicit
   "Accept DPA" toggle or page (several vendors surface this even when it's also
   automatically covered by the ToS, so it's worth doing for a clear paper trail).
2. For Sentry specifically, consider using their documented formal execution path
   if a signed copy is wanted on record.
3. Keep a short note (even just a dated line in this file) once each is
   confirmed, so there's a record of when this was checked.

## Sources

- [Supabase Data Processing Addendum](https://supabase.com/legal/dpa)
- [Anthropic Data Processing Addendum](https://www.anthropic.com/legal/data-processing-addendum)
- [Render Data Processing Addendum](https://render.com/dpa)
- [Better Auth Data Processing Addendum](https://www.better-auth.com/legal/dpa)
- [Google APIs Terms of Service](https://developers.google.com/terms)
- [Google OAuth 2.0 Policies](https://developers.google.com/identity/protocols/oauth2/policies)
- [Render EU-US Data Privacy Framework certification announcement](https://render.com/changelog/render-achieves-certification-under-the-eu-us-data-privacy-framework)
- [Sentry Data Processing Addendum](https://sentry.io/legal/dpa/)
