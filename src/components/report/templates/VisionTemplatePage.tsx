import type { ReportPageData, TierData } from "@/data/reportContent";
import type { PortalGroup } from "@/hooks/useClientPortal";
import type { ReportBlock, VisionProjectContent } from "@/components/wysiwyg/types";
import SharedBlockRenderer from "@/components/wysiwyg/SharedBlockRenderer";
import ImageGrid from "@/components/editor/ImageGrid";
import { ArrowLeft, ChevronRight } from "lucide-react";

interface VisionTemplatePageProps {
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

interface TierCardProps {
  label: string;
  sublabel: string;
  tier: TierData | undefined;
  recommended?: boolean;
}

const TierCard = ({ label, sublabel, tier, recommended }: TierCardProps) => {
  const hasContent = tier && tier.price && tier.price !== "$X-$X" && !tier.price.startsWith("[");
  return (
    <div
      className={`flex-1 min-w-0 rounded-lg border p-5 transition-colors ${
        recommended
          ? "border-accent bg-accent/5"
          : "border-border bg-card"
      }`}
    >
      {recommended && (
        <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-accent mb-2 font-semibold">
          Recommended
        </div>
      )}
      <div className="font-display text-lg text-primary mb-0.5">{label}</div>
      <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground mb-3">
        {sublabel}
      </div>
      {hasContent ? (
        <>
          <div className="font-sans text-xl font-semibold text-foreground mb-2">
            {tier.price}
          </div>
          {tier.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {tier.description}
            </p>
          )}
        </>
      ) : (
        <div className="text-sm italic text-muted-foreground">Configure tier</div>
      )}
    </div>
  );
};

const VisionTemplatePage = ({
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
}: VisionTemplatePageProps) => {
  const heroImage = images[0];
  const galleryImages = images.length > 1 ? images.slice(1) : [];
  const tiers = page.tiers;
  const chapterLabel = group?.title ?? "Strategy";

  // The vision_project block carries the hero identity (category, priority,
  // optional hero image). The template owns the page header: navy hero with
  // eyebrow, Cormorant title, and pills per prototype screens 27-28. The
  // block then contributes only its unique body sections.
  const visionBlock = blocks.find((b) => b.type === "vision_project");
  const vision = visionBlock
    ? (visionBlock.content as unknown as VisionProjectContent)
    : undefined;
  const heroImageUrl = vision?.imageUrl || heroImage;

  return (
    <div>
      {vision ? (
        /* Navy hero — full-width band with eyebrow, title, pills */
        <div
          className="relative flex flex-col justify-end min-h-[220px] sm:min-h-[280px] px-5 sm:px-8 md:px-10 py-8 sm:py-10"
          style={{
            background: heroImageUrl
              ? `url(${heroImageUrl}) center/cover`
              : "linear-gradient(135deg, hsl(var(--hbc-navy)) 0%, hsl(var(--hbc-navy) / 0.88) 100%)",
          }}
        >
          {heroImageUrl && (
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, hsl(var(--hbc-navy) / 0.2) 0%, hsl(var(--hbc-navy) / 0.85) 100%)",
              }}
            />
          )}
          <div className="relative max-w-[1040px] mx-auto w-full">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
              Vision Project{vision.priority ? ` · ${vision.priority}` : ""}
            </div>
            <h1
              className="font-display text-[28px] sm:text-[34px] leading-tight mt-2"
              style={{ color: "hsl(var(--hbc-cream))" }}
            >
              {vision.projectTitle || page.title}
            </h1>
            <div className="mt-3 flex gap-2.5 flex-wrap">
              {vision.category && (
                <span
                  className="font-mono text-[10px] uppercase tracking-[0.14em] px-2.5 py-[3px] rounded-[3px] whitespace-nowrap text-white"
                  style={{ background: "hsl(var(--hbc-gold))" }}
                >
                  {vision.category}
                </span>
              )}
              {vision.priority && (
                <span
                  className="font-mono text-[10px] uppercase tracking-[0.14em] px-2.5 py-[3px] rounded-[3px] whitespace-nowrap border"
                  style={{
                    color: "hsl(var(--hbc-cream))",
                    borderColor: "hsl(var(--hbc-cream) / 0.4)",
                  }}
                >
                  {vision.priority}
                </span>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div className="max-w-[1040px] mx-auto px-5 sm:px-8 md:px-10 py-8">
        {/* Fallback header for vision pages without a vision_project block */}
        {!vision && (
          <>
            {heroImage && (
              <div
                className="relative w-full h-[260px] sm:h-[340px] rounded-lg overflow-hidden mb-8 bg-cover bg-center"
                style={{ backgroundImage: `url(${heroImage})` }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(180deg, transparent 40%, rgba(10,22,40,0.55) 100%)",
                  }}
                />
              </div>
            )}
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent mb-2">
              Strategy · {chapterLabel}
            </div>
            <h1 className="font-display text-[28px] sm:text-[34px] text-primary leading-tight mb-3">
              {page.title}
            </h1>
            {page.timing && (
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-6">
                Timeline: {page.timing}
              </div>
            )}
            <hr className="border-border mb-8" />
          </>
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

        {/* Page-level tier cards — only when no vision_project block owns
            the Investment Ranges section */}
        {!vision && (
          <div className="mb-10">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent mb-4">
              Investment Tiers
            </h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <TierCard
                label="Essential"
                sublabel="Good"
                tier={tiers?.essential}
                recommended={false}
              />
              <TierCard
                label="Enhanced"
                sublabel="Better"
                tier={tiers?.enhanced}
                recommended={true}
              />
              <TierCard
                label="Signature"
                sublabel="Best"
                tier={tiers?.signature}
                recommended={false}
              />
            </div>
          </div>
        )}

      {/* Photo gallery */}
      {galleryImages.length > 0 && (
        <div className="mb-10">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent mb-4">
            Inspiration
          </h3>
          <ImageGrid images={galleryImages} />
        </div>
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
    </div>
  );
};

export default VisionTemplatePage;
