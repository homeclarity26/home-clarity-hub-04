import type { ReportPageData } from "@/data/reportContent";
import type { PortalGroup } from "@/hooks/useClientPortal";
import type { ReportBlock } from "@/components/wysiwyg/types";
import SharedBlockRenderer from "@/components/wysiwyg/SharedBlockRenderer";
import ImageGrid from "@/components/editor/ImageGrid";
import { AttachedDocuments } from "@/components/report/AttachedDocuments";
import { ArrowLeft, ChevronRight } from "lucide-react";

const RATING_COLORS: Record<string, string> = {
  Excellent: "#2F6E40",
  Good: "#5A8A4F",
  Fair: "#B58A1F",
  Poor: "#B7410E",
  Critical: "#8B0000",
};

interface RoomTemplatePageProps {
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

const RoomTemplatePage = ({
  page,
  group,
  blocks,
  images,
  prevPage,
  nextPage,
  prevPageId,
  nextPageId,
  onNavigate,
  propertyAddress,
  propertyId,
  reportId,
}: RoomTemplatePageProps) => {
  const heroImage = images[0];
  const galleryImages = images.length > 1 ? images.slice(1) : [];
  const rating = page.conditionRating;
  const ratingColor = rating ? RATING_COLORS[rating] : undefined;
  const specs = (page as unknown as { specs?: { label: string; value: string }[] }).specs;

  const chapterLabel = group?.title ?? "";

  return (
    <div className="max-w-[1040px] mx-auto px-5 sm:px-8 md:px-10 py-8">
      {/* Hero image */}
      {heroImage && (
        <div
          className="relative w-full h-[240px] sm:h-[320px] rounded-lg overflow-hidden mb-8 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(180deg, transparent 40%, rgba(10,22,40,0.5) 100%)",
            }}
          />
        </div>
      )}

      {/* Eyebrow + title */}
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent mb-2">
        Spaces · {chapterLabel}
      </div>
      <h1 className="font-display text-[28px] sm:text-[34px] text-primary leading-tight mb-3">
        {page.title}
      </h1>

      {/* Metadata strip */}
      {(specs && specs.length > 0) && (
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground mb-4">
          {specs.map((s) => (
            <span key={s.label}>
              <span className="font-mono text-[9px] uppercase tracking-[0.12em]">{s.label}:</span>{" "}
              {s.value}
            </span>
          ))}
        </div>
      )}

      {/* Condition rating */}
      {rating && (
        <div className="flex items-center gap-2 mb-6">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block"
            style={{ background: ratingColor }}
          />
          <span
            className="font-mono text-[10px] uppercase tracking-[0.14em]"
            style={{ color: ratingColor }}
          >
            {rating}
          </span>
        </div>
      )}

      <hr className="border-border mb-8" />

      {/* Narrative blocks */}
      {blocks.length > 0 && (
        <div className="space-y-6 mb-10">
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

      {/* Photo gallery */}
      {galleryImages.length > 0 && (
        <div className="mb-10">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent mb-4">
            Photos
          </h3>
          <ImageGrid images={galleryImages} />
        </div>
      )}

      {/* Prev / Next */}
      {propertyId && page.id && (
        <AttachedDocuments propertyId={propertyId} pageKey={page.id} />
      )}

      {(prevPage || nextPage) && (
        <div className="border-t border-border pt-8 mt-12 grid grid-cols-2 gap-3">
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

export default RoomTemplatePage;
