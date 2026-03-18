import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { EditModeProvider } from "@/contexts/EditModeContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useSessionMonitor } from "@/hooks/useSessionMonitor";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminClients from "./pages/admin/AdminClients";
import AdminClientDetail from "./pages/admin/AdminClientDetail";
import AdminNewReport from "./pages/admin/AdminNewReport";
import AdminKnowledgeBase from "./pages/admin/AdminKnowledgeBase";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminInbox from "./pages/admin/AdminInbox";
import AdminTaskBoard from "./pages/admin/AdminTaskBoard";
import AdminVendorDirectory from "./pages/admin/AdminVendorDirectory";
import AdminGoalsDashboard from "./pages/admin/AdminGoalsDashboard";
import AdminReferrals from "./pages/admin/AdminReferrals";
import AdminAutomations from "./pages/admin/AdminAutomations";
import AdminFieldInspection from "./pages/admin/AdminFieldInspection";
import AdminHelpCenter from "./pages/admin/AdminHelpCenter";

const queryClient = new QueryClient();

// Protected route wrapper — requires auth
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Creator-only route wrapper
const CreatorRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isCreator, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isCreator) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Public route wrapper (redirects to home if logged in)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Root redirect: creators go to /admin, clients go to portal
const RootRedirect = () => {
  const { user, isCreator, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isCreator) {
    return <Navigate to="/admin" replace />;
  }

  // Client — go to portal (using a default property for now)
  return <Navigate to="/portal" replace />;
};

const AppRoutes = () => {
  useSessionMonitor();
  return (
    <Routes>
      {/* Root redirect based on role */}
      <Route path="/" element={<RootRedirect />} />

      {/* Client Portal */}
      <Route
        path="/portal"
        element={
          <ProtectedRoute>
            <EditModeProvider>
              <Index />
            </EditModeProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal/:propertyId"
        element={
          <ProtectedRoute>
            <EditModeProvider>
              <Index />
            </EditModeProvider>
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <CreatorRoute>
            <AdminLayout />
          </CreatorRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
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
        <Route path="settings" element={<AdminSettings />} />
        <Route path="announcements" element={<AdminAnnouncements />} />
      </Route>

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
      <Route path="*" element={<NotFound />} />
    </Routes>
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
