import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { EditModeProvider } from "@/contexts/EditModeContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useSessionMonitor } from "@/hooks/useSessionMonitor";

// Keep auth + core landing shell eager for instant first paint.
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

// Portal shell is the single most-hit route. Eager.
import Index from "./pages/Index";

// Everything else lazy-loads to cut the initial bundle for mobile clients.
const Landing = lazy(() => import("./pages/Landing"));
const DevPortalQA = lazy(() => import("./pages/DevPortalQA"));
const ProposalView = lazy(() => import("./pages/ProposalView"));
const InvoiceView = lazy(() => import("./pages/InvoiceView"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));

const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminClients = lazy(() => import("./pages/admin/AdminClients"));
const AdminClientDetail = lazy(() => import("./pages/admin/AdminClientDetail"));
const AdminNewReport = lazy(() => import("./pages/admin/AdminNewReport"));
const AdminKnowledgeBase = lazy(() => import("./pages/admin/AdminKnowledgeBase"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminAnnouncements = lazy(() => import("./pages/admin/AdminAnnouncements"));
const AdminInbox = lazy(() => import("./pages/admin/AdminInbox"));
const AdminTaskBoard = lazy(() => import("./pages/admin/AdminTaskBoard"));
const AdminVendorDirectory = lazy(() => import("./pages/admin/AdminVendorDirectory"));
const AdminGoalsDashboard = lazy(() => import("./pages/admin/AdminGoalsDashboard"));
const AdminReferrals = lazy(() => import("./pages/admin/AdminReferrals"));
const AdminAutomations = lazy(() => import("./pages/admin/AdminAutomations"));
const AdminFieldInspection = lazy(() => import("./pages/admin/AdminFieldInspection"));
const AdminHelpCenter = lazy(() => import("./pages/admin/AdminHelpCenter"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminCalendar = lazy(() => import("./pages/admin/AdminCalendar"));
const AdminProjects = lazy(() => import("./pages/admin/AdminProjects"));
const AdminProjectDetail = lazy(() => import("./pages/admin/AdminProjectDetail"));
const AdminNewProject = lazy(() => import("./pages/admin/AdminNewProject"));
const AdminCRM = lazy(() => import("./pages/admin/AdminCRM"));
const AdminCRMClientProfile = lazy(() => import("./pages/admin/AdminCRMClientProfile"));
const AdminCRMTradePartnerProfile = lazy(() => import("./pages/admin/AdminCRMTradePartnerProfile"));
const AdminCRMPipeline = lazy(() => import("./pages/admin/AdminCRMPipeline"));
const AdminAnnualReviews = lazy(() => import("./pages/admin/AdminAnnualReviews"));
const AdminTeam = lazy(() => import("./pages/admin/AdminTeam"));

const TradePartnerLayout = lazy(() => import("./layouts/TradePartnerLayout"));
const TradePartnerDashboard = lazy(() => import("./pages/trade/TradePartnerDashboard"));
const TradePartnerProjects = lazy(() => import("./pages/trade/TradePartnerProjects"));
const TradePartnerTasks = lazy(() => import("./pages/trade/TradePartnerTasks"));
const TradePartnerSchedule = lazy(() => import("./pages/trade/TradePartnerSchedule"));
const TradePartnerMessages = lazy(() => import("./pages/trade/TradePartnerMessages"));
const TradePartnerDocuments = lazy(() => import("./pages/trade/TradePartnerDocuments"));
const TradePartnerBids = lazy(() => import("./pages/trade/TradePartnerBids"));

// Tuned defaults for a mobile-first, data-heavy app.
// - 1 minute staleTime: tab switches don't bleed data/battery refetching
// - 5 minute gcTime: cache survives short nav loops
// - No focus refetch: Safari backgrounds tabs aggressively on mobile
// - 1 retry: edge functions that are truly broken fail fast
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const LoadingScreen = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
      Loading...
    </div>
  </div>
);

// Protected route wrapper — requires auth
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// Creator-only route wrapper
const CreatorRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isCreator, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isCreator) return <Navigate to="/" replace />;
  return <>{children}</>;
};

// Trade-partner-only route wrapper. Mirrors CreatorRoute, closes the role gap.
const TradePartnerRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isTradePartner, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isTradePartner) return <Navigate to="/" replace />;
  return <>{children}</>;
};

// Public route wrapper (redirects to home if logged in).
// Belt-and-suspenders: if a user is signed in but the roles fetch resolved
// to an empty array (race with the 8s safety timeout, deleted DB row, or
// stale localStorage), don't bounce them to '/' — that would just cycle
// them through RootRedirect → /portal → "Your Portal is Being Prepared"
// with no escape. Letting the login form render here lets them re-auth.
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, roles, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (user && roles.length > 0) return <Navigate to="/" replace />;
  return <>{children}</>;
};

// Root redirect: creators go to /admin, trade partners to /trade, clients to portal
const RootRedirect = () => {
  const { user, isCreator, isTradePartner, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (isCreator) return <Navigate to="/admin" replace />;
  if (isTradePartner) return <Navigate to="/trade" replace />;
  return <Navigate to="/portal" replace />;
};

const AppRoutes = () => {
  useSessionMonitor();
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Root redirect based on role */}
        <Route path="/" element={<RootRedirect />} />

        {/* Client Portal */}
        <Route
          path="/portal"
          element={
            <ProtectedRoute>
              <EditModeProvider>
                <ErrorBoundary>
                  <Index />
                </ErrorBoundary>
              </EditModeProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/:propertyId"
          element={
            <ProtectedRoute>
              <EditModeProvider>
                <ErrorBoundary>
                  <Index />
                </ErrorBoundary>
              </EditModeProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/:propertyId/:tab"
          element={
            <ProtectedRoute>
              <EditModeProvider>
                <ErrorBoundary>
                  <Index />
                </ErrorBoundary>
              </EditModeProvider>
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <CreatorRoute>
              <ErrorBoundary>
                <AdminLayout />
              </ErrorBoundary>
            </CreatorRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="inbox" element={<AdminInbox />} />
          <Route path="clients" element={<AdminClients />} />
          <Route path="clients/new" element={<AdminNewReport />} />
          <Route path="clients/:clientId" element={<AdminClientDetail />} />
          <Route path="inspect/:propertyId" element={<AdminFieldInspection />} />
          <Route path="tasks" element={<AdminTaskBoard />} />
          <Route path="vendors" element={<AdminVendorDirectory />} />
          <Route path="goals" element={<AdminGoalsDashboard />} />
          <Route path="referrals" element={<AdminReferrals />} />
          <Route path="automations" element={<AdminAutomations />} />
          <Route path="knowledge-base" element={<AdminKnowledgeBase />} />
          <Route path="help" element={<AdminHelpCenter />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="calendar" element={<AdminCalendar />} />
          <Route path="projects" element={<AdminProjects />} />
          <Route path="projects/new" element={<AdminNewProject />} />
          <Route path="projects/:projectId" element={<AdminProjectDetail />} />
          <Route path="crm" element={<AdminCRM />} />
          <Route path="crm/clients/:id" element={<AdminCRMClientProfile />} />
          <Route path="crm/trade-partners/:id" element={<AdminCRMTradePartnerProfile />} />
          <Route path="crm/pipeline" element={<AdminCRMPipeline />} />
          <Route path="annual-reviews" element={<AdminAnnualReviews />} />
          <Route path="team" element={<AdminTeam />} />
        </Route>

        {/* Trade Partner routes — now properly role-gated */}
        <Route
          path="/trade"
          element={
            <TradePartnerRoute>
              <ErrorBoundary>
                <TradePartnerLayout />
              </ErrorBoundary>
            </TradePartnerRoute>
          }
        >
          <Route index element={<TradePartnerDashboard />} />
          <Route path="projects" element={<TradePartnerProjects />} />
          <Route path="tasks" element={<TradePartnerTasks />} />
          <Route path="schedule" element={<TradePartnerSchedule />} />
          <Route path="messages" element={<TradePartnerMessages />} />
          <Route path="documents" element={<TradePartnerDocuments />} />
          <Route path="bids" element={<TradePartnerBids />} />
        </Route>

        {/* Public landing page */}
        <Route path="/welcome" element={<Landing />} />

        {/* Developer-only QA page for HCR portal shell pieces */}
        <Route path="/dev/portal-qa" element={<DevPortalQA />} />

        {/* Auth routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route path="/reset-password" element={<ResetPassword />} />
        {/* Public proposal & invoice views (no auth required) */}
        <Route path="/proposal/:token" element={<ProposalView />} />
        <Route path="/invoice/:token" element={<InvoiceView />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
