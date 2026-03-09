import { reportPages, reportGroups } from "@/data/reportContent";
import ReportPage from "@/components/report/ReportPage";

interface ReportTabProps {
  activePageId: string | null;
  onNavigate?: (pageId: string) => void;
}

const ReportTab = ({ activePageId, onNavigate }: ReportTabProps) => {
  const page = activePageId ? reportPages[activePageId] : null;

  if (page) {
    return <ReportPage page={page} onNavigate={onNavigate} />;
  }

  return (
    <div>
      <div className="bg-primary text-primary-foreground py-16 md:py-24 px-6 md:px-20 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">
          The Johnson Residence
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
                        <span className={`font-mono text-[10px] uppercase tracking-wider ${
                          p.conditionRating === "Excellent" ? "text-accent" :
                          p.conditionRating === "Good" ? "text-foreground" :
                          p.conditionRating === "Fair" ? "text-muted-foreground" :
                          p.conditionRating === "Poor" ? "text-orange-500" :
                          "text-destructive"
                        }`}>
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
