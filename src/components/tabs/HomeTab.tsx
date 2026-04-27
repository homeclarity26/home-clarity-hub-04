import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, ChevronRight, CalendarPlus, ChevronDown } from "lucide-react";
import { PropertyHero } from "@/components/portal/PropertyHero";
import AICommandBar from "@/components/portal/AICommandBar";
import SmartActionTiles, { trackSectionVisit } from "@/components/portal/SmartActionTiles";
import AISuggestionsStrip from "@/components/portal/AISuggestionsStrip";
import ActiveProjectCard from "@/components/portal/ActiveProjectCard";
import LiveInvoiceStrip from "@/components/portal/LiveInvoiceStrip";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { ReportPageData } from "@/data/reportContent";

/**
 * HomeTab — the client's first impression of the portal.
 *
 * Per the WOW brief:
 *   1. "This is MY home"  — real photo, real address, real data above the fold
 *   2. "Someone knows my house" — proactive AI insight near the top
 *   3. "I know what to do next" — ONE primary action, not a list
 *   4. "This feels premium" — tight hierarchy, lots of air, restrained widgetry
 *
 * Above the fold we render:
 *   - PropertyHero (photo, name, address, score ring)
 *   - AI Command Bar (persistent entry point to the AI assistant)
 *   - SmartActionTiles (1-3 priority tiles chosen from actual data)
 *   - Live project + invoice strips (only render when there's data)
 *
 * Everything else (goals, seasonal checklist, referrals, value widget, etc.)
 * lives behind an "Explore more" accordion. Same features, better hierarchy.
 */
interface HomeTabProps {
  onNavigate: (tab: string, pageId?: string) => void;
  onTabChange?: (tab: string) => void;
  propertyName?: string;
  propertyAddress?: string;
  heroImageUrl?: string | null;
  completionPercent?: number;
  creatorName?: string;
  estimatedValue?: number | null;
  yearBuilt?: number | null;
  propertyId?: string;
  membershipEndDate?: string | null;
  reportPages?: Record<string, ReportPageData>;
  // True when the logged-in user is an admin viewing a client's portal
  // (either via ?preview=admin or just because creators can view any portal).
  // In that case we should greet the client, not the admin.
  isAdminPreview?: boolean;
  clientFirstName?: string | null;
}

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const cardBase = "bg-card rounded-lg shadow-hbc-sm border border-border";

const HomeTab = ({
  onNavigate,
  onTabChange: _onTabChange,
  propertyName = "Your Home",
  propertyAddress,
  heroImageUrl,
  completionPercent = 0,
  creatorName: _creatorName = "Your HBC Team",
  estimatedValue,
  yearBuilt,
  propertyId,
  membershipEndDate,
  reportPages,
  isAdminPreview = false,
  clientFirstName,
}: HomeTabProps) => {
  const { user } = useAuth();
  const [showAppointment, setShowAppointment] = useState(false);
  const [showConcierge, setShowConcierge] = useState(false);
  const [customization, setCustomization] = useState<{
    welcome_message?: string;
    tagline?: string;
    hero_photo_url?: string;
    advisor_signature?: string;
  } | null>(null);

  useEffect(() => {
    if (!propertyId || propertyId.startsWith("mock-")) return;
    let cancelled = false;
    const load = async () => {
      try {
        const { data } = await supabase.from("portal_customizations")
          .select("*")
          .eq("property_id", propertyId)
          .limit(1);
        if (!cancelled && data && data.length > 0) setCustomization(data[0]);
      } catch {
        // Table may not exist yet — graceful fallback
      }
    };
    load();
    return () => { cancelled = true; };
  }, [propertyId]);

  // When an admin is previewing a client's portal, greet the client — not the
  // admin. Prefer the client's first name if we have it; otherwise fall back
  // to a neutral greeting so we don't flash "Good morning, Adam" to the admin.
  const firstName = isAdminPreview
    ? clientFirstName || undefined
    : user?.user_metadata?.full_name?.split(" ")[0] ||
      customization?.welcome_message?.split(" ")[0] ||
      (propertyName && propertyName !== "Your Home" ? propertyName.split(" ")[0] : undefined);

  const handleAskQuestion = (query?: string) => {
    const q = (query || "").trim();
    if (q) {
      // Forward the typed question to the Home Assistant panel so it actually
      // answers instead of just opening a blank sheet.
      window.dispatchEvent(new CustomEvent("hbc:ask", { detail: { query: q } }));
    } else {
      // No text — just open the assistant.
      window.dispatchEvent(new CustomEvent("hbc:ask", { detail: { query: "" } }));
    }
  };

  const handleNavigateTracked = (tab: string, pageId?: string) => {
    trackSectionVisit(tab);
    onNavigate(tab, pageId);
  };

  const hasReportData = !!reportPages && Object.keys(reportPages).length > 0;

  // Custom hero override from portal_customizations (optional); otherwise use
  // the admin-uploaded hero from properties.hero_image_url.
  const resolvedHeroUrl =
    customization?.hero_photo_url || heroImageUrl || undefined;

  return (
    <div className="flex flex-col pb-24 md:pb-16">
      {/* ─── 1. HERO — the client's actual home, front and center ─── */}
      <PropertyHero
        propertyName={propertyName}
        propertyAddress={propertyAddress}
        heroImageUrl={resolvedHeroUrl}
        yearBuilt={yearBuilt ?? undefined}
        firstName={firstName}
      />

      {/* Consistent max-w container below the hero */}
      <motion.div
        className="max-w-[1040px] mx-auto px-6 md:px-10 w-full space-y-8 mt-8"
        variants={stagger}
        initial="initial"
        animate="animate"
      >
        {/* ─── 2. PROACTIVE AI NUDGES — what needs attention now ─── */}
        <motion.div variants={fadeUp}>
          <NotificationNudges
            propertyId={propertyId}
            onNavigate={(tab) => handleNavigateTracked(tab)}
          />
        </motion.div>

        {/* ─── 3. AI COMMAND BAR — primary entry point to the assistant ─── */}
        <motion.div variants={fadeUp}>
          <AICommandBar onSubmit={handleAskQuestion} />
        </motion.div>

        {/* ─── 4. SMART ACTION TILES — 1-3 curated tiles ─── */}
        <motion.div variants={fadeUp}>
          <SmartActionTiles
            onNavigate={handleNavigateTracked}
            propertyId={propertyId}
            reportPages={reportPages}
          />
        </motion.div>

        {/* ─── 5. LIVE STATUS — project + invoice, only when real ─── */}
        {propertyId && (
          <motion.div variants={fadeUp} className="grid grid-cols-1 gap-4">
            <ActiveProjectCard propertyId={propertyId} onNavigate={handleNavigateTracked} />
            <LiveInvoiceStrip propertyId={propertyId} onNavigate={handleNavigateTracked} />
          </motion.div>
        )}

        {/* Report progress nudge — text-only completion strip, no ring visuals */}
        {completionPercent > 0 && completionPercent < 100 && (
          <motion.div variants={fadeUp}>
            <div className="bg-card border border-border rounded px-5 py-4">
              <div className="flex items-baseline justify-between mb-2">
                <p className="font-display text-base text-foreground">Report progress</p>
                <p className="font-sans text-[11px] uppercase tracking-[0.16em] text-accent font-semibold">
                  {completionPercent}% Complete
                </p>
              </div>
              <div className="h-[3px] w-full bg-border/70 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-[width] duration-500"
                  style={{ width: `${Math.max(4, Math.min(100, completionPercent))}%` }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Membership banner (conditional; rarely shown) */}
        {membershipEndDate && (
          <motion.div variants={fadeUp}>
            <MembershipBanner
              membershipEndDate={membershipEndDate}
              onSendMessage={() => onNavigate("messages")}
            />
          </motion.div>
        )}

        {/* ─── 6. AI SUGGESTIONS (light touch) ─── */}
        <motion.div variants={fadeUp}>
          <AISuggestionsStrip
            onNavigate={handleNavigateTracked}
            reportPages={reportPages}
          />
        </motion.div>

        {/* ─── 7. EXPLORE MORE — everything else lives here ─── */}
        <motion.div variants={fadeUp}>
        <Collapsible>
          <CollapsibleTrigger className="group w-full flex items-center justify-between text-left bg-card rounded-lg border border-border px-5 py-4 hover:border-accent/40 transition-colors [&[data-state=open]>svg]:rotate-180">
            <div className="flex items-center gap-3">
              <div>
                <p className="font-display text-lg text-foreground">Explore more</p>
                <p className="font-sans text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-0.5">
                  Goals · Seasonal checklist · Value · Referrals · Story
                </p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform" />
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-8 pt-8">
            {propertyId && <ClientGoalsWidget propertyId={propertyId} />}

            {hasReportData && <CostComparisonTool pages={reportPages!} />}

            {propertyId && <DocumentExpirationTracker propertyId={propertyId} />}

            {propertyId && (
              <MyHomeStory propertyId={propertyId} propertyName={propertyName} />
            )}

            <SeasonalChecklist propertyId={propertyId} />

            {completionPercent < 100 && (
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent-readable mb-6">
                  Getting Started
                </p>
                <div className={`${cardBase} p-6`}>
                  <p className="font-sans text-sm text-muted-foreground mb-4">
                    Here's what to explore in your home portal
                  </p>
                  <div className="space-y-2.5">
                    {[
                      { label: "Review your Home Clarity Report", done: completionPercent > 0, action: () => handleNavigateTracked("report") },
                      { label: "Explore your equipment registry", done: false, action: () => handleNavigateTracked("equipment") },
                      { label: "Check your upcoming schedule", done: false, action: () => handleNavigateTracked("schedule") },
                      { label: "Send a message to your advisor", done: false, action: () => handleNavigateTracked("messages") },
                    ].map((step) => (
                      <button
                        key={step.label}
                        onClick={step.action}
                        className="w-full flex items-center gap-3 text-left bg-transparent border-none cursor-pointer p-2 rounded-md hover:bg-muted/50 transition-colors min-h-[44px]"
                      >
                        {step.done ? (
                          <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                        )}
                        <span
                          className={`text-sm font-sans ${step.done ? "text-foreground" : "text-muted-foreground"}`}
                        >
                          {step.label}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 ml-auto" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {propertyId && (
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => setShowAppointment(true)}
                  className={`${cardBase} w-full group p-6 hover:shadow-hbc-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-4 text-left min-h-[72px]`}
                >
                  <CalendarPlus className="w-5 h-5 text-accent" />
                  <div className="flex-1">
                    <h3 className="font-display text-lg text-foreground">
                      Schedule a Consultation
                    </h3>
                    <p className="font-sans text-sm text-muted-foreground">
                      Pick a time with your advisor
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent transition-colors" />
                </button>
                <ConciergeRequestModal
                  open={showConcierge}
                  onOpenChange={setShowConcierge}
                  propertyId={propertyId}
                />
                <AppointmentRequestModal
                  open={showAppointment}
                  onOpenChange={setShowAppointment}
                  propertyId={propertyId}
                />
              </div>
            )}

            {propertyId && (
              <PropertyValueWidget
                propertyId={propertyId}
                estimatedValue={estimatedValue}
              />
            )}

            {propertyId && <ClientReferralPortal propertyId={propertyId} />}

            {customization?.advisor_signature && (
              <div className={`${cardBase} p-6 text-center`}>
                <p className="font-sans text-sm text-muted-foreground italic">
                  {customization.advisor_signature}
                </p>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default HomeTab;
