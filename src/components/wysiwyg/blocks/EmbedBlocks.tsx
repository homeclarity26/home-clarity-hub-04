import { useState, useEffect } from "react";
import type { EmbedBlockContent } from "../types";

const GOLD = "#B87333";
const NAVY = "#0A1628";
const CREAM_LIGHT = "#F5F2EE";

// Mobile breakpoint matches the v2 prototype's isMobile = innerWidth < 768.
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isMobile;
}

interface EmbedBlockProps {
  content: EmbedBlockContent;
  editable?: boolean;
  onChange?: (content: EmbedBlockContent) => void;
  defaultTitle: string;
  emptyMessage: string;
  iconLabel: string;        // small uppercase eyebrow when no thumbnail
}

const BaseEmbedBlock = ({
  content,
  editable,
  onChange,
  defaultTitle,
  emptyMessage,
  iconLabel,
}: EmbedBlockProps) => {
  const update = (patch: Partial<EmbedBlockContent>) => onChange?.({ ...content, ...patch });
  const isMobile = useIsMobile();

  const title = content.title ?? defaultTitle;
  const hasUrl = !!content.url;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 pt-3 pb-2 border-b border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="font-mono text-[9px] uppercase tracking-[0.15em]" style={{ color: GOLD }}>
            {iconLabel}
          </span>
          {editable ? (
            <input
              className="flex-1 bg-transparent text-sm text-foreground outline-none"
              value={title}
              onChange={(e) => update({ title: e.target.value })}
            />
          ) : (
            <span className="text-sm text-foreground truncate">{title}</span>
          )}
        </div>
        {hasUrl && (
          <a
            href={content.url}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[10px] uppercase tracking-[0.15em] hover:underline shrink-0"
            style={{ color: GOLD }}
          >
            Open ↗
          </a>
        )}
      </div>

      <div className="aspect-[4/3] relative" style={{ background: CREAM_LIGHT }}>
        {!hasUrl ? (
          // Empty state
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: GOLD }}>
              {iconLabel}
            </span>
            <span className="text-xs mt-2 italic">{emptyMessage}</span>
          </div>
        ) : isMobile ? (
          // Mobile: thumbnail card with click-to-open (no iframe — saves bandwidth per [v1.21])
          <a
            href={content.url}
            target="_blank"
            rel="noreferrer"
            className="absolute inset-0 flex flex-col items-center justify-center text-foreground p-4 text-center"
            style={
              content.thumbnailUrl
                ? { backgroundImage: `url(${content.thumbnailUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                : undefined
            }
          >
            <div
              className="rounded px-3 py-2 font-mono text-[10px] uppercase tracking-[0.15em]"
              style={{ background: NAVY, color: "#EDE9E1" }}
            >
              Tap to open
            </div>
          </a>
        ) : (
          // Desktop: iframe
          <iframe
            src={content.url}
            title={title}
            className="absolute inset-0 w-full h-full border-0"
            allow="fullscreen"
            loading="lazy"
          />
        )}
      </div>

      {editable && (
        <div className="px-4 py-2 bg-muted/50 border-t border-border space-y-1">
          <input
            className="w-full bg-transparent text-xs text-foreground outline-none border-b border-border"
            value={content.url}
            onChange={(e) => update({ url: e.target.value })}
            placeholder="Embed URL (iframe src)"
            type="url"
          />
          <input
            className="w-full bg-transparent text-xs text-muted-foreground outline-none"
            value={content.thumbnailUrl ?? ""}
            onChange={(e) => update({ thumbnailUrl: e.target.value })}
            placeholder="Optional thumbnail URL (mobile preview)"
            type="url"
          />
        </div>
      )}
    </div>
  );
};

// Three exports — same component, different defaults. Wizard fills URL
// from properties.{hover_url | iguide_url | floor_plan_url} when seeding
// Portal Home per [v1.21].

export const HoverEmbedBlock = (props: Omit<EmbedBlockProps, "defaultTitle" | "emptyMessage" | "iconLabel">) => (
  <BaseEmbedBlock
    {...props}
    defaultTitle="Exterior 3D Scan (Hover)"
    emptyMessage="Hover scan URL not yet set"
    iconLabel="Hover · 3D"
  />
);

export const IGuideEmbedBlock = (props: Omit<EmbedBlockProps, "defaultTitle" | "emptyMessage" | "iconLabel">) => (
  <BaseEmbedBlock
    {...props}
    defaultTitle="Interior 360 Tour (iGUIDE)"
    emptyMessage="iGUIDE tour URL not yet set"
    iconLabel="iGUIDE · 360"
  />
);

export const FloorPlanEmbedBlock = (props: Omit<EmbedBlockProps, "defaultTitle" | "emptyMessage" | "iconLabel">) => (
  <BaseEmbedBlock
    {...props}
    defaultTitle="Floor Plans"
    emptyMessage="Floor plan URL not yet set"
    iconLabel="Floor Plan"
  />
);
