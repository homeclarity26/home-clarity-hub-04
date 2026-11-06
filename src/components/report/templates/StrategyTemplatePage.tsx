import type { ReportPageData } from "@/data/reportContent";
import type { PortalGroup } from "@/hooks/useClientPortal";
import type { ReportBlock } from "@/components/wysiwyg/types";
import SharedBlockRenderer from "@/components/wysiwyg/SharedBlockRenderer";
import { AttachedDocuments } from "@/components/report/AttachedDocuments";
import { ArrowLeft, ChevronRight } from "lucide-react";

// Strategy chapter template (prototype screens 29-32). The template owns
// the page header (gold mono eyebrow, Cormorant H1, optional intro
// paragraph); the blocks render flat viewer sections beneath it — the same
// contract as Room/System/Vision templates from Phase 2.

// Optional display fields a strategy page may carry beyond the base
// ReportPageData shape. displayTitle lets the H1 read as prose ("Everything
// you're paying for, in one place") while the nav keeps the short title.
type StrategyPageExtras = {
  strategyEyebrow?: string;
  displayTitle?: string;
  intro?: string;
};

interface StrategyTemplatePageProps {
  page: ReportPageData;
  group?: PortalGroup;
  blocks: ReportBlock[];
  images: string[];
  prevPage: ReportPageData | null;
  nextPage: ReportPageData | null;
  prevPageId: string | null;
  nextPageId: string | null;
  onNavigate?: (pageId: string) => void;
  propertyAddress?: string;
  propertyId?: string;
  reportId?: string;
}

const StrategyTemplatePage = ({
  page,
  blocks,
  prevPage,
  nextPage,
  prevPageId,
  nextPageId,
  onNavigate,
  propertyAddress,
  propertyId,
  reportId,
}: StrategyTemplatePageProps) => {
  const extras = page as unknown as StrategyPageExtras;
  const eyebrow = extras.strategyEyebrow ?? "Strategy";
  const heading = extras.displayTitle ?? page.title;

  return (
    <div className="max-w-[1040px] mx-auto px-5 sm:px-8 md:px-10 py-8">
      {/* Eyebrow + title */}
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent mb-2">
        {eyebrow}
      </div>
      <h1 className="font-display text-[28px] sm:text-[34px] text-primary leading-tight mb-3">
        {heading}
      </h1>
      {extras.intro && (
        <p className="text-sm text-muted-foreground leading-relaxed max-w-[720px] mb-6">
          {extras.intro}
        </p>
      )}

      {/* Flat strategy blocks */}
      {blocks.length > 0 && (
        <div className="space-y-7 mt-6">
          {blocks.map((block) => (
            <SharedBlockRenderer
              key={block.id}
              block={block}
              editable={false}
              propertyAddress={propertyAddress}
              propertyId={propertyId}
              reportId={reportId}
            />
          ))}
        </div>
      )}

      {propertyId && page.id && (
        <AttachedDocuments propertyId={propertyId} pageKey={page.id} />
      )}

      {/* Prev / Next */}
      {(prevPage || nextPage) && (
        <div className="border-t border-border pt-8 mt-12 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {prevPage && prevPageId ? (
            <button
              onClick={() => onNavigate?.(prevPageId)}
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
          {nextPage && nextPageId ? (
            <button
              onClick={() => onNavigate?.(nextPageId)}
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
  );
};

export default StrategyTemplatePage;
