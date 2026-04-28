import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useEditMode } from "@/contexts/EditModeContext";
import PortalBlockViewer from "@/components/wysiwyg/PortalBlockViewer";
import SharedBlockRenderer from "@/components/wysiwyg/SharedBlockRenderer";
import type { ReportBlock } from "@/components/wysiwyg/types";
import { isReportBlockArray } from "@/contexts/WizardContext";
import { reportPages as staticPages, reportGroups as staticGroups, type ReportPageData } from "@/data/reportContent";
import ReportPage from "@/components/report/ReportPage";
import FinancialRoadmapPage from "@/components/report/FinancialRoadmapPage";
import ActionPlanPage from "@/components/report/ActionPlanPage";
import ReportChapterNav, { CHAPTERS } from "@/components/report/ReportChapterNav";
import ReportHome from "@/components/portal/report/ReportHome";
import FindingsTable, { type Finding } from "@/components/report/FindingsTable";
import LifespanBar from "@/components/report/LifespanBar";
import InvestmentSummary from "@/components/report/InvestmentSummary";
import ImageGrid from "@/components/editor/ImageGrid";
import type { PortalGroup } from "@/hooks/useClientPortal";
import type { PDFReportData } from "@/features/pdf/PDFReport";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ChevronRight,
  MessageSquare,
  PlusCircle,
  Share2,
} from "lucide-react";

export interface PropertyContext {
  yearBuilt?: number;
  sqft?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: string;
  relationshipType?: string;
  clientIntelligenceSummary?: string;
}

interface ReportTabProps {
  activePageId: string | null;
  onNavigate?: (pageId: string) => void;
  onTabChange?: (tab: string) => void;
  onSendMessage?: (msg: string) => void;
  groups?: PortalGroup[];
  pages?: Record<string, ReportPageData>;
  pageKeyToDbId?: Record<string, string>;
  pageImages?: Record<string, string[]>;
  propertyName?: string;
  propertyAddress?: string;
  propertyId?: string;
  pdfData?: PDFReportData;
  reportId?: string;
  propertyContext?: PropertyContext;
  hoverUrl?: string | null;
  hoverPdfUrl?: string | null;
  iguideUrl?: string | null;
  iguidePdfUrl?: string | null;
  heroImageUrl?: string | null;
  completionPercent?: number;
  estimatedValue?: number | null;
  blocksJson?: unknown[];
}

const ReportTab = ({
  activePageId,
  onNavigate,
  onTabChange,
  onSendMessage,
  groups,
  pages,
  pageKeyToDbId = {},
  pageImages = {},
  propertyName = "Your Home",
  propertyAddress = "",
  propertyId,
  pdfData,
  reportId,
  propertyContext,
  hoverUrl,
  hoverPdfUrl,
  iguideUrl,
  iguidePdfUrl,
  heroImageUrl,
  completionPercent = 0,
  estimatedValue,
  blocksJson,
}: ReportTabProps) => {
  // If blocks_json has content, render using the WYSIWYG block viewer
  const hasBlocks = blocksJson && Array.isArray(blocksJson) && blocksJson.length > 0;
  const reportGroups = groups || staticGroups;
  const reportPages = pages || staticPages;
  const hasRealPages = !!pages && Object.keys(pages).length > 0;
  const [activeChapter, setActiveChapter] = useState("exterior");
  const { canEdit } = useEditMode();

  // Determine chapter from active page
  const resolvedChapter = useMemo(() => {
    if (!activePageId) return activeChapter;
    for (const ch of CHAPTERS) {
      const chapterPageIds = reportGroups
        .filter((g) => ch.groupIds.some((gid) => g.id === gid || g.id.includes(gid)))
        .flatMap((g) => g.pages);
      if (chapterPageIds.includes(activePageId)) return ch.id;
    }
    return activeChapter;
  }, [activePageId, reportGroups, activeChapter]);

  const handleChapterChange = useCallback(
    (chapterId: string) => {
      setActiveChapter(chapterId);
      // Navigate to first page of that chapter
      const ch = CHAPTERS.find((c) => c.id === chapterId);
      if (ch) {
        const firstPage = reportGroups
          .filter((g) => ch.groupIds.some((gid) => g.id === gid || g.id.includes(gid)))
          .flatMap((g) => g.pages)[0];
        if (firstPage) onNavigate?.(firstPage);
      }
    },
    [reportGroups, onNavigate]
  );

  const handlePageSelect = useCallback(
    (pageId: string) => {
      onNavigate?.(pageId);
    },
    [onNavigate]
  );

  const page = activePageId ? reportPages[activePageId] : null;

  // --- WYSIWYG blocks view (when blocks_json has content) ---
  if (hasBlocks && !activePageId) {
    return <PortalBlockViewer blocks={blocksJson as ReportBlock[]} propertyAddress={propertyAddress} />;
  }

  // --- Individual report page view ---
  if (page) {
    // W2.5 — when the wizard publishes, `report_pages.narrative` lands as a
    // ReportBlock[] (the v2 shape SharedBlockRenderer consumes). Legacy
    // reports authored pre-rebuild still carry narrative as `string[]` and
    // fall through to the legacy ReportPage renderer below.
    const rawNarrative = (page as unknown as { narrative?: unknown }).narrative;
    if (isReportBlockArray(rawNarrative)) {
      const sortedBlocks = [...rawNarrative].sort((a, b) => a.order - b.order);
      const group = reportGroups.find((g) => g.pages.includes(activePageId!));
      const images = pageImages[activePageId!] || [];
      const allPageIds = reportGroups.flatMap((g) => g.pages);
      const currentIndex = allPageIds.indexOf(activePageId!);
      const prevPageId = currentIndex > 0 ? allPageIds[currentIndex - 1] : null;
      const nextPageId =
        currentIndex < allPageIds.length - 1 ? allPageIds[currentIndex + 1] : null;
      const prevPage = prevPageId ? reportPages[prevPageId] : null;
      const nextPage = nextPageId ? reportPages[nextPageId] : null;
      const spanClassFor = (cs: ReportBlock["colSpan"]): string => {
        if (cs === 3) return "col-span-12 sm:col-span-3";
        if (cs === 4) return "col-span-12 sm:col-span-4";
        if (cs === 6) return "col-span-12 sm:col-span-6";
        return "col-span-12";
      };
      return (
        <div>
          <ReportChapterNav
            groups={reportGroups}
            pages={reportPages}
            activeChapter={resolvedChapter}
            activePageId={activePageId}
            onChapterChange={handleChapterChange}
            onPageSelect={handlePageSelect}
            onBackToHome={() => onNavigate?.("")}
          />
          <div className="max-w-[1040px] mx-auto px-6 md:px-10 py-8">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.15em]"
                    onClick={() => onNavigate?.("")}
                  >
                    Report
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {group && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                        {group.title}
                      </span>
                    </BreadcrumbItem>
                  </>
                )}
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-mono text-[11px] uppercase tracking-[0.15em]">
                    {page.title}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <h1 className="font-display text-3xl md:text-4xl text-foreground mt-4 mb-8">
              {page.title}
            </h1>
            <div className="grid grid-cols-12 gap-4">
              {sortedBlocks.map((block) => (
                <div key={block.id} className={spanClassFor(block.colSpan)}>
                  <SharedBlockRenderer
                    block={block}
                    editable={false}
                    propertyAddress={propertyAddress}
                    propertyId={propertyId}
                    reportId={reportId}
                  />
                </div>
              ))}
            </div>
            {images.length > 0 && (
              <div className="mt-10">
                <h3 className="font-display text-2xl text-foreground mb-6">Photos</h3>
                <ImageGrid images={images} />
              </div>
            )}
            {(prevPage || nextPage) && (
              <div className="mt-12 border-t border-border pt-8 grid grid-cols-2 gap-3">
                {prevPage ? (
                  <button
                    onClick={() => onNavigate?.(prevPageId!)}
                    className="group flex items-center gap-3 text-left bg-card border border-border rounded-xl px-4 py-4 hover:border-accent/40 hover:bg-accent/5 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground mb-0.5">
                        ← Previous
                      </p>
                      <p className="font-sans text-sm text-foreground group-hover:text-accent transition-colors truncate">
                        {prevPage.title}
                      </p>
                    </div>
                  </button>
                ) : (
                  <div />
                )}
                {nextPage ? (
                  <button
                    onClick={() => onNavigate?.(nextPageId!)}
                    className="group flex items-center gap-3 text-right justify-end bg-card border border-border rounded-xl px-4 py-4 hover:border-accent/40 hover:bg-accent/5 transition-all"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground mb-0.5">
                        Next →
                      </p>
                      <p className="font-sans text-sm text-foreground group-hover:text-accent transition-colors truncate">
                        {nextPage.title}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors flex-shrink-0" />
                  </button>
                ) : (
                  <div />
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    const dbPageId = pageKeyToDbId[activePageId!];
    const images = pageImages[activePageId!] || [];
    const group = reportGroups.find((g) => g.pages.includes(activePageId!));

    // Flat ordered list for prev/next
    const allPageIds = reportGroups.flatMap((g) => g.pages);
    const currentIndex = allPageIds.indexOf(activePageId!);
    const prevPageId = currentIndex > 0 ? allPageIds[currentIndex - 1] : null;
    const nextPageId = currentIndex < allPageIds.length - 1 ? allPageIds[currentIndex + 1] : null;
    const prevPage = prevPageId ? reportPages[prevPageId] : null;
    const nextPage = nextPageId ? reportPages[nextPageId] : null;

    // Extended page data for new fields
    const extPage = page as unknown as Record<string, unknown>;
    const findings = (extPage.findings as Finding[]) || [];
    const expectedLifespan = extPage.expected_lifespan_years as number | undefined;
    const currentAge = extPage.current_age_years as number | undefined;
    const replacementCost = extPage.replacement_cost_today as number | undefined;
    const lastInspected = extPage.last_inspected_date as string | undefined;
    const nextReview = extPage.next_review_date as string | undefined;

    return (
      <div>
        {/* Sticky Chapter Nav */}
        <ReportChapterNav
          groups={reportGroups}
          pages={reportPages}
          activeChapter={resolvedChapter}
          activePageId={activePageId}
          onChapterChange={handleChapterChange}
          onPageSelect={handlePageSelect}
          onBackToHome={() => onNavigate?.("")}
        />

        <div className="max-w-[1040px] mx-auto px-6 md:px-10 pt-8">
          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.15em]"
                  onClick={() => onNavigate?.("")}
                >
                  Report
                </BreadcrumbLink>
              </BreadcrumbItem>
              {group && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                      {group.title}
                    </span>
                  </BreadcrumbItem>
                </>
              )}
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-mono text-[11px] uppercase tracking-[0.15em]">
                  {page.title}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Section header meta */}
          <div className="flex flex-wrap items-center gap-3 mt-2 mb-6">
            {lastInspected && (
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                Inspected: {new Date(lastInspected).toLocaleDateString()}
              </span>
            )}
            {nextReview && (
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                Next Review: {new Date(nextReview).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Lifespan bar (before main content) */}
        {expectedLifespan && currentAge && (
          <div className="max-w-[1040px] mx-auto px-6 md:px-10 mb-6">
            <LifespanBar
              currentAge={currentAge}
              expectedLifespan={expectedLifespan}
            />
          </div>
        )}

        {/* Main page content */}
        {activePageId === "financial-roadmap" ? (
          <FinancialRoadmapPage reportId={reportId} />
        ) : activePageId === "action-plan" ? (
          <ActionPlanPage reportId={reportId} />
        ) : (
          <ReportPage
            page={page}
            onNavigate={onNavigate}
            dbPageId={dbPageId}
            images={images}
            pdfData={pdfData}
            reportId={reportId}
            propertyId={propertyId}
            propertyAddress={propertyAddress}
            propertyContext={propertyContext}
          />
        )}

        {/* Findings Table */}
        {findings.length > 0 && (
          <div className="max-w-[1040px] mx-auto px-6 md:px-10 pb-8">
            <FindingsTable findings={findings} />
          </div>
        )}

        {/* Photos gallery */}
        {images.length > 0 && (
          <div className="max-w-[1040px] mx-auto px-6 md:px-10 pb-8">
            <h3 className="font-display text-2xl text-foreground mb-6">Photos</h3>
            <ImageGrid images={images} />
          </div>
        )}

        {/* Investment Summary */}
        {replacementCost && (
          <div className="max-w-[1040px] mx-auto px-6 md:px-10 pb-8">
            <InvestmentSummary
              replacementCostToday={replacementCost}
              expectedLifespan={expectedLifespan}
              currentAge={currentAge}
              timing={page.timing}
            />
          </div>
        )}

        {/* Action buttons */}
        <div className="max-w-[1040px] mx-auto px-6 md:px-10 pb-8 flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 font-mono text-[10px] uppercase tracking-wider"
            onClick={() => {
              const url = `${window.location.origin}/portal/${propertyId}?page=${activePageId}`;
              navigator.clipboard.writeText(url);
              toast.success("Link copied! Share it with your contractor or advisor.");
            }}
          >
            <Share2 className="w-3.5 h-3.5" />
            Share This Section
          </Button>
          {onSendMessage && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 font-mono text-[10px] uppercase tracking-wider"
              onClick={() => onSendMessage(`I have a question about the ${page.title} section of my report.`)}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Ask About This
            </Button>
          )}
          {onTabChange && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 font-mono text-[10px] uppercase tracking-wider"
              onClick={() => onTabChange("projects")}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Add to Project Plan
            </Button>
          )}
        </div>

        {/* Prev / Next Navigation */}
        <div className="max-w-[1040px] mx-auto px-6 md:px-10 pb-16">
          <div className="border-t border-border pt-8 grid grid-cols-2 gap-3">
            {/* Prev */}
            {prevPage ? (
              <button
                onClick={() => onNavigate?.(prevPageId!)}
                className="group flex items-center gap-3 text-left bg-card border border-border rounded-xl px-4 py-4 hover:border-accent/40 hover:bg-accent/5 transition-all"
              >
                <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground mb-0.5">← Previous</p>
                  <p className="font-sans text-sm text-foreground group-hover:text-accent transition-colors truncate">{prevPage.title}</p>
                </div>
              </button>
            ) : (
              <div />
            )}
            {/* Next */}
            {nextPage ? (
              <button
                onClick={() => onNavigate?.(nextPageId!)}
                className="group flex items-center gap-3 text-right justify-end bg-card border border-border rounded-xl px-4 py-4 hover:border-accent/40 hover:bg-accent/5 transition-all"
              >
                <div className="min-w-0">
                  <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground mb-0.5">Next →</p>
                  <p className="font-sans text-sm text-foreground group-hover:text-accent transition-colors truncate">{nextPage.title}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors flex-shrink-0" />
              </button>
            ) : (
              <div />
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Overview / Landing Page ---
  return (
    <ReportHome
      groups={reportGroups}
      pages={reportPages}
      propertyName={propertyName}
      propertyAddress={propertyAddress}
      completionPercent={completionPercent}
      pdfData={pdfData}
      onChapterSelect={handleChapterChange}
      onPageSelect={handlePageSelect}
      onSendMessage={onSendMessage}
      onTabChange={onTabChange}
      hoverUrl={hoverUrl}
      hoverPdfUrl={hoverPdfUrl}
      iguideUrl={iguideUrl}
      iguidePdfUrl={iguidePdfUrl}
      heroImageUrl={heroImageUrl}
      estimatedValue={estimatedValue}
      propertyId={propertyId}
      creatorName="Adam Kilgore"
      isReportEmpty={!hasRealPages}
    />
  );
};

export default ReportTab;
