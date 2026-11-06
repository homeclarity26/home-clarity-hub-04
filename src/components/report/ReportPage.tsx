import { useState, useEffect, useRef } from "react";
import { Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReportPageData } from "@/data/reportContent";
import type { PDFReportData } from "@/features/pdf/PDFReport";
import CreatorBar from "./CreatorBar";
import QACoachPanel from "@/components/admin/QACoachPanel";
import AdminAIAssistant from "@/components/admin/AdminAIAssistant";
import { PageAIChat } from "./PageAIChat";
import BlockRenderer from "./BlockRenderer";
import NavyHeader from "@/components/portal/NavyHeader";
import PageImageSlot from "./PageImageSlot";
import { useEditMode } from "@/contexts/EditModeContext";
import { useReportPage } from "@/hooks/useReportPage";
import type { PageContent } from "@/lib/templateUtils";
import type { PropertyContext } from "@/components/tabs/ReportTab";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ErrorBoundary from "@/components/ErrorBoundary";

interface ReportPageProps {
  page: ReportPageData;
  onNavigate?: (pageId: string) => void;
  dbPageId?: string;
  images?: string[];
  pdfData?: PDFReportData;
  reportId?: string;
  propertyId?: string;
  propertyAddress?: string;
  propertyContext?: PropertyContext;
}

// ── Chapter label from page group ────────────────────────────────────────────
const chapterLabelFromGroup = (group?: string): string => {
  if (!group) return "Report";
  if (group.startsWith("exterior")) return "Exterior";
  if (group === "appliances" || group.startsWith("interior")) return "Interior";
  if (group.startsWith("systems")) return "Systems & Appliances";
  if (group.startsWith("safety")) return "Systems & Appliances";
  if (group.startsWith("strategy")) return "Strategy";
  return "Report";
};

// ── Condition badge pill (compact, used in sticky header) ────────────────────
const conditionBadgeMini = (rating: string) => {
  const colorMap: Record<string, string> = {
    Excellent: "bg-emerald-100 text-emerald-800",
    Good: "bg-primary/10 text-primary",
    Fair: "bg-accent/15 text-accent-readable",
    Poor: "bg-orange-100 text-orange-700",
    Critical: "bg-[#B5450B]/10 text-[#B5450B]",
    "N/A": "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-[0.12em] font-medium ${colorMap[rating] || colorMap["N/A"]}`}
    >
      {rating}
    </span>
  );
};

const ShareSectionButton = ({ pageSlug }: { pageSlug: string }) => {
  const [copied, setCopied] = useState(false);
  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}?page=${pageSlug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied; share it with anyone!");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="sm" className="gap-1.5 text-xs font-sans text-muted-foreground" onClick={handleShare}>
      {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : "Share Section"}
    </Button>
  );
};

const ReportPage = ({ page, onNavigate, dbPageId, images: propImages, pdfData, reportId, propertyId, propertyAddress, propertyContext }: ReportPageProps) => {
  const { canEdit } = useEditMode();
  const { pageData, blockConfig, status, saveStatus, updatePageData, updateStatus, isLoading } = useReportPage(page.id, page, reportId);
  const [isDrafting, setIsDrafting] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // ── Scroll tracking for sticky breadcrumb ────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleUpdate = (updates: Partial<PageContent>) => {
    updatePageData(updates as Partial<ReportPageData>);
  };

  const handleDraftNarrative = async () => {
    setIsDrafting(true);
    try {
      const intelligenceParsed = (() => {
        try { return JSON.parse(propertyContext?.clientIntelligenceSummary || ""); } catch { return null; }
      })();

      const { data, error } = await supabase.functions.invoke("draft-page-narrative", {
        body: {
          pageSlug: page.id,
          pageName: page.title,
          propertyAddress: propertyAddress || "",
          yearBuilt: propertyContext?.yearBuilt,
          sqft: propertyContext?.sqft,
          bedrooms: propertyContext?.bedrooms,
          bathrooms: propertyContext?.bathrooms,
          propertyType: propertyContext?.propertyType,
          relationshipType: propertyContext?.relationshipType,
          clientIntelligenceSummary: intelligenceParsed?.summary || propertyContext?.clientIntelligenceSummary || "",
          clientGoals: intelligenceParsed?.goals || [],
          clientPriorities: intelligenceParsed?.priorities || [],
          existingConditionRating: pageData.conditionRating,
          existingSpecs: (pageData.specs as unknown as Record<string, unknown>) || undefined,
        },
      });

      if (error) throw error;

      const updates: Partial<ReportPageData> = {};
      if (data.narrative?.length) updates.narrative = data.narrative;
      if (data.key_observations?.length) (updates as Record<string, unknown>).key_observations = data.key_observations;

      updatePageData(updates);
      toast.success("Draft generated; review and edit as needed.");

      supabase.from("learning_events").insert({
        event_type: "draft_narrative_generated",
        actor_role: "creator",
        entity_type: "report_page",
        entity_id: dbPageId || page.id,
        event_data: {
          page_key: page.id,
          page_title: page.title,
          narrative_length: data.narrative?.length || 0,
          has_observations: (data.key_observations?.length || 0) > 0,
        },
      } as any).then(() => {});
    } catch (err) {
      console.error("Draft narrative failed:", err);
      toast.error("Could not generate draft. Check that the edge function is deployed.");
    } finally {
      setIsDrafting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-[800px] mx-auto px-6 md:px-20 py-16 md:py-24">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded w-2/3" />
          <div className="h-4 bg-muted rounded w-1/4" />
          <div className="space-y-2 mt-10">
            <div className="h-4 bg-muted rounded" />
            <div className="h-4 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  const resolvedImages = propImages || (pageData as unknown as Record<string, unknown>).images as string[] || [];

  const extendedPageData = {
    ...pageData,
    key_observations: (pageData as unknown as Record<string, unknown>).key_observations as string[] | undefined,
    dependencies: (pageData as unknown as Record<string, unknown>).dependencies as { pageKey: string; title: string; type: "before" | "after" }[] | undefined,
    risks: (pageData as unknown as Record<string, unknown>).risks as string[] | undefined,
    maintenance: (pageData as unknown as Record<string, unknown>).maintenance as { frequency?: string; tasks: string[] } | undefined,
    creator_notes: (pageData as unknown as Record<string, unknown>).creator_notes as string | undefined,
  };

  return (
    <div className="animate-in fade-in duration-300">
      {/* ── Creator toolbar ──────────────────────────────────────────── */}
      {canEdit && (
        <CreatorBar
          status={status}
          onStatusChange={updateStatus}
          saveStatus={saveStatus}
          currentPageId={page.id}
          onNavigate={(pageId) => onNavigate?.(pageId)}
          pdfData={pdfData}
          onDraftNarrative={handleDraftNarrative}
          isDrafting={isDrafting}
          qaCoachSlot={dbPageId ? <QACoachPanel page={{ id: dbPageId, title: page.title, condition_rating: pageData.conditionRating, narrative: pageData.narrative, specs: pageData.specs, tiers: pageData.tiers, findings: (pageData as unknown as Record<string, unknown>).findings, key_observations: extendedPageData.key_observations, images: resolvedImages }} /> : undefined}
          qaPageContext={dbPageId ? { id: dbPageId, title: page.title, condition_rating: pageData.conditionRating, narrative: pageData.narrative, specs: pageData.specs, tiers: pageData.tiers, findings: (pageData as unknown as Record<string, unknown>).findings, key_observations: extendedPageData.key_observations, images: resolvedImages } : undefined}
        />
      )}

      {/* ── Sticky breadcrumb (appears after scroll 100px) ────────────── */}
      {scrolled && (
        <div
          className="fixed top-16 left-0 right-0 z-40 flex items-center gap-3 px-6 py-2 border-b border-border bg-background/95 backdrop-blur-sm"
        >
          <span className="font-sans text-[11px] uppercase tracking-[0.15em] font-semibold text-primary">
            {page.title}
          </span>
          {pageData.conditionRating && conditionBadgeMini(pageData.conditionRating)}
        </div>
      )}

      {/* ── Navy section header ──────────────────────────────────────── */}
      <div className="no-print">
        <NavyHeader
          backLabel={chapterLabelFromGroup(page.group)}
          eyebrow={`${chapterLabelFromGroup(page.group)} · ${page.title}`}
          title={page.title}
        />
      </div>

      {/* ── Page image slot (placeholder-ready) ──────────────────────── */}
      <div className="max-w-[1040px] mx-auto px-6 md:px-10 pt-8 no-print">
        <PageImageSlot images={resolvedImages} caption="Property photos" />
      </div>

      <div ref={contentRef} className="max-w-[800px] mx-auto px-6 md:px-20 py-10 md:py-16 report-page">
        {/* Share button */}
        <div className="flex justify-end mb-4 no-print">
          <ShareSectionButton pageSlug={page.id} />
        </div>

        <BlockRenderer
          blockConfig={blockConfig}
          pageData={extendedPageData}
          images={resolvedImages}
          dbPageId={dbPageId}
          propertyId={propertyId}
          reportId={reportId}
          onUpdate={handleUpdate}
          onNavigate={onNavigate}
        />
      </div>

      {/* Admin AI Assistant + Per-page AI Chat — edit mode only */}
      {canEdit && (
        <ErrorBoundary>
          <AdminAIAssistant
            context="report"
            contextData={{
              title: page.title,
              conditionRating: pageData.conditionRating,
              group: page.group,
              narrative: pageData.narrative,
              specs: pageData.specs,
            }}
            propertyId={propertyId}
          />

          {/* Per-page AI chat — inline editing assistant */}
          <div className="max-w-[800px] mx-auto px-6 md:px-20">
            <PageAIChat
              pageTitle={page.title}
              dbPageId={dbPageId}
              currentNarrative={
                Array.isArray(pageData.narrative)
                  ? pageData.narrative.join("\n\n")
                  : typeof pageData.narrative === "string"
                    ? pageData.narrative
                    : ""
              }
              onNarrativeUpdate={() => {
                toast.info("Refresh the page to see the updated narrative.");
              }}
            />
          </div>
        </ErrorBoundary>
      )}
    </div>
  );
};

export default ReportPage;
