import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import RoomTemplatePage from "@/components/report/templates/RoomTemplatePage";
import SystemTemplatePage from "@/components/report/templates/SystemTemplatePage";
import VisionTemplatePage from "@/components/report/templates/VisionTemplatePage";
import {
  buildStructuredPagePayload,
  type StructuredPagePayload,
} from "@/lib/wizardPublishMapping";
import type { PageAuthoring, PageSeed } from "@/contexts/WizardContext";
import type { ReportPageData } from "@/data/reportContent";
import type { PortalGroup } from "@/hooks/useClientPortal";

// Phase 5b — Step 3's CLIENT PREVIEW pane for structured pages. Runs the
// live authoring state through the same buildStructuredPagePayload used at
// publish time and feeds the resulting typed blocks into the REAL client
// templates (RoomTemplatePage / SystemTemplatePage / VisionTemplatePage),
// so the preview is the publish pipeline, not a mock.

// The client templates are designed for a full-width portal viewport; the
// preview pane is narrower. Render them at a representative client width
// and scale the whole page down to fit the pane (a live miniature, exactly
// like the prototype's CLIENT PREVIEW column). Layout height is measured
// pre-transform, so the wrapper reserves the scaled height with no clipped
// or clamped prose.
const PREVIEW_BASE_WIDTH = 640;

function ScaledClientPreview({ children }: { children: ReactNode }) {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const measure = () => {
      const paneWidth = outerRef.current?.clientWidth ?? PREVIEW_BASE_WIDTH;
      const nextScale = Math.min(1, paneWidth / PREVIEW_BASE_WIDTH);
      const layoutHeight = innerRef.current?.offsetHeight ?? 0;
      setScale(nextScale);
      setHeight(layoutHeight > 0 ? layoutHeight * nextScale : undefined);
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (outerRef.current) observer.observe(outerRef.current);
    if (innerRef.current) observer.observe(innerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={outerRef} style={{ height }}>
      <div
        ref={innerRef}
        style={{
          width: PREVIEW_BASE_WIDTH,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}

interface StructuredPagePreviewProps {
  pageKey: string;
  title: string;
  group: string;
  sectionKey: string;
  sectionLabel: string;
  authoring: PageAuthoring | undefined;
  seed: PageSeed | undefined;
  /** Rendered when the page isn't a structured type or the payload fails. */
  fallback: ReactNode;
}

export function StructuredPagePreview({
  pageKey,
  title,
  group,
  sectionKey,
  sectionLabel,
  authoring,
  seed,
  fallback,
}: StructuredPagePreviewProps) {
  const payload = useMemo<StructuredPagePayload | null>(() => {
    const effective: PageAuthoring = authoring ?? {
      page_key: pageKey,
      status: "draft",
      is_featured: false,
      content: [],
    };
    try {
      return buildStructuredPagePayload({
        page: { page_key: pageKey, title, group },
        sectionKey,
        sectionLabel,
        authoring: effective,
        seed,
      });
    } catch {
      // Mid-edit state that fails schema validation previews via the
      // generic fallback; the publish QA gate reports it as blocking.
      return null;
    }
  }, [pageKey, title, group, sectionKey, sectionLabel, authoring, seed]);

  if (!payload) return <>{fallback}</>;

  const { columns, blocks, pageType } = payload;
  const conditionRating = (columns.condition_rating ??
    undefined) as ReportPageData["conditionRating"];
  const portalGroup: PortalGroup = {
    id: sectionKey,
    title: sectionLabel,
    pages: [pageKey],
  };
  const basePage: ReportPageData = {
    id: pageKey,
    title,
    group: sectionKey,
    conditionRating,
    narrative: [],
    specs: columns.specs ?? undefined,
  };

  const shared = {
    group: portalGroup,
    blocks,
    images: [] as string[],
    prevPage: null,
    nextPage: null,
    prevPageId: null,
    nextPageId: null,
  };

  return (
    <div className="rounded-lg bg-background shadow-hbc-sm overflow-hidden border border-hbc-border">
      <ScaledClientPreview>
        {pageType === "room" && (
          <RoomTemplatePage page={basePage} {...shared} />
        )}
        {(pageType === "system" || pageType === "appliance") && (
          <SystemTemplatePage
            page={
              {
                ...basePage,
                expected_lifespan_years:
                  columns.expected_lifespan_years ?? undefined,
                current_age_years: columns.current_age_years ?? undefined,
              } as ReportPageData
            }
            simplified={pageType === "appliance"}
            {...shared}
          />
        )}
        {pageType === "vision" && (
          <VisionTemplatePage page={basePage} {...shared} />
        )}
      </ScaledClientPreview>
    </div>
  );
}

// ─── Executive Summary preview (prototype screen 15) ──────────────────────
// Navy hero, italic serif pull-quote of the welcome note, and the numbered
// theme list. The exec summary has no dedicated client template component;
// this mirrors the published text blocks with the prototype's hero styling.

const COUNT_WORDS = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
];

function themeLines(topThemes: string): string[] {
  return topThemes
    .split(/\n+/)
    .map((line) => line.replace(/^\s*(?:\d+[.)]\s*|[-•*]\s*)/, "").trim())
    .filter((line) => line.length > 0);
}

export function ExecutiveSummaryPreview({
  familyName,
  addressLine,
  personalNote,
  topThemes,
}: {
  familyName: string;
  addressLine: string;
  personalNote: string;
  topThemes: string;
}) {
  const themes = themeLines(topThemes);
  const themesHeading =
    themes.length > 0 && themes.length < COUNT_WORDS.length
      ? `${COUNT_WORDS[themes.length]} theme${themes.length === 1 ? "" : "s"}`
      : "Top themes";
  const reportTitle = familyName
    ? `The ${familyName} Home Clarity Report`
    : "Your Home Clarity Report";

  return (
    <div className="rounded-lg bg-white shadow-hbc-sm overflow-hidden">
      <div className="bg-hbc-navy px-6 py-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-hbc-gold">
          Information · Executive Summary
        </div>
        <h2 className="font-display text-3xl text-white mt-2 leading-tight">
          {reportTitle}
        </h2>
        {addressLine && (
          <div className="text-xs font-sans text-white/70 mt-2">
            {addressLine}
          </div>
        )}
      </div>
      <div className="px-6 py-5 space-y-5">
        {personalNote ? (
          <blockquote className="border-l-2 border-hbc-gold pl-4">
            <p className="font-display italic text-lg text-hbc-navy leading-relaxed whitespace-pre-line">
              {personalNote}
            </p>
            <footer className="text-xs font-sans text-hbc-grey mt-2">
              Adam Kilgore, founder, Hometown Builders Club
            </footer>
          </blockquote>
        ) : (
          <p className="text-xs font-sans text-hbc-grey italic">
            The welcome note will appear here as you write.
          </p>
        )}
        {themes.length > 0 && (
          <div>
            <h3 className="font-display text-xl text-hbc-navy mb-3">
              {themesHeading}
            </h3>
            <ol className="space-y-3">
              {themes.map((theme, i) => (
                <li key={i} className="flex gap-3">
                  <span className="font-display text-hbc-gold-readable shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm font-sans text-foreground leading-relaxed">
                    {theme}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
