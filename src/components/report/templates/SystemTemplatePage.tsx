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

// Prototype LifecycleBar gradient: past 75% of lifespan the fill runs
// green → amber → rust; earlier it stays green shading into amber.
const LATE_LIFE_GRADIENT = "linear-gradient(90deg, #2F6E40 0%, #B58A1F 70%, #B7410E 100%)";
const EARLY_LIFE_GRADIENT = "linear-gradient(90deg, #2F6E40 0%, #2F6E40 70%, #B58A1F 100%)";

// Amber alert palette — same values SystemRecordBlock used for the
// Proactive Lifecycle Alert (locked prototype colors).
const ALERT_BG = "#FBF1DD";
const ALERT_AMBER = "#B58A1F";

const URGENCY_PILL_LABEL: Partial<Record<Urgency, string>> = {
  approaching_eol: "Approaching End-of-Life",
  overdue: "Approaching End-of-Life",
  critical: "Past Expected Lifespan",
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
  const urgencyPillLabel = showLifespan ? URGENCY_PILL_LABEL[urgency] : undefined;

  // Lifecycle timeline endpoints (derived: install year and EOL year)
  const currentYear = new Date().getFullYear();
  const installYear = currentAge != null ? currentYear - currentAge : undefined;
  const eolYear = installYear != null && lifespanYears ? installYear + lifespanYears : undefined;

  // "our HVAC partner" — derive the trade label from the group title
  // ("HVAC System" → "HVAC"); fall back to a generic "trade partner".
  const tradeLabel = (group?.title ?? "").replace(/\s*Systems?$/i, "").trim();
  const partnerPhrase = tradeLabel ? `our ${tradeLabel} partner` : "our trade partner";

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

      {/* Eyebrow + title — prototype shows the group title alone (HVAC SYSTEM) */}
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent mb-2">
        {chapterLabel || eyebrowLabel}
      </div>
      <h1 className="font-display text-[28px] sm:text-[34px] text-primary leading-tight mb-3">
        {page.title}
      </h1>

      {/* Condition rating + urgency pill */}
      {rating && (
        <div className="flex items-center gap-4 mb-5 flex-wrap">
          <span className="inline-flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ background: ratingColor }}
            />
            <span
              className="font-mono text-[10px] uppercase tracking-[0.14em]"
              style={{ color: ratingColor }}
            >
              {rating}
            </span>
          </span>
          {urgencyPillLabel && (
            <span
              className="font-mono text-[10px] uppercase tracking-[0.14em] px-2.5 py-[3px] rounded-[3px] whitespace-nowrap"
              style={{ background: ALERT_BG, color: ALERT_AMBER }}
            >
              {urgencyPillLabel}
            </span>
          )}
        </div>
      )}

      <hr className="border-border mb-6" />

      {/* Spec grid — flat mono-label pattern on the page background */}
      {specs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mb-6">
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

      {/* Lifecycle Timeline — prototype gradient bar with year labels */}
      {showLifespan && (
        <div className="mb-6">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent mb-3">
            Lifecycle Timeline
          </h3>
          <div
            className="relative h-8 rounded-2xl overflow-hidden"
            style={{ background: "var(--hbc-cream-light, #F5F2EE)" }}
          >
            <div
              className="absolute inset-y-0 left-0"
              style={{
                width: `${fillPct}%`,
                background: fillPct > 75 ? LATE_LIFE_GRADIENT : EARLY_LIFE_GRADIENT,
              }}
            />
            <div className="absolute inset-0 flex items-center justify-between px-3.5 text-[11px] font-medium text-foreground">
              <span>{installYear ?? ""}</span>
              <span>Today · {currentAge} years</span>
              <span>{eolYear != null ? `EOL ~${eolYear}` : ""}</span>
            </div>
          </div>

          {urgencyPillLabel && (
            <div
              className="mt-6 p-4 rounded-lg"
              style={{ background: ALERT_BG, borderLeft: `3px solid ${ALERT_AMBER}` }}
            >
              <div
                className="font-mono text-[10px] uppercase tracking-[0.15em] mb-1.5"
                style={{ color: ALERT_AMBER }}
              >
                Proactive Lifecycle Alert
              </div>
              <p className="text-sm leading-relaxed text-foreground">
                This system is {currentAge} years old, with a typical lifespan of {lifespanYears} years.
                Now is the right time to start planning replacement on your terms, not on a January
                night when it fails. The Replacement Briefing below tells {partnerPhrase} exactly
                what to bring on the first visit.
              </p>
            </div>
          )}
        </div>
      )}

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
