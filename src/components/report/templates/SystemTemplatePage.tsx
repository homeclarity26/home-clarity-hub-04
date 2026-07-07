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

type Urgency = "well_within_life" | "approaching_eol" | "overdue" | "critical";

function deriveUrgency(age: number, lifespan: number): Urgency {
  if (lifespan <= 0) return "well_within_life";
  const pct = age / lifespan;
  if (pct >= 1.0) return "critical";
  if (pct >= 0.85) return "overdue";
  if (pct >= 0.7) return "approaching_eol";
  return "well_within_life";
}

const URGENCY_BAR_GRADIENT: Record<Urgency, string> = {
  well_within_life: "linear-gradient(90deg, #2F6E40 0%, #5A8A4F 100%)",
  approaching_eol: "linear-gradient(90deg, #2F6E40 0%, #B58A1F 100%)",
  overdue: "linear-gradient(90deg, #2F6E40 0%, #B58A1F 60%, #B7410E 100%)",
  critical: "#B7410E",
};

interface SystemTemplatePageProps {
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
  simplified?: boolean;
}

const SystemTemplatePage = ({
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
  simplified = false,
}: SystemTemplatePageProps) => {
  const heroImage = images[0];
  const galleryImages = images.length > 1 ? images.slice(1) : [];
  const rating = page.conditionRating;
  const ratingColor = rating ? RATING_COLORS[rating] : undefined;

  const ext = page as unknown as Record<string, unknown>;
  const specs = (ext.specs as { label: string; value: string }[]) || [];
  const lifespanYears = ext.expected_lifespan_years as number | undefined;
  const currentAge = ext.current_age_years as number | undefined;
  // Observations array (Phase 1 structured contract): authored narrative
  // prose lands in key_observations for system pages; render it as a
  // labeled Observations section, never bare page-level paragraphs.
  const keyObservations = Array.isArray(ext.key_observations)
    ? (ext.key_observations as unknown[]).filter(
        (o): o is string => typeof o === "string" && o.trim().length > 0,
      )
    : [];

  const showLifespan = !simplified && lifespanYears && currentAge;
  const urgency = currentAge && lifespanYears ? deriveUrgency(currentAge, lifespanYears) : "well_within_life";
  const fillPct = currentAge && lifespanYears && lifespanYears > 0
    ? Math.min((currentAge / lifespanYears) * 100, 100)
    : 0;

  const eyebrowLabel = simplified ? "Appliances" : "Systems";
  const chapterLabel = group?.title ?? "";

  return (
    <div className="max-w-[1040px] mx-auto px-5 sm:px-8 md:px-10 py-8">
      {/* Hero image */}
      {heroImage && (
        <div
          className="relative w-full h-[220px] sm:h-[280px] rounded-lg overflow-hidden mb-8 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(180deg, transparent 50%, rgba(10,22,40,0.5) 100%)",
            }}
          />
        </div>
      )}

      {/* Eyebrow + title */}
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent mb-2">
        {eyebrowLabel} · {chapterLabel}
      </div>
      <h1 className="font-display text-[28px] sm:text-[34px] text-primary leading-tight mb-3">
        {page.title}
      </h1>

      {/* Condition rating */}
      {rating && (
        <div className="flex items-center gap-2 mb-5">
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

      {/* Spec row */}
      {specs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6 p-4 bg-card border border-border rounded-lg">
          {specs.map((s) => (
            <div key={s.label}>
              <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                {s.label}
              </div>
              <div className="text-sm text-foreground mt-0.5">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Lifespan bar */}
      {showLifespan && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
              Lifecycle Position
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
              {currentAge} of {lifespanYears} years
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${fillPct}%`,
                background: URGENCY_BAR_GRADIENT[urgency],
              }}
            />
          </div>
          {(urgency === "approaching_eol" || urgency === "overdue" || urgency === "critical") && (
            <p className="font-mono text-[9px] uppercase tracking-[0.12em] mt-2" style={{ color: "#B7410E" }}>
              {urgency === "critical" ? "Past expected lifespan" : urgency === "overdue" ? "Nearing end of life" : "Approaching end of life"}
            </p>
          )}
        </div>
      )}

      <hr className="border-border mb-8" />

      {/* Observations */}
      {keyObservations.length > 0 && (
        <div className="mb-10">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent mb-4">
            Observations
          </h3>
          <div className="space-y-3">
            {keyObservations.map((obs, i) => (
              <p key={i} className="text-sm text-foreground leading-relaxed">
                {obs}
              </p>
            ))}
          </div>
        </div>
      )}

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

export default SystemTemplatePage;
