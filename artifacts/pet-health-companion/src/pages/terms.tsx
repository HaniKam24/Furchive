import { Link } from 'wouter';
import { HeartPulse, ArrowLeft } from 'lucide-react';

const LAST_UPDATED = 'October 11, 2026';
const CONTACT_EMAILS = ['hanikam12@gmail.com', 'smabsout@gmail.com'];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-serif text-[22px] font-extrabold tracking-[-0.01em]">{title}</h2>
      <div className="mt-3 grid gap-3 text-[15.5px] leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export default function Terms() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="max-w-[1160px] mx-auto px-6 py-5 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-[10px] bg-primary flex items-center justify-center text-primary-foreground shrink-0">
            <HeartPulse size={18} strokeWidth={2.5} />
          </div>
          <span className="font-serif text-lg font-extrabold tracking-tight">Furchive</span>
        </Link>
        <Link href="/" className="flex items-center gap-1.5 h-10 px-4 rounded-full text-[14.5px] font-bold text-foreground hover:bg-accent transition-colors">
          <ArrowLeft size={16} />
          Back home
        </Link>
      </header>

      <main className="max-w-[720px] mx-auto px-6 pb-24">
        <div className="text-[12.5px] font-extrabold tracking-[0.16em] text-primary">TERMS</div>
        <h1 className="mt-2.5 font-serif font-black tracking-[-0.03em] leading-[1.1] text-[32px] sm:text-[40px]">
          Terms of Service
        </h1>
        <p className="mt-3 text-[15.5px] text-muted-foreground">Last updated: {LAST_UPDATED}</p>

        <p className="mt-6 text-[15.5px] leading-relaxed text-muted-foreground">
          Furchive ("Furchive," "we," "us") is a small, independently-run project built by Hani Kam and
          Samih Mabsout — we're not yet a registered company, just two people building this together. By
          creating an account or using Furchive, you agree to these Terms. If you don't agree, please don't
          use the app. See our{' '}
          <Link href="/privacy" className="text-foreground underline hover:text-primary">Privacy Policy</Link>{' '}
          for how we handle your information.
        </p>

        <Section title="1. What Furchive Is">
          <p>Furchive is a record-keeping app for your pets' health information — vaccines, medications, vet visits, weight, documents, and reminders — plus Pawlie, an AI assistant that can answer questions about your pet based on the records you've entered.</p>
          <p>Furchive is a young, actively-changing, independently-run project. Features may change, break, or be removed as we build it. We'll do our best to keep your data safe and the app working, but we can't promise it'll always be perfect or available.</p>
        </Section>

        <Section title="2. Pawlie Isn't a Vet">
          <p><strong className="text-foreground">Pawlie's answers are AI-generated and are not veterinary, medical, or professional advice.</strong> Pawlie can be wrong, can miss something important, and doesn't know your pet the way a vet who's examined them does.</p>
          <p>Never use Pawlie as a substitute for an actual veterinarian — especially for anything urgent or serious. If your pet seems sick, injured, or in distress, contact a licensed veterinarian or emergency animal hospital. This is the same thing the "Written by AI · not medical advice" label in the app is telling you, stated here formally.</p>
        </Section>

        <Section title="3. Your Account">
          <p>You need to be at least 13 years old to use Furchive. You're responsible for keeping your password secure and for anything that happens under your account. Tell us right away if you think someone else has access to it.</p>
          <p>Give us accurate information when you sign up. Don't create an account for someone else without their permission, or impersonate anyone.</p>
        </Section>

        <Section title="4. Your Content">
          <p>You own the information you put into Furchive — your pets' records, documents, photos, and notes. We don't claim ownership of any of it.</p>
          <p>By using Furchive, you give us permission to store, process, and transmit that information as needed to actually run the app for you — for example, sending relevant pet details to Anthropic's AI to generate a Pawlie answer, or storing an uploaded vet document in our database. See the Privacy Policy for the full list of who else sees what.</p>
          <p>Don't upload anything you don't have the right to share, or anything illegal, harmful, or abusive.</p>
        </Section>

        <Section title="5. Sitter Share Links">
          <p>If you create a share link for a pet sitter, you're choosing to make that information viewable by anyone who has the link, with no login required. You're responsible for only sharing that link with people you trust, and for revoking it when you no longer want it active.</p>
        </Section>

        <Section title="6. Acceptable Use">
          <p>Don't use Furchive to break the law, harass anyone, try to access another person's account or data, attempt to disrupt or overload the app, or try to extract, scrape, or reverse-engineer it beyond normal use.</p>
        </Section>

        <Section title="7. No Warranty">
          <p>Furchive is provided "as is," without warranties of any kind, express or implied. We don't guarantee the app will be uninterrupted, error-free, or that Pawlie's answers will be accurate or complete. You use Furchive at your own risk.</p>
        </Section>

        <Section title="8. Limitation of Liability">
          <p>To the fullest extent the law allows, Furchive and the people who run it aren't liable for any indirect, incidental, or consequential damages arising from your use of the app — including, but not limited to, harm to your pet resulting from reliance on Pawlie's output instead of professional veterinary care.</p>
          <p>Nothing here is meant to limit any liability that can't legally be limited.</p>
        </Section>

        <Section title="9. Ending Your Account">
          <p>You can stop using Furchive any time, and can request full account deletion by emailing us (see our Privacy Policy for how). We may suspend or terminate an account that violates these Terms, including abusive behavior or illegal use.</p>
        </Section>

        <Section title="10. Changes to These Terms">
          <p>We may update these Terms as the app changes. If we make a material change, we'll update the "Last updated" date above, and for significant changes, let you know directly (for example, by email).</p>
        </Section>

        <Section title="11. Governing Law">
          <p>These Terms are governed by the laws of the United States, without regard to conflict-of-law principles. We haven't yet designated a specific state's law to govern this agreement — if a dispute ever needs that specified, get in touch and we'll address it directly, and we'll update this section once we have real legal input on it.</p>
        </Section>

        <Section title="12. Contact Us">
          <p>Questions about these Terms? Email either of us directly:</p>
          <ul className="grid gap-1 list-disc pl-5">
            {CONTACT_EMAILS.map((email) => (
              <li key={email}>
                <a href={`mailto:${email}`} className="text-foreground underline hover:text-primary">{email}</a>
              </li>
            ))}
          </ul>
        </Section>
      </main>
    </div>
  );
}
