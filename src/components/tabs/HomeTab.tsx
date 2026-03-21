import { useState, useEffect } from "react";
import { CheckCircle2, Circle, ChevronRight, CalendarPlus, Sparkles } from "lucide-react";
import WelcomeHeader from "@/components/portal/WelcomeHeader";
import AICommandBar from "@/components/portal/AICommandBar";
import SmartActionTiles, { trackSectionVisit } from "@/components/portal/SmartActionTiles";
import AISuggestionsStrip from "@/components/portal/AISuggestionsStrip";
import CompactHealthBar from "@/components/portal/CompactHealthBar";
import HomeHealthScore from "@/components/portal/HomeHealthScore";
import SeasonalChecklist from "@/components/portal/SeasonalChecklist";
import ClientGoalsWidget from "@/components/portal/ClientGoalsWidget";
import NotificationNudges from "@/components/portal/NotificationNudges";
import ConciergeRequestModal from "@/components/portal/ConciergeRequestModal";
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

        {/* SECTION 2 — Home Health Score */}
        <HomeHealthScore reportPages={reportPages} onNavigate={handleNavigateTracked} />

        {/* SECTION 3 — AI Command Bar */}
        <AICommandBar onSubmit={handleAskQuestion} />

        {/* SECTION 4 — Smart Action Tiles */}
        <SmartActionTiles
          onNavigate={handleNavigateTracked}
          propertyId={propertyId}
          reportPages={reportPages}
        />

        {/* SECTION 5 — AI Suggestions Strip */}
        <AISuggestionsStrip onNavigate={handleNavigateTracked} reportPages={reportPages} />

        {/* SECTION 6 — My Home Goals */}
        {propertyId && <ClientGoalsWidget propertyId={propertyId} />}

        {/* SECTION 7 — Seasonal Maintenance Checklist */}
        <SeasonalChecklist propertyId={propertyId} />

        {/* SECTION 8 — Compact Health Bar */}
        {reportPages && <CompactHealthBar pages={reportPages} onNavigate={handleNavigateTracked} />}

        {/* SECTION 6 — Membership Banner (conditional) */}
        {membershipEndDate && (
          <MembershipBanner membershipEndDate={membershipEndDate} onSendMessage={() => onNavigate("messages")} />
        )}

        {/* SECTION 7 — Getting Started Checklist (conditional) */}
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

        {/* Concierge + Schedule CTAs */}
        {propertyId && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setShowConcierge(true)}
              className={`${cardBase} w-full group p-6 hover:shadow-hbc-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-4 text-left`}
            >
              <Sparkles className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <h3 className="font-display text-lg text-foreground">Concierge Request</h3>
                <p className="font-sans text-sm text-muted-foreground">Ask your advisor for anything</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
            </button>
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
