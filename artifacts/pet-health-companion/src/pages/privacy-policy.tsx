import { Link } from 'wouter';
import { HeartPulse, ArrowLeft } from 'lucide-react';

const LAST_UPDATED = 'October 13, 2026';
const CONTACT_EMAILS = ['hanikam12@gmail.com', 'smabsout@gmail.com'];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-serif text-[22px] font-extrabold tracking-[-0.01em]">{title}</h2>
      <div className="mt-3 grid gap-3 text-[15.5px] leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="max-w-[1160px] mx-auto px-6 py-5 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-[10px] bg-primary flex items-center justify-center text-primary-foreground shrink-0">
            <HeartPulse size={18} strokeWidth={2.5} />
          </div>
          <span className="font-serif text-lg font-extrabold tracking-tight">PetHealth</span>
        </Link>
        <Link href="/" className="flex items-center gap-1.5 h-10 px-4 rounded-full text-[14.5px] font-bold text-foreground hover:bg-accent transition-colors">
          <ArrowLeft size={16} />
          Back home
        </Link>
      </header>

      <main className="max-w-[720px] mx-auto px-6 pb-24">
        <div className="text-[12.5px] font-extrabold tracking-[0.16em] text-primary">PRIVACY &amp; DATA</div>
        <h1 className="mt-2.5 font-serif font-black tracking-[-0.03em] leading-[1.1] text-[32px] sm:text-[40px]">
          Privacy Policy
        </h1>
        <p className="mt-3 text-[15.5px] text-muted-foreground">Last updated: {LAST_UPDATED}</p>

        <p className="mt-6 text-[15.5px] leading-relaxed text-muted-foreground">
          PetHealth ("PetHealth," "we," "us") is a small, independently-run project built by Hani Kam and
          Samih Mabsout — we're not yet a registered company, just two people building this together. This
          policy explains what information PetHealth collects when you use the app, what we do with it, who
          else sees it, and what choices you have. If anything here is unclear, email us — see{' '}
          <a href="#contact" className="text-foreground underline hover:text-primary">Contact Us</a> below.
        </p>

        <Section title="1. Information We Collect">
          <p><strong className="text-foreground">Account information:</strong> your name, email address, and password (stored as a secure hash — we never store or see your actual password).</p>
          <p><strong className="text-foreground">Pet information:</strong> name, species, breed, sex, birth date, weight, photo, free-text notes, and your vet's contact details.</p>
          <p><strong className="text-foreground">Health information:</strong> health records (visits, vaccines, labs, surgeries, notes), medications and dosing schedules, symptom and weight logs, and any documents you upload (like vet reports or invoices).</p>
          <p><strong className="text-foreground">Pawlie AI conversations:</strong> questions you ask Pawlie (our AI assistant) about your pet, and the answers it gives, stored against that pet's record.</p>
          <p><strong className="text-foreground">Sitter-sharing information:</strong> if you create a share link for a pet sitter, anyone with that link (no account needed) can see your pet's name, species, breed, color, weight, microchip ID, and photo, plus vet and emergency vet contacts, allergies, your free-text notes and critical info, active medications, and any feeding, handling, or routine notes you've written.</p>
          <p><strong className="text-foreground">Technical information:</strong> your login session, and minimal server request logs (the page requested and its status — not the content of what you send).</p>
        </Section>

        <Section title="2. How We Use Your Information">
          <p>We use the information above to run the app for you: storing your pets' records, showing you what's due or overdue, generating Pawlie's answers to your questions, powering Smart Upload's document extraction, and letting you share care details with a sitter if you choose to.</p>
          <p>We don't use your pet's health information for advertising, and we don't sell your information to anyone.</p>
        </Section>

        <Section title="3. Who We Share Information With">
          <p>PetHealth relies on a small number of outside services to run the app. We share only what each one needs to do its job:</p>
          <ul className="grid gap-2 list-disc pl-5">
            <li><strong className="text-foreground">Supabase</strong> — our database and file storage. Everything described in Section 1 is stored here.</li>
            <li><strong className="text-foreground">Anthropic (maker of Claude, the AI behind Pawlie)</strong> — when you ask Pawlie a question or use Smart Upload, the relevant pet and health details are sent to Anthropic's API to generate a response. This is how Pawlie works, and it's the one place real health details leave our database as part of a feature you're actively using.</li>
            <li><strong className="text-foreground">Render</strong> — hosts the app itself.</li>
            <li><strong className="text-foreground">Sentry</strong> — helps us catch and fix errors. We've configured it to not collect your approximate location from your IP address.</li>
            <li><strong className="text-foreground">Google</strong> — if you choose "Sign in with Google," Google shares your name, email, and profile photo with us to set up your account; we don't use this for anything beyond signing you in.</li>
            <li><strong className="text-foreground">Better Auth</strong> — the company behind our login system also provides a dashboard we use to monitor sign-in activity and catch suspicious account behavior. It receives account and session data (not your pet or health records).</li>
          </ul>
          <p>We don't share your information with anyone else, except if required to by law, or with your explicit action (like creating a sitter share link).</p>
        </Section>

        <Section title="4. How Long We Keep Your Information">
          <p>We keep your pets' health records for as long as your account and that pet's profile exist — this app is meant to be a lifelong health history, so there's no automatic expiration on that data.</p>
          <p>If you delete a pet's profile, its records, documents, and photo are deleted along with it. If you delete your account, everything tied only to you is deleted too, right away — this isn't a "marked for deletion" state that lingers, it's immediate and can't be undone. Two exceptions: anything we're legally required to keep (for example, to meet a legal obligation), and our underlying hosting/database provider's routine backups — like any hosted app, a deleted record can still exist in a backup snapshot for a short time until that backup naturally rotates out, even though it's immediately gone from the live app.</p>
        </Section>

        <Section title="5. Your Rights and Choices">
          <p><strong className="text-foreground">Access and download your data:</strong> from the account menu, choose "Download my data" to get a copy of everything PetHealth has stored about your account and pets.</p>
          <p><strong className="text-foreground">Delete a pet's profile:</strong> you can remove any pet's profile and its records yourself, any time, from that pet's profile page.</p>
          <p><strong className="text-foreground">Delete your whole account:</strong> from the account menu, choose "Delete account" to permanently delete your account and every pet only you own, along with their records — this happens immediately and can't be undone. If you'd rather we do it by hand, email us (see below).</p>
          <p><strong className="text-foreground">Correct your information:</strong> you can edit your pet's details yourself at any time from the profile page. For account-level corrections, email us.</p>
          <p>If you're in the EU/UK or a US state with its own privacy law, you may have additional rights under that law (for example, GDPR's right to erasure or portability). We'll honor these requests regardless of where you live — email us and we'll help.</p>
        </Section>

        <Section title="6. How We Protect Your Information">
          <ul className="grid gap-2 list-disc pl-5">
            <li>Every record is locked to the account that owns it — nobody else can see your pets' data unless you share a link.</li>
            <li>Passwords are hashed, never stored or logged as plain text.</li>
            <li>Uploaded vet documents live in a private storage bucket, only ever reachable through a short-lived link generated at the moment you view it.</li>
            <li>Sitter share links are read-only, expire on a date you choose, and can be revoked early.</li>
          </ul>
          <p>No system is perfectly secure. If we ever become aware of a breach affecting your personal information, we'll notify you as required by applicable law.</p>
        </Section>

        <Section title="7. International Users">
          <p>PetHealth and the services it relies on are based in the United States. If you use PetHealth from outside the US, your information will be transferred to and processed in the US. Our service providers maintain recognized legal safeguards for this (such as Standard Contractual Clauses or the EU-US Data Privacy Framework).</p>
        </Section>

        <Section title="8. Children's Privacy">
          <p>PetHealth isn't directed at children, and we don't knowingly collect information from anyone under 13. If you believe a child has created an account, email us and we'll remove it.</p>
        </Section>

        <Section title="9. Changes to This Policy">
          <p>We may update this policy as the app changes. If we make a material change, we'll update the "Last updated" date above, and for significant changes, let you know directly (for example, by email).</p>
        </Section>

        <Section title="10. Contact Us">
          <p id="contact">
            Questions about this policy, or want to exercise any of the rights above? Email either of us directly:
          </p>
          <ul className="grid gap-1 list-disc pl-5">
            {CONTACT_EMAILS.map((email) => (
              <li key={email}>
                <a href={`mailto:${email}`} className="text-foreground underline hover:text-primary">{email}</a>
              </li>
            ))}
          </ul>
          <p className="text-[13px]">
            (These are our personal addresses for now — we'll move to a dedicated privacy address once PetHealth has its own domain.)
          </p>
        </Section>
      </main>
    </div>
  );
}
