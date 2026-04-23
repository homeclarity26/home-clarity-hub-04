import { useState } from "react";

interface PageImageSlotProps {
  images?: string[];
  heroImageUrl?: string | null;
  caption?: string;
  onOpenGallery?: () => void;
  className?: string;
}

/**
 * HCR page image slot. Three modes:
 *  1. ≥1 gallery image  → 16:9 cover + gold "N Photos →" pill
 *  2. hero only         → 16:9 hero, no pill
 *  3. no images         → cream placeholder with dotted rules
 */
const PageImageSlot = ({
  images = [],
  heroImageUrl,
  caption = "Property photos",
  onOpenGallery,
  className = "",
}: PageImageSlotProps) => {
  const [errored, setErrored] = useState(false);
  const cover = images[0] || heroImageUrl || null;
  const hasGallery = images.length > 0 && !errored;

  if (cover && !errored) {
    return (
      <div className={`relative w-full overflow-hidden rounded bg-[hsl(var(--hbc-border))]/40 ${className}`}>
        <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
          <img
            src={cover}
            alt={caption}
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setErrored(true)}
            loading="lazy"
          />
          {hasGallery && (
            <button
              onClick={onOpenGallery}
              className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-primary-foreground font-sans text-[10px] uppercase tracking-[0.12em] font-semibold hover:bg-accent/90 transition-colors"
            >
              {images.length} Photo{images.length === 1 ? "" : "s"}
              <span aria-hidden>→</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Placeholder — cream surface with dotted rules, matches reference `.photo-area`
  return (
    <div
      className={`w-full flex items-center justify-center bg-[hsl(var(--hbc-border))]/60 border-t border-b border-dotted border-[hsl(var(--hbc-border))] h-[200px] md:h-[280px] ${className}`}
    >
      <span className="font-sans text-[10px] uppercase tracking-[0.12em] text-[hsl(var(--hbc-text-muted))]">
        {caption}
      </span>
    </div>
  );
};

export default PageImageSlot;
