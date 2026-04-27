import { useState, useCallback, useMemo, useEffect } from "react";
import ConciergeBar from "@/components/portal/concierge/ConciergeBar";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PortalHome from "@/components/portal/home/PortalHome";
import ReportTab from "@/components/tabs/ReportTab";
import ProjectsTab from "@/components/tabs/ProjectsTab";
import PaymentsTab from "@/components/tabs/PaymentsTab";
import ContactsTab from "@/components/tabs/ContactsTab";
import ScheduleTab from "@/components/tabs/ScheduleTab";
// OnboardingOverlay removed — consolidated into ClientOnboardingModal
import PushNotificationBanner from "@/components/PushNotificationBanner";
import HelpCenterPanel from "@/components/help/HelpCenterPanel";
import ClientOnboardingModal from "@/components/help/ClientOnboardingModal";
import { useClientPortal } from "@/hooks/useClientPortal";
import PortalSidebar from "@/components/portal/PortalSidebar";
import { MobileBottomNav } from "@/components/portal/MobileBottomNav";
import { usePortalTracking } from "@/hooks/usePortalTracking";
import { useEditMode } from "@/contexts/EditModeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTutorialProgress } from "@/hooks/useTutorialProgress";
import { supabase } from "@/integrations/supabase/client";
import type { PDFReportData } from "@/features/pdf/PDFReport";

// C12 — 6 visible tabs in the navigation surface.
// Photos → projects, Documents/Equipment → report, Estimates/Billing → payments,
// Services → schedule, Messages → concierge bar, Refer → quick link on Home,
// Notifications → concierge bar indicator. Old URLs are redirected below.
const VALID_TABS = new Set([
  "home", "report", "projects", "payments", "contacts", "schedule",
]);

const FOLDED_TAB_REDIRECTS: Record<string, string> = {
  photos: "projects",
  documents: "report",
  equipment: "report",
  services: "schedule",
  estimates: "payments",
  billing: "payments",
  messages: "home",
  notifications: "home",
  refer: "home",
};

const Index = () => {
  const { propertyId, tab: urlTab } = useParams<{ propertyId?: string; tab?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEditLink = searchParams.get("edit") === "true";
  const isAdminPreview = searchParams.get("preview") === "admin";
  const { user, isCreator, isLoading: authLoading, signOut } = useAuth();

  // Derive active tab from URL. Folded URLs (photos/documents/equipment/etc.)
  // resolve to their parent tab so deep links keep working after C12 collapse.
  const activeTab = urlTab && VALID_TABS.has(urlTab)
    ? urlTab
    : urlTab && FOLDED_TAB_REDIRECTS[urlTab]
      ? FOLDED_TAB_REDIRECTS[urlTab]
      : "home";

  // If the URL points to a folded tab, rewrite the URL once so refreshes and
  // shared links land on the canonical parent tab.
  useEffect(() => {
    if (urlTab && !VALID_TABS.has(urlTab) && FOLDED_TAB_REDIRECTS[urlTab]) {
      const target = FOLDED_TAB_REDIRECTS[urlTab];
      const base = propertyId ? `/portal/${propertyId}` : "/portal";
      navigate(target === "home" ? base : `${base}/${target}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlTab, propertyId]);

  const [reportPageId, setReportPageId] = useState<string | null>(null);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  // showOnboarding removed — consolidated into tutorial modal
  const [helpOpen, setHelpOpen] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const { editMode, toggleEditMode, canEdit } = useEditMode();

  // Auto-redirect to first property if none specified
  useEffect(() => {
    if (propertyId || isCreator) return;
    const findProperty = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("properties")
        .select("id")
        .eq("client_user_id", user.id)
        .limit(1);
      if (data && data.length > 0) {
        navigate(`/portal/${data[0].id}`, { replace: true });
      }
    };
    findProperty();
  }, [propertyId, user, isCreator, navigate]);

  const portal = useClientPortal(propertyId);
  const { profile } = useAuth();
  usePortalTracking(activeTab);
  const { progress: tutorialProgress, markChecklistItem, ensureRecord } = useTutorialProgress();

  // Onboarding consolidated: only ClientOnboardingModal is used now

  // Show tutorial modal for first-time clients
  useEffect(() => {
    if (!isCreator && portal.property && tutorialProgress !== undefined && tutorialProgress !== null && !tutorialProgress.onboarding_complete) {
      setShowTutorialModal(true);
    } else if (!isCreator && portal.property && tutorialProgress === null) {
      // No record yet — show modal on first visit
      setShowTutorialModal(true);
    }
  }, [isCreator, portal.property, tutorialProgress]);

  // Auto-track checklist items based on tab visits
  useEffect(() => {
    if (isCreator || !portal.property) return;
    const tabToKey: Record<string, string> = {
      report: "view_report",
      home: "check_health",
      projects: "explore_projects",
      schedule: "check_schedule",
    };
    const key = tabToKey[activeTab];
    if (key) {
      markChecklistItem(key);
    }
  }, [activeTab, isCreator, portal.property]); // eslint-disable-line react-hooks/exhaustive-deps

  // Read URL query params for edit mode and page navigation
  useEffect(() => {
    const editParam = searchParams.get("edit");
    const pageParam = searchParams.get("page");

    if (editParam === "true" && !editMode) {
      toggleEditMode();
    }

    if (pageParam) {
      if (activeTab !== "report") {
        navigate(`/portal/${propertyId}/report`, { replace: true });
      }
      setReportPageId(pageParam);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const navigateToTab = useCallback((tab: string) => {
    const base = propertyId ? `/portal/${propertyId}` : "/portal";
    const path = tab === "home" ? base : `${base}/${tab}`;
    // Preserve the current query string (e.g. ?preview=admin or ?edit=true) so
    // the creator guard below doesn't kick the admin out of preview mode on
    // every tab click. Without this, any navigation drops ?preview=admin and
    // the useEffect redirect fires.
    const qs = searchParams.toString();
    navigate(qs ? `${path}?${qs}` : path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [propertyId, navigate, searchParams]);

  const handleTabChange = useCallback((tab: string) => {
    setReportPageId(null);
    navigateToTab(tab);
  }, [navigateToTab]);

  // C12: Messages tab folded into the Concierge bar. Sending a message now
  // opens the Concierge sheet with the prompt prefilled.
  const handleSendMessage = useCallback((msg: string) => {
    setReportPageId(null);
    window.dispatchEvent(new CustomEvent("concierge:open", { detail: { prompt: msg } }));
  }, []);

  const handleReportPageSelect = useCallback((pageId: string) => {
    setReportPageId(pageId);
    navigateToTab("report");
  }, [navigateToTab]);

  const handleNavigate = useCallback((tab: string, pageId?: string) => {
    if (pageId) {
      handleReportPageSelect(pageId);
    } else {
      handleTabChange(tab);
    }
  }, [handleTabChange, handleReportPageSelect]);

  const propertyName = portal.property?.property_name || "Your Home";

  const pdfData: PDFReportData | undefined = useMemo(() => {
    if (!portal.hasDbData && Object.keys(portal.pages).length === 0) return undefined;
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    return {
      propertyName,
      address: portal.property?.address || "",
      date: dateStr,
      creatorName: portal.creatorName,
      creatorEmail: portal.creatorProfile?.email,
      creatorPhone: portal.creatorProfile?.phone,
      groups: portal.groups,
      pages: portal.pages,
      pageImages: portal.pageImages,
    };
  }, [propertyName, portal]);

  // Creators can be on the client portal in two supported ways:
  //   1. ?edit=true  — legacy inline-edit link
  //   2. ?preview=admin — "Preview Portal" button (new, opens in new tab)
  // In both cases we leave them alone. Any other creator visit gets bounced
  // back to /admin (a client landing on /portal stays there regardless).
  const allowCreatorOnPortal = isEditLink || isAdminPreview;

  useEffect(() => {
    if (authLoading) return;
    if (isCreator && !allowCreatorOnPortal) {
      navigate("/admin", { replace: true });
    }
  }, [authLoading, isCreator, allowCreatorOnPortal, navigate]);

  // Same for the "no property found + creator" fallback below.
  useEffect(() => {
    if (authLoading || portal.isLoading) return;
    if (!portal.property && isCreator && !allowCreatorOnPortal) {
      navigate("/admin", { replace: true });
    }
  }, [authLoading, portal.isLoading, portal.property, isCreator, allowCreatorOnPortal, navigate]);

  // Auth still resolving — show spinner, never flash wrong screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Creators get redirected via the effect above; render nothing while that happens.
  if (isCreator && !allowCreatorOnPortal) {
    return null;
  }

  if (portal.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-20 bg-card shadow-hbc-sm" />
        <div className="max-w-5xl mx-auto px-6 md:px-20 pt-10 space-y-6">
          <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
          <div className="h-4 w-72 bg-muted animate-pulse rounded-md" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
          <div className="h-48 bg-muted animate-pulse rounded-lg" />
          <div className="h-32 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (!portal.property) {
    // Wait for auth roles to finish loading before deciding what to show
    if (authLoading || portal.isLoading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">Loading...</div>
        </div>
      );
    }
    if (isCreator && !allowCreatorOnPortal) {
      // Creator redirect is handled by the useEffect above; render nothing.
      return null;
    }
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <h1 className="font-display text-2xl text-foreground">Your Portal is Being Prepared</h1>
          <p className="font-sans text-sm text-muted-foreground max-w-md">
            Your HBC advisor is setting up your home stewardship portal. You'll receive an email once it's ready.
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
            Questions? Contact your advisor directly.
          </p>
          {/* Escape hatch — if a creator or trade partner ends up here because
              their role row was briefly unresolved (stale localStorage, slow
              auth, etc.), let them sign out and re-authenticate instead of
              getting silently trapped on this page. */}
          {user && (
            <div className="pt-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
                Signed in as <span className="text-foreground">{user.email}</span>
              </p>
              <button
                onClick={async () => {
                  await signOut();
                  navigate("/login", { replace: true });
                }}
                className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Preview banner — shown whenever a creator views a client portal
          (either arrived from "Preview Portal" with ?preview=admin, or just
          any creator that happened to land on /portal/:id). Makes it obvious
          this is NOT a true client session, and that the admin's own JWT is
          still in use — nothing was impersonated. */}
      {isCreator && (isAdminPreview || propertyId) && (
        <div className="sticky top-0 z-50 bg-accent text-accent-foreground px-4 py-2 text-center font-sans text-xs md:text-sm flex items-center justify-center gap-3 shadow-hbc-sm">
          <span className="font-mono uppercase tracking-wider text-[10px] md:text-[11px] bg-background/20 px-2 py-0.5 rounded">
            Admin Preview
          </span>
          <span>
            You're viewing <strong>{propertyName || "this client's portal"}</strong> as yourself, not as the client. Client-only UI may differ.
          </span>
          <button
            type="button"
            onClick={() => window.close()}
            className="ml-2 underline underline-offset-2 hover:opacity-80"
          >
            Close preview
          </button>
        </div>
      )}
      <PushNotificationBanner />
      {/* Tutorial onboarding modal for first-time clients */}
      {showTutorialModal && !isCreator && (
        <ClientOnboardingModal
          propertyName={propertyName}
          creatorName={portal.creatorName}
          onComplete={(navigateTo) => {
            setShowTutorialModal(false);
            if (navigateTo === "report") handleTabChange("report");
            if (navigateTo === "messages") handleTabChange("messages");
          }}
        />
      )}
      {isEditLink && canEdit && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground">
          <div className="max-w-[1200px] mx-auto px-4 py-2 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] hover:text-accent transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Admin
            </button>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary-foreground/50">
              Editing Portal Preview
            </span>
          </div>
        </div>
      )}
      <PortalSidebar
        activeTab={activeTab}
        onTabChange={(t) => {
          handleTabChange(t);
          setMobileMoreOpen(false);
        }}
        unreadMessages={undefined}
        propertyName={propertyName}
        mobileOpen={mobileMoreOpen}
        onMobileOpenChange={setMobileMoreOpen}
      />

      <Header
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onReportPageSelect={handleReportPageSelect}
        propertyId={portal.property?.id}
      />

      <main className={`${isEditLink && canEdit ? "pt-[calc(2rem+36px)]" : "pt-20"} md:pl-[188px] pb-24 md:pb-16`}>
        <div className={`transition-opacity duration-300 ${activeTab === "home" ? "opacity-100" : "opacity-0 hidden"}`}>
          {activeTab === "home" && (
            <PortalHome
              onNavigate={handleNavigate}
              onTabChange={handleTabChange}
              propertyName={propertyName}
              propertyAddress={portal.property?.address || ""}
              heroImageUrl={portal.property?.hero_image_url}
              yearBuilt={portal.property?.year_built}
              propertyId={propertyId || ""}
              hoverUrl={portal.property?.hover_url}
              hoverPdfUrl={portal.property?.hover_pdf_url}
              iguideUrl={portal.property?.iguide_url}
              floorPlanUrl={portal.property?.floor_plan_url}
              estimatedValue={portal.property?.estimated_value}
              isAdminPreview={isAdminPreview || isCreator}
              clientFirstName={portal.clientFirstName}
            />
          )}
        </div>
        <div className={`transition-opacity duration-300 ${activeTab === "report" ? "opacity-100" : "opacity-0 hidden"}`}>
          {activeTab === "report" && (
            <ReportTab
              activePageId={reportPageId}
              onNavigate={handleReportPageSelect}
              onTabChange={handleTabChange}
              onSendMessage={handleSendMessage}
              groups={portal.groups}
              pages={portal.pages}
              pageKeyToDbId={portal.pageKeyToDbId}
              pageImages={portal.pageImages}
              propertyName={propertyName}
              propertyAddress={portal.property?.address || ""}
              propertyId={portal.property?.id}
              pdfData={pdfData}
              reportId={portal.report?.id}
              completionPercent={portal.completionPercent}
              propertyContext={portal.property ? {
                yearBuilt: portal.property.year_built ?? undefined,
                sqft: portal.property.sqft ?? undefined,
                bedrooms: portal.property.bedrooms ?? undefined,
                bathrooms: portal.property.bathrooms ?? undefined,
                propertyType: portal.property.property_type ?? undefined,
                relationshipType: portal.property.relationship_type ?? undefined,
                clientIntelligenceSummary: portal.property.client_intelligence_summary ?? undefined,
              } : undefined}
              hoverUrl={portal.property?.hover_url}
              hoverPdfUrl={portal.property?.hover_pdf_url}
              iguideUrl={portal.property?.iguide_url}
              iguidePdfUrl={portal.property?.iguide_pdf_url}
              heroImageUrl={portal.property?.hero_image_url}
              estimatedValue={portal.property?.estimated_value}
              blocksJson={portal.blocksJson}
            />
          )}
        </div>
        <div className={`transition-opacity duration-300 ${activeTab === "projects" ? "opacity-100" : "opacity-0 hidden"}`}>
          {activeTab === "projects" && (
            <ProjectsTab
              onNavigate={handleNavigate}
              onTabChange={handleTabChange}
              propertyId={portal.property?.id}
              pages={portal.pages}
              onSendMessage={handleSendMessage}
            />
          )}
        </div>
        <div className={`transition-opacity duration-300 ${activeTab === "payments" ? "opacity-100" : "opacity-0 hidden"}`}>
          {activeTab === "payments" && (
            <PaymentsTab propertyId={portal.property?.id} onTabChange={handleTabChange} />
          )}
        </div>
        <div className={`transition-opacity duration-300 ${activeTab === "contacts" ? "opacity-100" : "opacity-0 hidden"}`}>
          {activeTab === "contacts" && (
            <ContactsTab
              creator={portal.creatorProfile}
              onTabChange={handleTabChange}
              propertyId={portal.property?.id}
            />
          )}
        </div>
        <div className={`transition-opacity duration-300 ${activeTab === "schedule" ? "opacity-100" : "opacity-0 hidden"}`}>
          {activeTab === "schedule" && (
            <ScheduleTab propertyId={portal.property?.id} onTabChange={handleTabChange} />
          )}
        </div>
        {/* Messages folded into the Concierge bar in C12 — see handleSendMessage
            below, which dispatches concierge:open instead of routing to a tab. */}
      </main>

      {/* NPS Survey — disabled
      {portal.property?.id && !isCreator && (
        <NPSSurveyCard propertyId={portal.property.id} />
      )}
      */}

      {/* Help Center — accessible via AI Command Bar and chat FAB */}
      {!isCreator && (
        <HelpCenterPanel
          open={helpOpen}
          onClose={() => setHelpOpen(false)}
          onNavigate={handleTabChange}
        />
      )}

      <Footer />

      {/* C1/C2/C8: Consolidated Concierge entry point. Sticky-bottom on
          every tab, opens ConciergePanel as a sheet. Replaces both the
          inline AICommandBar (C2) and the ClientAgentPanel FAB (C8). */}
      {!isCreator && <ConciergeBar propertyId={portal.property?.id} />}

      {/* Mobile primary navigation. Replaces the hamburger-round-trip pattern. */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenMore={() => setMobileMoreOpen(true)}
      />
    </div>
  );
};

export default Index;
