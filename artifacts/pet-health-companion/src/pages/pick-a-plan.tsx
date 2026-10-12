import { useLocation } from 'wouter';
import { HeartPulse, Check, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { setPlanSelected } from '@/lib/plan-selection-flag';

// Same three tiers, names, prices, and feature copy as the PLANS array on
// the marketing homepage (home.tsx) — kept in sync by hand, same as
// billing.tsx's own copy of this same list, since each of the three pages
// needs its own layout/behavior around the shared data.
const PLANS = [
  {
    name: 'Pawlie Lite',
    price: '$0',
    period: null,
    sub: 'Free forever',
    features: ['Pawlie AI: 7-day trial, then Pawlie Plus and up', 'Smart Upload: 2 uploads', 'Up to 3 pets', 'All core features'],
    comingSoon: false,
  },
  {
    name: 'Pawlie Plus',
    price: '$4.99',
    period: '/ month',
    sub: 'or about $44 / year',
    features: ['Pawlie AI included, with a monthly cap', 'Smart Upload: 5 per month', 'Up to 5 pets', 'All core features'],
    comingSoon: true,
  },
  {
    name: 'Pawlie Unleashed',
    price: '$9.99',
    period: '/ month',
    sub: 'or about $89 / year',
    features: ['Pawlie AI, unlimited', 'Smart Upload, unlimited', 'Up to 7 pets', 'All core features'],
    comingSoon: true,
  },
] as const;

interface PlanCardProps {
  name: string;
  price: string;
  period?: string | null;
  sub?: string;
  features: readonly string[];
  comingSoon?: boolean;
  onSelect?: () => void;
}

function PlanCard({ name, price, period, sub, features, comingSoon, onSelect }: PlanCardProps) {
  return (
    <Card className={`rounded-3xl ${!comingSoon ? 'border-primary shadow-md' : 'shadow-sm'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <h2 className="text-xl font-serif font-medium text-foreground">{name}</h2>
          {comingSoon && (
            <div className="shrink-0 flex items-center gap-1 text-xs font-bold text-muted-foreground bg-muted rounded-full px-3 py-1">
              <Lock size={12} /> Coming soon
            </div>
          )}
        </div>
        <p className="mt-1">
          <span className="text-3xl font-serif font-bold text-foreground">{price}</span>
          {period && <span className="text-muted-foreground text-sm"> {period}</span>}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardHeader>
      <CardContent className="pt-2">
        <ul className="space-y-2.5 mb-6">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-foreground/90">
              <Check size={16} className="text-primary shrink-0 mt-0.5" />
              {feature}
            </li>
          ))}
        </ul>
        <Button
          type="button"
          size="lg"
          variant={comingSoon ? 'outline' : 'default'}
          className="w-full rounded-full"
          disabled={comingSoon}
          onClick={onSelect}
        >
          {comingSoon ? 'Coming soon' : `Continue with ${name}`}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function PickAPlan() {
  const [, setLocation] = useLocation();

  const handleContinueFree = () => {
    setPlanSelected();
    setLocation('/onboarding');
  };

  return (
    <div className="min-h-[100dvh] bg-background p-6 py-12">
      <div className="w-full max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <HeartPulse size={24} strokeWidth={2.5} />
          </div>
          <span className="font-serif text-2xl font-medium text-foreground tracking-tight">Health Hub</span>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif font-medium text-foreground">Choose your plan</h1>
          <p className="text-muted-foreground text-sm mt-1">Start free — upgrade later if you want more.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {PLANS.map((plan) => (
            <PlanCard key={plan.name} {...plan} onSelect={plan.comingSoon ? undefined : handleContinueFree} />
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Paid plans aren't available yet — everyone's on Pawlie Lite for now.
        </p>
      </div>
    </div>
  );
}
