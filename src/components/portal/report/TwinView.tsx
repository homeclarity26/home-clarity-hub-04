import type { PortalGroup } from "@/hooks/useClientPortal";
import type { ReportPageData } from "@/data/reportContent";

interface TwinViewProps {
  groups: PortalGroup[];
  pages: Record<string, ReportPageData>;
  onPageSelect: (pageId: string) => void;
}

const CONDITION_COLORS: Record<string, string> = {
  Excellent: "#2F6E40",
  Good: "#5A8A4F",
  Fair: "#B58A1F",
  Poor: "#B7410E",
  Critical: "#8B0000",
};

export function TwinView({ groups, pages, onPageSelect }: TwinViewProps) {
  const roomGroups = groups.filter(
    (g) => g.id.startsWith("interior-") || g.id.startsWith("exterior") || g.id === "spaces",
  );

  const allRoomPages = roomGroups.flatMap((g) =>
    g.pageIds
      .map((id) => pages[id])
      .filter((p): p is ReportPageData => p != null),
  );

  if (allRoomPages.length === 0) {
    return (
      <div className="py-12 text-center text-xs font-sans text-muted-foreground">
        No rooms available for the digital twin view yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl text-foreground mb-1">Digital Twin</h2>
        <p className="text-xs font-sans text-muted-foreground">
          Tap any room to view its full report page.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {allRoomPages.map((page) => {
          const condition = page.conditionRating;
          const condColor = condition ? CONDITION_COLORS[condition] : undefined;
          return (
            <button
              key={page.id}
              onClick={() => onPageSelect(page.id!)}
              className="group relative rounded-lg border border-border bg-card p-4 text-left hover:border-accent/40 hover:bg-accent/5 transition-all min-h-[80px] flex flex-col justify-between"
            >
              <p className="text-xs font-sans font-medium text-foreground group-hover:text-accent transition-colors line-clamp-2">
                {page.title}
              </p>
              {condColor && (
                <span
                  className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full"
                  style={{ background: condColor }}
                  title={condition ?? undefined}
                />
              )}
              {page.specs && Object.keys(page.specs).length > 0 && (
                <p className="text-[9px] font-mono text-muted-foreground mt-1 truncate">
                  {Object.values(page.specs).filter(Boolean).slice(0, 2).join(" · ")}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
