import { type ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { useListPets } from '@workspace/api-client-react';

import { PetProvider } from '@/context/pet-context';
import { Layout } from '@/components/layout';
import { useSession } from '@/lib/auth-client';

import Home from '@/pages/home';
import Dashboard from '@/pages/dashboard';
import Records from '@/pages/records';
import Medications from '@/pages/medications';
import Reminders from '@/pages/reminders';
import Insights from '@/pages/insights';
import SmartUpload from '@/pages/smart-upload';
import Profile from '@/pages/profile';
import Settings from '@/pages/settings';
import Onboarding from '@/pages/onboarding';
import PickAPlan from '@/pages/pick-a-plan';
import Login from '@/pages/login';
import Signup from '@/pages/signup';
import ForgotPassword from '@/pages/forgot-password';
import ResetPassword from '@/pages/reset-password';
import ShareView from '@/pages/share-view';
import PrivacyPolicy from '@/pages/privacy-policy';
import Terms from '@/pages/terms';
import { hasSelectedPlan } from '@/lib/plan-selection-flag';

const ONBOARDING_PATH = '/onboarding';
const SETTINGS_PATH = '/settings';
const PLAN_PATH = '/pick-a-plan';
const SHARE_PATH_PREFIX = '/share/';
// Public legal pages (privacy policy, terms) — reachable without a session
// (linked from the signup form before an account exists) and also while
// signed in (linked from the account menu), so each maps straight to its
// own component rather than living inside AuthedApp's Switch.
const LEGAL_PAGES: Partial<Record<string, () => ReactNode>> = {
  '/privacy': PrivacyPolicy,
  '/terms': Terms,
};

const queryClient = new QueryClient();
const AUTH_PAGES = new Set(['/login', '/signup', '/forgot-password', '/reset-password']);

function FullPageLoader() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground">Loading…</div>
    </div>
  );
}

// A brand-new (or newly pet-less) account has nowhere useful to go — every
// other page either 404s on missing data or shows its own "add a pet first"
// message. Rather than patching every entry point that links to
// /profile?new=true, this redirects the zero-pets case to the onboarding
// wizard from anywhere. Deliberately one-directional: the wizard's upload
// path creates the pet, then stays on /onboarding for its own review step
// before the "Let's go" button leaves — a "hasPets => redirect away from
// /onboarding" rule would fire the instant that pet exists and yank the user
// out from under their own review step. Someone already onboarded who
// navigates to /onboarding directly just sees the wizard again, equivalent
// to "Add another pet" — a harmless edge case, not worth the conflict.
//
// The plan picker gates entry into onboarding the same zero-pets-only way —
// deliberately checked on top of (not instead of) hasPets rather than its
// own standalone "new account" signal, so an existing account (which
// obviously already has pets, having been using the app since before this
// screen existed) is never retroactively interrupted by it. Only an account
// that's also about to be sent to onboarding sees it first.
//
// /settings is also exempt from all of the above — a pet-less account (no
// pets yet, or just deleted its only one) still needs a way to reach account
// deletion, which lives there, regardless of where it stands on plan
// selection. Both Layout and PetProvider already render correctly with zero
// pets (the pet switcher and active-pet state both guard for an empty
// list), so there's nothing else blocking this page specifically.
function AuthedApp() {
  const { data: pets, isLoading: petsLoading } = useListPets();
  const [location, setLocation] = useLocation();
  const hasPets = (pets?.length ?? 0) > 0;

  useEffect(() => {
    if (petsLoading || hasPets || location === SETTINGS_PATH) return;
    if (!hasSelectedPlan()) {
      if (location !== PLAN_PATH) setLocation(PLAN_PATH);
      return;
    }
    if (location !== ONBOARDING_PATH) {
      setLocation(ONBOARDING_PATH);
    }
  }, [petsLoading, hasPets, location, setLocation]);

  if (petsLoading) {
    return <FullPageLoader />;
  }

  if (location === PLAN_PATH) {
    return <PickAPlan />;
  }

  if (location === ONBOARDING_PATH) {
    return (
      <PetProvider>
        <Onboarding />
      </PetProvider>
    );
  }

  return (
    <PetProvider>
      <Layout>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/records" component={Records} />
          <Route path="/medications" component={Medications} />
          <Route path="/reminders" component={Reminders} />
          <Route path="/insights/:conversationId" component={Insights} />
          <Route path="/insights" component={Insights} />
          <Route path="/smart-upload" component={SmartUpload} />
          <Route path="/profile" component={Profile} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </Layout>
    </PetProvider>
  );
}

function Router() {
  const { data: session, isPending } = useSession();
  const [location, setLocation] = useLocation();
  const isAuthPage = AUTH_PAGES.has(location);
  // A sitter/boarding facility opening a share link has no account and
  // never will — this path must never bounce through the login redirect
  // below, regardless of session state.
  const isSharePage = location.startsWith(SHARE_PATH_PREFIX);
  // "/" is the public marketing homepage for a logged-out visitor, but
  // becomes the dashboard (AuthedApp's own "/" route) once signed in — so,
  // like the share page, it must never trigger the login redirect below.
  const isHomePage = location === '/';
  // Legal pages (privacy policy, terms) are public and also need to stay
  // reachable for signed-in users (linked from the account menu), so
  // they're exempt from the login redirect the same way home/share are.
  const LegalPage = LEGAL_PAGES[location];

  useEffect(() => {
    if (isPending || isSharePage || isHomePage || LegalPage) return;
    if (!session && !isAuthPage) {
      setLocation('/login');
    } else if (session && isAuthPage) {
      setLocation('/');
    }
  }, [session, isPending, isAuthPage, isSharePage, isHomePage, LegalPage, setLocation]);

  if (isSharePage) {
    return <ShareView />;
  }

  if (LegalPage) {
    return <LegalPage />;
  }

  if (isPending) {
    return <FullPageLoader />;
  }

  if (!session) {
    return (
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/signup" component={Signup} />
        <Route path="/login" component={Login} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route>
          <FullPageLoader />
        </Route>
      </Switch>
    );
  }

  return (
    <RoutedErrorBoundary>
      <AuthedApp />
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
