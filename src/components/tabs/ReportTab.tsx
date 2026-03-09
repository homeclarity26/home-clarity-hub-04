import { reportPages as staticPages, reportGroups as staticGroups, type ReportPageData } from "@/data/reportContent";
import ReportPage from "@/components/report/ReportPage";
import ImageGrid from "@/components/editor/ImageGrid";
import type { PortalGroup } from "@/hooks/useClientPortal";

interface ReportTabProps {
  activePageId: string | null;
  onNavigate?: (pageId: string) => void;
  groups?: PortalGroup[];
  pages?: Record<string, ReportPageData>;
  pageKeyToDbId?: Record<string, string>;
  pageImages?: Record<string, string[]>;
  propertyName?: string;
}

const ReportTab = ({
  activePageId,
  onNavigate,
  groups,
  pages,
  pageKeyToDbId = {},
  pageImages = {},
  propertyName = "The Johnson Residence",
}: ReportTabProps) => {
  const reportGroups = groups || staticGroups;
  const reportPages = pages || staticPages;

  const page = activePageId ? reportPages[activePageId] : null;

  if (page) {
    const dbPageId = pageKeyToDbId[activePageId!];
    const images = pageImages[activePageId!] || [];
    return (
      <div>
        <ReportPage page={page} onNavigate={onNavigate} dbPageId={dbPageId} />
        {images.length > 0 && (
          <div className="max-w-[800px] mx-auto px-6 md:px-20 pb-16">
            <h3 className="font-display text-2xl text-foreground mb-6">Photos</h3>
            <ImageGrid images={images} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="bg-primary text-primary-foreground py-16 md:py-24 px-6 md:px-20 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">
          {propertyName}
        </p>
        <h1 className="font-display text-3xl md:text-[48px] text-primary-foreground">
          Home Clarity Report
        </h1>
      </div>
      <div className="max-w-[800px] mx-auto px-6 md:px-20 py-16 md:py-24">
        <h2 className="font-display text-3xl text-foreground mb-10">
          Table of Contents
        </h2>
        <div className="space-y-8">
          {reportGroups.map((group) => (
            <div key={group.id}>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-3">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.pages.map((pageId) => {
                  const p = reportPages[pageId];
                  if (!p) return null;
                  return (
                    <button
                      key={pageId}
                      onClick={() => onNavigate?.(pageId)}
                      className="w-full text-left px-4 py-3 rounded-lg hover:bg-muted transition-colors flex items-center justify-between group"
                    >
                      <span className="text-base text-foreground font-sans group-hover:text-accent transition-colors">
                        {p.title}
                      </span>
                      {p.conditionRating && (
                        <span
                          className={`font-mono text-[10px] uppercase tracking-wider ${
                            p.conditionRating === "Excellent"
                              ? "text-accent"
                              : p.conditionRating === "Good"
                              ? "text-foreground"
                              : p.conditionRating === "Fair"
                              ? "text-muted-foreground"
                              : p.conditionRating === "Poor"
                              ? "text-orange-500"
                              : "text-destructive"
                          }`}
                        >
                          {p.conditionRating}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportTab;
