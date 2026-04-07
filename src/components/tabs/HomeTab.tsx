import { useState, useEffect } from "react";
import { CheckCircle2, Circle, ChevronRight, CalendarPlus, Sparkles } from "lucide-react";
import WelcomeHeader from "@/components/portal/WelcomeHeader";
import AICommandBar from "@/components/portal/AICommandBar";
import SmartActionTiles, { trackSectionVisit } from "@/components/portal/SmartActionTiles";
import AISuggestionsStrip from "@/components/portal/AISuggestionsStrip";
import ActiveProjectCard from "@/components/portal/ActiveProjectCard";
import LiveInvoiceStrip from "@/components/portal/LiveInvoiceStrip";
import ReportCompletionRing from "@/components/portal/ReportCompletionRing";
import CompactHealthBar from "@/components/portal/CompactHealthBar";
import HomeHealthScore from "@/components/portal/HomeHealthScore";
import SeasonalChecklist from "@/components/portal/SeasonalChecklist";
import ClientGoalsWidget from "@/components/portal/ClientGoalsWidget";
import NotificationNudges from "@/components/portal/NotificationNudges";
import ConciergeRequestModal from "@/components/portal/ConciergeRequestModal";
import DocumentExpirationTracker from "@/components/portal/DocumentExpirationTracker";
import CostComparisonTool from "@/components/portal/CostComparisonTool";
import MyHomeStory from "@/components/portal/MyHomeStory";
import ClientReferralPortal from "@/components/portal/ClientReferralPortal";
import PropertyValueWidget from "@/components/portal/PropertyValueWidget";
import MembershipBanner from "@/components/MembershipBanner";
import AppointmentRequestModal from "@/components/portal/AppointmentRequestModal";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { ReportPageData } from "@/data/reportContent";

interface HomeTabProps {
  onNavigate: (tab: string, pageId?: string) => void;
  onTabChange?: (tab: string) => void;
  propertyName?: string;
  propertyAddress?: string;
  completionPercent?: number;
  creatorName?: string;
  estimatedValue?: number | null;
  propertyId?: string;
  membershipEndDate?: string | null;
  reportPages?: Record<string, ReportPageData>;
}

const cardBase = "bg-card rounded-lg shadow-hbc-sm border border-border";

const HomeTab = ({
  onNavigate,
  onTabChange,
  propertyName = "Your Home",
  propertyAddress,
  completionPercent = 0,
  creatorName = "Your HBC Team",
  estimatedValue,
  propertyId,
  membershipEndDate,
  reportPages,
}: HomeTabProps) => {
  const { user } = useAuth();
  const [showAppointment, setShowAppointment] = useState(false);
  const [showConcierge, setShowConcierge] = useState(false);
  const [customization, setCustomization] = useState<{ welcome_message?: string; tagline?: string; hero_photo_url?: string; advisor_signature?: string } | null>(null);

  useEffect(() => {
    if (!propertyId || propertyId.startsWith("mock-")) return;
    const load = async () => {
      const { data } = await (supabase.from("portal_customizations" as any) as any)
        .select("*")
        .eq("property_id", propertyId)
        .limit(1);
      if (data && data.length > 0) setCustomization(data[0]);
    };
    load();
  }, [propertyId]);

  const displayValue = estimatedValue;
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || customization?.welcome_message?.split(" ")[0] || propertyName?.split(" ")[0];

  const handleAskQuestion = (query?: string) => {
    const fab = document.querySelector<HTMLButtonElement>('[aria-label="Open assistant"]');
    if (fab) fab.click();
  };

  const handleNavigateTracked = (tab: string, pageId?: string) => {
    trackSectionVisit(tab);
    onNavigate(tab, pageId);
  };

  const hasReportData = reportPages && Object.keys(reportPages).length > 0;

  return (
    <div className="flex flex-col pb-16">
      {/* SECTION 1 — Welcome Header */}
      <WelcomeHeader
        firstName={firstName}
        propertyAddress={propertyAddress}
        estimatedValue={displayValue}
      />

      {/* All content sections use consistent max-w-5xl container */}
      <div className="max-w-5xl mx-auto px-6 md:px-20 w-full space-y-10">
        {/* Smart Notification Nudges */}
        <NotificationNudges propertyId={propertyId} onNavigate={(tab) => handleNavigateTracked(tab)} />

        {/* Report Completion Ring — shown near welcome when < 100% */}
        {completionPercent < 100 && completionPercent > 0 && (
          <div className="flex justify-center">
            <ReportCompletionRing completionPercent={completionPercent} totalSections={57} />
          </div>
        )}

        {/* AI Command Bar */}
        <AICommandBar onSubmit={handleAskQuestion} />

        {/* Smart Action Tiles */}
        <SmartActionTiles
          onNavigate={handleNavigateTracked}
          propertyId={propertyId}
          reportPages={reportPages}
        />

        {/* Active Project Card — live real-time */}
        {propertyId && <ActiveProjectCard propertyId={propertyId} onNavigate={handleNavigateTracked} />}

        {/* Live Invoice Strip — real-time payment status */}
        {propertyId && <LiveInvoiceStrip propertyId={propertyId} onNavigate={handleNavigateTracked} />}

        {/* AI Suggestions Strip */}
        <AISuggestionsStrip onNavigate={handleNavigateTracked} reportPages={reportPages} />

        {/* My Home Goals */}
        {propertyId && <ClientGoalsWidget propertyId={propertyId} />}

        {/* Cost Comparison Tool */}
        {hasReportData && (
          <CostComparisonTool pages={reportPages!} />
        )}

        {/* Document & Warranty Expiration Tracker */}
        {propertyId && <DocumentExpirationTracker propertyId={propertyId} />}

        {/* Home Story */}
        {propertyId && (
          <MyHomeStory propertyId={propertyId} propertyName={propertyName} />
        )}

        {/* Seasonal Maintenance Checklist */}
        <SeasonalChecklist propertyId={propertyId} />

        {/* Home Health Score */}
        <HomeHealthScore reportPages={reportPages} onNavigate={handleNavigateTracked} />


        {/* Membership Banner (conditional) */}
        {membershipEndDate && (
          <MembershipBanner membershipEndDate={membershipEndDate} onSendMessage={() => onNavigate("messages")} />
        )}

        {/* Getting Started Checklist (conditional) */}
        {completionPercent < 100 && (
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Getting Started</p>
            <div className={`${cardBase} p-6`}>
              <p className="font-sans text-sm text-muted-foreground mb-4">Here's what to explore in your home portal</p>
              <div className="space-y-2.5">
                {[
                  { label: "Review your Home Clarity Report", done: completionPercent > 0, action: () => handleNavigateTracked("report") },
                  { label: "Explore your equipment registry", done: false, action: () => handleNavigateTracked("equipment") },
                  { label: "Check your upcoming schedule", done: false, action: () => handleNavigateTracked("schedule") },
                  { label: "Send a message to your advisor", done: false, action: () => handleNavigateTracked("messages") },
                ].map(step => (
                  <button
                    key={step.label}
                    onClick={step.action}
                    className="w-full flex items-center gap-3 text-left bg-transparent border-none cursor-pointer p-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    {step.done ? (
                      <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                    )}
                    <span className={`text-sm font-sans ${step.done ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 ml-auto" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Schedule CTA */}
        {propertyId && (
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <button
              onClick={() => setShowAppointment(true)}
              className={`${cardBase} w-full group p-6 hover:shadow-hbc-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-4 text-left`}
            >
              <CalendarPlus className="w-5 h-5 text-accent" />
              <div className="flex-1">
                <h3 className="font-display text-lg text-foreground">Schedule a Consultation</h3>
                <p className="font-sans text-sm text-muted-foreground">Pick a time with your advisor</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent transition-colors" />
            </button>
            <ConciergeRequestModal open={showConcierge} onOpenChange={setShowConcierge} propertyId={propertyId} />
            <AppointmentRequestModal open={showAppointment} onOpenChange={setShowAppointment} propertyId={propertyId} />
          </div>
        )}

        {/* Property Value */}
        {propertyId && <PropertyValueWidget propertyId={propertyId} estimatedValue={estimatedValue} />}

        {/* Referral Widget */}
        {propertyId && <ClientReferralPortal propertyId={propertyId} />}

        {/* Advisor Signature */}
        {customization?.advisor_signature && (
          <div className={`${cardBase} p-6 text-center`}>
            <p className="font-sans text-sm text-muted-foreground italic">{customization.advisor_signature}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeTab;
