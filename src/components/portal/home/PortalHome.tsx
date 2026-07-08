import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarPlus,
  ChevronDown,
  ChevronRight,
  FileText,
  Gift,
  Hammer,
  PlayCircle,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  FloorPlanEmbedBlock,
} from "@/components/wysiwyg/blocks/EmbedBlocks";
import { PortalHomeHero } from "@/components/portal/home/PortalHomeHero";
import { BobbyInputBar } from "@/components/portal/home/BobbyInputBar";
import { TodaysBrief } from "@/components/portal/home/TodaysBrief";
import { WhatChangedFeed } from "@/components/portal/home/WhatChangedFeed";
import { PhotoCaptureFlow } from "@/components/portal/PhotoCaptureFlow";
import ClientGoalsWidget from "@/components/portal/ClientGoalsWidget";
import MyHomeStory from "@/components/portal/MyHomeStory";
import PropertyValueWidget from "@/components/portal/PropertyValueWidget";
import ClientReferralPortal from "@/components/portal/ClientReferralPortal";
import SeasonalChecklist from "@/components/portal/SeasonalChecklist";
import DocumentExpirationTracker from "@/components/portal/DocumentExpirationTracker";

interface PortalHomeProps {
  onNavigate: (tab: string, pageId?: string) => void;
  onTabChange?: (tab: string) => void;
  propertyName?: string;
  propertyAddress?: string;
  heroImageUrl?: string | null;
  yearBuilt?: number | null;
  propertyId?: string;
  hoverUrl?: string | null;
  hoverPdfUrl?: string | null;
  iguideUrl?: string | null;
  floorPlanUrl?: string | null;
  welcomeVideoUrl?: string | null;
  estimatedValue?: number | null;
  isAdminPreview?: boolean;
  clientFirstName?: string | null;
  /** Optional meta line under the Hover card title (e.g. roof/siding sqft). */
  hoverMeta?: string | null;
  /** Optional meta line under the iGUIDE card title (e.g. panoramic stop count). */
  iguideMeta?: string | null;
}

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const MAX_W = "max-w-[1040px] mx-auto px-6 md:px-10 w-full";

// Quick-link tile, used for document cards and Refer button.
function QuickLinkCard({
  label,
  helper,
  icon: Icon,
  onClick,
  disabled,
  hint,
}: {
  label: string;
  helper?: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group bg-card border border-border rounded-lg p-5 text-left transition-all duration-200 min-h-[112px] flex flex-col justify-between disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:shadow-hbc-md enabled:hover:-translate-y-0.5"
    >
      <Icon className="w-5 h-5 text-accent" />
      <div>
        <p className="font-display text-base text-foreground">{label}</p>
        {helper && (
          <p className="font-sans text-xs text-muted-foreground mt-0.5">{helper}</p>
        )}
        {disabled && hint && (
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/70 mt-1.5">
            {hint}
          </p>
        )}
      </div>
    </button>
  );
}

// Prototype screen 21 media card: thumbnail band with a navy badge pill,
// then title + meta line + gold open button on white. The thumbnail is a
// navy gradient stand-in (Hover/iGUIDE don't expose still images).
function MediaTourCard({
  badge,
  title,
  meta,
  url,
  cta,
  emptyLabel,
}: {
  badge: string;
  title: string;
  meta: string;
  url?: string | null;
  cta: string;
  emptyLabel: string;
}) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
      <div className="relative aspect-[16/9] bg-gradient-to-b from-primary/80 via-primary/50 to-primary/20">
        <span className="absolute top-3 left-3 rounded bg-primary px-2 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-primary-foreground">
          {badge}
        </span>
      </div>
      <div className="p-5 space-y-1.5">
        <p className="font-sans text-base font-semibold text-foreground">{title}</p>
        <p className="font-sans text-xs text-muted-foreground">{meta}</p>
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center min-h-[44px] mt-2 px-4 rounded-md bg-accent text-white font-sans text-sm font-medium transition-opacity hover:opacity-90"
          >
            {cta} ↗
          </a>
        ) : (
          <p className="font-sans text-xs italic text-muted-foreground pt-3 pb-2">
            {emptyLabel}
          </p>
        )}
      </div>
    </div>
  );
}

export function PortalHome({
  onNavigate,
  propertyName = "Your Home",
  propertyAddress,
  heroImageUrl,
  yearBuilt,
  propertyId,
  hoverUrl,
  hoverPdfUrl,
  iguideUrl,
  floorPlanUrl,
  welcomeVideoUrl,
  estimatedValue,
  isAdminPreview = false,
  clientFirstName,
  hoverMeta,
  iguideMeta,
}: PortalHomeProps) {
  const { user } = useAuth();
  const [customization, setCustomization] = useState<{
    welcome_message?: string;
    hero_photo_url?: string;
    advisor_signature?: string;
  } | null>(null);

  useEffect(() => {
    if (!propertyId || propertyId.startsWith("mock-")) return;
    let cancelled = false;
    const load = async () => {
      try {
        const { data } = await supabase
          .from("portal_customizations")
          .select("welcome_message, hero_photo_url, advisor_signature")
          .eq("property_id", propertyId)
          .limit(1);
        if (!cancelled && data && data.length > 0) setCustomization(data[0]);
      } catch {
        // Table may not exist in dev. Graceful fallback.
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  const isEmail = (s?: string | null) => !!s && s.includes("@");
  const firstName = isAdminPreview
    ? (isEmail(clientFirstName) ? undefined : clientFirstName || undefined)
    : (!isEmail(user?.user_metadata?.full_name)
        ? user?.user_metadata?.full_name?.split(" ")[0]
        : undefined) ||
      (propertyName && propertyName !== "Your Home" ? propertyName.split(" ")[0] : undefined);

  const resolvedHeroUrl = customization?.hero_photo_url || heroImageUrl || undefined;

  const openHoverPdf = () => {
    if (hoverPdfUrl) window.open(hoverPdfUrl, "_blank", "noopener,noreferrer");
  };
  const openFloorPlan = () => {
    if (floorPlanUrl) window.open(floorPlanUrl, "_blank", "noopener,noreferrer");
  };
  const openWelcomeVideo = () => {
    if (welcomeVideoUrl) window.open(welcomeVideoUrl, "_blank", "noopener,noreferrer");
  };

  const openConcierge = (prompt: string) => {
    window.dispatchEvent(
      new CustomEvent("concierge:open", { detail: { prompt } })
    );
  };

  return (
    <div className="flex flex-col pb-24 md:pb-16">
      <PortalHomeHero
        propertyName={propertyName}
        propertyAddress={propertyAddress}
        heroImageUrl={resolvedHeroUrl}
        yearBuilt={yearBuilt ?? undefined}
        firstName={firstName}
      />

      <motion.div
        className={`${MAX_W} space-y-10 mt-10`}
        variants={stagger}
        initial="initial"
        animate="animate"
      >
        {/* 0. Bobby input — persistent entry point */}
        <motion.section variants={fadeUp}>
          <BobbyInputBar onOpen={() => openConcierge("")} />
        </motion.section>

        {/* 1. Embed prominence — Hover + iGUIDE as thumbnail cards */}
        <motion.section variants={fadeUp} className="space-y-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
            Your home, always available
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MediaTourCard
              badge="3D"
              title="Exterior 3D Model"
              meta={hoverMeta ?? "Hover scan"}
              url={hoverUrl}
              cta="Open 3D model"
              emptyLabel="Hover scan not yet uploaded"
            />
            <MediaTourCard
              badge="360"
              title="Interior 360° Tour"
              meta={iguideMeta ?? "iGUIDE"}
              url={iguideUrl}
              cta="Open tour"
              emptyLabel="iGUIDE tour not yet uploaded"
            />
          </div>
        </motion.section>

        {/* 2. Document cards — floor plans, Hover report PDF, welcome video */}
        <motion.section variants={fadeUp} className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl text-foreground">Documents</h2>
            <button
              type="button"
              onClick={() => onNavigate("report")}
              className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent hover:underline bg-transparent border-none cursor-pointer"
            >
              See all in Report →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FloorPlanEmbedBlock content={{ url: floorPlanUrl ?? "" }} />
            <QuickLinkCard
              label="Hover Report"
              helper={hoverPdfUrl ? "Open the full exterior PDF" : "Not yet uploaded"}
              icon={FileText}
              onClick={openHoverPdf}
              disabled={!hoverPdfUrl}
              hint="Awaiting Hover scan"
            />
            <QuickLinkCard
              label="Welcome Video"
              helper={welcomeVideoUrl ? "Walk-through from your advisor" : "Not yet recorded"}
              icon={PlayCircle}
              onClick={openWelcomeVideo}
              disabled={!welcomeVideoUrl}
              hint="Awaiting recording"
            />
          </div>
        </motion.section>

        {/* 3. Today's Brief — pulls from daily_briefs */}
        {propertyId && (
          <motion.section variants={fadeUp}>
            <TodaysBrief propertyId={propertyId} />
          </motion.section>
        )}

        {/* 3b. What Changed — recent report page updates */}
        {propertyId && (
          <motion.section variants={fadeUp}>
            <WhatChangedFeed propertyId={propertyId} />
          </motion.section>
        )}

        {/* 3c. Photo capture — mobile-prominent */}
        {propertyId && !propertyId.startsWith("mock-") && (
          <motion.section variants={fadeUp}>
            <PhotoCaptureFlow propertyId={propertyId} />
          </motion.section>
        )}

        {/* 4. Quick links — refer + consultation + projects */}
        <motion.section variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickLinkCard
            label="Schedule a consultation"
            helper="Pick a time with your advisor"
            icon={CalendarPlus}
            onClick={() =>
              openConcierge(
                "I'd like to schedule a consultation with my advisor. Please find me 2-3 times that work in the next week."
              )
            }
          />
          <QuickLinkCard
            label="Active projects"
            helper="See what's in flight"
            icon={Hammer}
            onClick={() => onNavigate("projects")}
          />
          <QuickLinkCard
            label="Refer a friend"
            helper="Share HBC with someone you trust"
            icon={Gift}
            onClick={() =>
              openConcierge(
                "I'd like to refer someone to HBC. Walk me through how that works."
              )
            }
          />
        </motion.section>

        {/* Explore more — secondary widgets, kept behind an accordion */}
        <motion.section variants={fadeUp}>
          <Collapsible>
            <CollapsibleTrigger className="group w-full flex items-center justify-between text-left bg-card rounded-lg border border-border px-5 py-4 hover:border-accent/40 transition-colors [&[data-state=open]>svg]:rotate-180">
              <div>
                <p className="font-display text-lg text-foreground">Explore more</p>
                <p className="font-sans text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-0.5">
                  Goals · Seasonal checklist · Value · Story · Documents
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-8 pt-8">
              {propertyId && <ClientGoalsWidget propertyId={propertyId} />}
              {propertyId && <DocumentExpirationTracker propertyId={propertyId} />}
              {propertyId && (
                <MyHomeStory propertyId={propertyId} propertyName={propertyName} />
              )}
              <SeasonalChecklist propertyId={propertyId} />
              {propertyId && (
                <PropertyValueWidget
                  propertyId={propertyId}
                  estimatedValue={estimatedValue}
                />
              )}
              {propertyId && <ClientReferralPortal propertyId={propertyId} />}
              {customization?.advisor_signature && (
                <div className="bg-card border border-border rounded-lg p-6 text-center">
                  <p className="font-sans text-sm text-muted-foreground italic">
                    {customization.advisor_signature}
                  </p>
                </div>
              )}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => onNavigate("contacts")}
                  className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent hover:underline bg-transparent border-none cursor-pointer min-h-[44px]"
                >
                  See your contacts <ChevronRight className="inline w-3 h-3 ml-0.5" />
                </button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </motion.section>
      </motion.div>
    </div>
  );
}

export default PortalHome;
