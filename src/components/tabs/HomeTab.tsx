import { useState, useEffect } from "react";
import { FileText, Hammer, Receipt, Calendar, Users, MessageCircle, Phone, ChevronRight, Home, CheckCircle2, Circle, Info, Wrench, CalendarPlus } from "lucide-react";
import WelcomeHeader from "@/components/portal/WelcomeHeader";
import AICommandBar from "@/components/portal/AICommandBar";
import SmartActionTiles, { trackSectionVisit } from "@/components/portal/SmartActionTiles";
import AISuggestionsStrip from "@/components/portal/AISuggestionsStrip";
import CompactHealthBar from "@/components/portal/CompactHealthBar";
import MyHomeStory from "@/components/portal/MyHomeStory";
import FeedbackWidget from "@/components/FeedbackWidget";
import HomeValueTracker from "@/components/HomeValueTracker";
import MembershipBanner from "@/components/MembershipBanner";
import ValuationModal from "@/components/ValuationModal";
import SeasonalMaintenanceTips from "@/components/portal/SeasonalMaintenanceTips";
import DocumentExpirationTracker from "@/components/portal/DocumentExpirationTracker";
import ClientReferralPortal from "@/components/portal/ClientReferralPortal";
import CostComparisonTool from "@/components/portal/CostComparisonTool";
import HomeImprovementWishlist from "@/components/portal/HomeImprovementWishlist";
import ServiceRequestForm from "@/components/portal/ServiceRequestForm";
import AnnualReportCard from "@/components/AnnualReportCard";
import MaintenanceReminders from "@/components/MaintenanceReminders";
import HomeGoals from "@/components/HomeGoals";
import InsuranceAssistant from "@/components/InsuranceAssistant";
import PropertyTimeline from "@/components/portal/PropertyTimeline";
import AIPriorityCard from "@/components/portal/AIPriorityCard";
import SatisfactionSurvey from "@/components/portal/SatisfactionSurvey";
import AppointmentRequestModal from "@/components/portal/AppointmentRequestModal";
import PredictiveMaintenanceCard from "@/components/portal/PredictiveMaintenanceCard";
import { usePropertyValuation } from "@/hooks/usePropertyValuation";
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
  const [valuationOpen, setValuationOpen] = useState(false);
  const [showServiceRequest, setShowServiceRequest] = useState(false);
  const [showAppointment, setShowAppointment] = useState(false);
  const { valuation, isLoading: valLoading, fetchValuation } = usePropertyValuation(propertyId, propertyAddress);
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

  const displayValue = valuation?.price ?? estimatedValue;
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || customization?.welcome_message?.split(" ")[0] || propertyName?.split(" ")[0];

  const handleAskQuestion = (query?: string) => {
    const fab = document.querySelector<HTMLButtonElement>('[aria-label="Open assistant"]');
    if (fab) fab.click();
  };

  const handleNavigateTracked = (tab: string, pageId?: string) => {
    trackSectionVisit(tab);
    onNavigate(tab, pageId);
  };

  const statusLabel = completionPercent === 100 ? "COMPLETE" : completionPercent > 0 ? "IN PROGRESS" : "NOT STARTED";

  return (
    <div className="flex flex-col pb-16">
      {/* SECTION 1 — Welcome Header */}
      <div className="mb-8">
        <WelcomeHeader
          firstName={firstName}
          propertyAddress={propertyAddress}
          estimatedValue={displayValue}
        />
      </div>

      {/* SECTION 2 — AI Command Bar */}
      <div className="mb-10">
        <AICommandBar onSubmit={handleAskQuestion} />
      </div>

      {/* SECTION 3 — Smart Action Tiles */}
      <div className="mb-10">
        <SmartActionTiles
          onNavigate={handleNavigateTracked}
          propertyId={propertyId}
          reportPages={reportPages}
        />
      </div>

      {/* SECTION 4 — AI Suggestions Strip */}
      <div className="mb-8">
        <AISuggestionsStrip onNavigate={handleNavigateTracked} reportPages={reportPages} />
      </div>

      {/* SECTION 5 — Compact Health Bar */}
      {reportPages && <CompactHealthBar pages={reportPages} onNavigate={handleNavigateTracked} />}

      {/* Valuation Modal (retained) */}
      <ValuationModal
        open={valuationOpen}
        onOpenChange={setValuationOpen}
        valuation={valuation}
        onRefresh={() => fetchValuation(true)}
        isRefreshing={valLoading}
      />

      {/* Membership Banner */}
      {membershipEndDate && (
        <div className="max-w-[1400px] mx-auto px-6 md:px-20 w-full">
          <MembershipBanner membershipEndDate={membershipEndDate} onSendMessage={() => onNavigate("messages")} />
        </div>
      )}

      {/* Getting Started (only if report incomplete) */}
      {completionPercent < 100 && (
        <div className="max-w-[1400px] mx-auto px-6 md:px-20 w-full">
          <div className="bg-card rounded-lg p-6 border border-border shadow-hbc-sm">
            <h2 className="font-display text-lg text-foreground mb-1">Getting Started</h2>
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
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
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

      {/* Existing sections below the fold */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-20 flex flex-col gap-10 w-full">
        {propertyId && <AIPriorityCard propertyId={propertyId} reportPages={reportPages} />}
        {propertyId && <PredictiveMaintenanceCard propertyId={propertyId} clientId={user?.id} />}
        {propertyId && <SatisfactionSurvey propertyId={propertyId} />}
        {reportPages && <CostComparisonTool pages={reportPages} />}
        {propertyId && (
          <HomeValueTracker propertyId={propertyId} estimatedValue={estimatedValue} propertyAddress={propertyAddress} />
        )}
        {propertyId && !propertyId.startsWith("mock-") && (
          <AnnualReportCard propertyId={propertyId} />
        )}
        <SeasonalMaintenanceTips />
        {propertyId && <DocumentExpirationTracker propertyId={propertyId} />}
        {propertyId && !propertyId.startsWith("mock-") && (
          <MaintenanceReminders propertyId={propertyId} />
        )}
        {propertyId && !propertyId.startsWith("mock-") && (
          <HomeGoals propertyId={propertyId} />
        )}
        {propertyId && <HomeImprovementWishlist propertyId={propertyId} />}
        {propertyId && !propertyId.startsWith("mock-") && (
          <InsuranceAssistant propertyId={propertyId} />
        )}
        <ClientReferralPortal />
      </div>

      {/* Service Request */}
      {propertyId && (
        <div className="max-w-[1400px] mx-auto px-6 md:px-20 w-full">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Need Help?</p>
          <div className="bg-card rounded-lg border border-border shadow-hbc-sm p-6">
            {showServiceRequest ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg text-foreground">Submit a Service Request</h3>
                  <button onClick={() => setShowServiceRequest(false)} className="font-mono text-[10px] text-muted-foreground bg-transparent border-none cursor-pointer hover:text-foreground">Cancel</button>
                </div>
                <ServiceRequestForm propertyId={propertyId} onSubmitted={() => setShowServiceRequest(false)} />
              </>
            ) : (
              <button
                onClick={() => setShowServiceRequest(true)}
                className="w-full flex items-center gap-3 bg-transparent border-none cursor-pointer text-left p-2 hover:bg-muted/30 rounded-lg transition-colors"
              >
                <Wrench className="w-5 h-5 text-accent" />
                <div className="flex-1">
                  <h3 className="font-display text-lg text-foreground">Report an Issue</h3>
                  <p className="font-sans text-sm text-muted-foreground">Submit a service request with photos</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Advisor Signature */}
      {customization?.advisor_signature && (
        <div className="max-w-[1400px] mx-auto px-6 md:px-20 w-full">
          <div className="bg-card rounded-lg p-6 border border-border shadow-hbc-sm text-center">
            <p className="font-sans text-sm text-muted-foreground italic">{customization.advisor_signature}</p>
          </div>
        </div>
      )}

      {/* Portal Status Cards */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-20 w-full">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Your Portal Status</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => handleNavigateTracked("report")}
            className="group bg-card rounded-lg p-8 shadow-hbc-sm hover:shadow-hbc-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3 border border-border border-l-[3px] border-l-accent text-left w-full"
          >
            <FileText className="w-5 h-5 text-accent" />
            <div className="flex-1">
              <h2 className="font-display text-xl text-foreground mb-1">Home Clarity Report</h2>
              <p className="font-sans text-sm text-muted-foreground">Your complete home assessment</p>
            </div>
            <div className="mt-2">
              <div className="w-full h-0.5 bg-border relative mb-2">
                <div className="h-full bg-accent transition-all" style={{ width: `${completionPercent}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{completionPercent}% Complete</p>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent">{statusLabel}</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent self-end -mt-1 transition-colors" />
          </button>
          <button
            onClick={() => handleNavigateTracked("projects")}
            className="group bg-card rounded-lg p-8 shadow-hbc-sm hover:shadow-hbc-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3 border border-border text-left w-full"
          >
            <Hammer className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <h2 className="font-display text-xl text-foreground mb-1">Active Projects</h2>
              <p className="font-sans text-sm text-muted-foreground">Track ongoing home improvements</p>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground mt-1">No active projects</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent self-end transition-colors" />
          </button>
        </div>
      </div>

      {/* Navigate Your Portal */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-20 w-full">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Navigate Your Portal</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: <Receipt className="w-5 h-5 text-accent" />, label: "Payments", sub: "Account & transaction history", tab: "payments" },
            { icon: <Calendar className="w-5 h-5 text-accent" />, label: "Schedule & Timeline", sub: "Appointments & reminders", tab: "schedule" },
            { icon: <Users className="w-5 h-5 text-accent" />, label: "Your Home Team", sub: "Advisors & vendor partners", tab: "contacts" },
          ].map((item) => (
            <button
              key={item.tab}
              onClick={() => handleNavigateTracked(item.tab)}
              className="group bg-card rounded-lg p-8 shadow-hbc-sm hover:shadow-hbc-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3 border border-border text-left w-full min-h-[180px]"
            >
              {item.icon}
              <div className="flex-1">
                <h2 className="font-display text-xl text-foreground mb-1">{item.label}</h2>
                <p className="font-sans text-sm text-muted-foreground line-clamp-2">{item.sub}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent self-end transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-20 w-full">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Quick Actions</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <button onClick={() => handleNavigateTracked("report")} className="group bg-card rounded-lg p-8 shadow-hbc-sm hover:shadow-hbc-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3 border border-border text-left w-full">
            <FileText className="w-5 h-5 text-accent" />
            <div className="flex-1">
              <h2 className="font-display text-xl text-foreground mb-1">View Your Report</h2>
              <p className="font-sans text-sm text-muted-foreground line-clamp-2">Read your complete Home Clarity assessment</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent self-end transition-colors" />
          </button>
          <button onClick={() => handleAskQuestion()} className="group bg-card rounded-lg p-8 shadow-hbc-sm hover:shadow-hbc-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3 border border-border text-left w-full">
            <MessageCircle className="w-5 h-5 text-accent" />
            <div className="flex-1">
              <h2 className="font-display text-xl text-foreground mb-1">Ask a Question</h2>
              <p className="font-sans text-sm text-muted-foreground line-clamp-2">AI-powered answers about your home</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent self-end transition-colors" />
          </button>
          <button onClick={() => handleNavigateTracked("contacts")} className="group bg-card rounded-lg p-8 shadow-hbc-sm hover:shadow-hbc-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3 border border-border text-left w-full">
            <Phone className="w-5 h-5 text-accent" />
            <div className="flex-1">
              <h2 className="font-display text-xl text-foreground mb-1">Contact Your Advisor</h2>
              <p className="font-sans text-sm text-muted-foreground line-clamp-2">Adam Kilgore — Founder & Lead Advisor</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent self-end transition-colors" />
          </button>
        </div>
      </div>

      {/* Property Timeline */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-20 pb-8 w-full">
        <div className="bg-card rounded-lg p-8 shadow-hbc-sm border border-border">
          <PropertyTimeline propertyId={propertyId} />
        </div>
      </div>

      {/* Schedule Consultation */}
      {propertyId && (
        <div className="max-w-[1400px] mx-auto px-6 md:px-20 w-full">
          <button
            onClick={() => setShowAppointment(true)}
            className="w-full group bg-card rounded-lg p-6 shadow-hbc-sm hover:shadow-hbc-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-4 border border-border text-left"
          >
            <CalendarPlus className="w-5 h-5 text-accent" />
            <div className="flex-1">
              <h3 className="font-display text-lg text-foreground">Schedule a Consultation</h3>
              <p className="font-sans text-sm text-muted-foreground">Pick a time to speak with your advisor</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent transition-colors" />
          </button>
          <AppointmentRequestModal open={showAppointment} onOpenChange={setShowAppointment} propertyId={propertyId} />
        </div>
      )}

      {/* My Home's Story */}
      {propertyId && !propertyId.startsWith("mock-") && (
        <div className="max-w-[1400px] mx-auto px-6 md:px-20 w-full">
          <MyHomeStory propertyId={propertyId} propertyName={propertyName} />
        </div>
      )}

      {/* Feedback */}
      {propertyId && !propertyId.startsWith("mock-") && (
        <div className="max-w-[1400px] mx-auto px-6 md:px-20 w-full">
          <FeedbackWidget propertyId={propertyId} title="How's your experience with Home Clarity Hub?" />
        </div>
      )}
    </div>
  );
};

export default HomeTab;
