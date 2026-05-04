import { useState } from "react";
import ReportOverview from "@/components/report/ReportOverview";
import { TwinView } from "@/components/portal/report/TwinView";
import type { ReportPageData } from "@/data/reportContent";
import type { PortalGroup } from "@/hooks/useClientPortal";
import type { PDFReportData } from "@/features/pdf/PDFReport";

interface ReportHomeProps {
  groups: PortalGroup[];
  pages: Record<string, ReportPageData>;
  propertyName: string;
  propertyAddress: string;
  completionPercent: number;
  pdfData?: PDFReportData;
  onChapterSelect: (chapterId: string) => void;
  onPageSelect: (pageId: string) => void;
  onSendMessage?: (msg: string) => void;
  onTabChange?: (tab: string) => void;
  hoverUrl?: string | null;
  hoverPdfUrl?: string | null;
  iguideUrl?: string | null;
  iguidePdfUrl?: string | null;
  heroImageUrl?: string | null;
  estimatedValue?: number | null;
  propertyId?: string;
  creatorName?: string;
  isReportEmpty?: boolean;
}

export function ReportHome({
  onTabChange: _onTabChange,
  groups,
  pages,
  onPageSelect,
  ...overviewProps
}: ReportHomeProps) {
  const [view, setView] = useState<"cover" | "twin">("cover");

  return (
    <div>
      <div className="flex items-center justify-center gap-1 mb-6">
        <button
          onClick={() => setView("cover")}
          className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-colors min-h-[36px] ${
            view === "cover"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Cover view
        </button>
        <button
          onClick={() => setView("twin")}
          className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-colors min-h-[36px] ${
            view === "twin"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Twin view
        </button>
      </div>

      {view === "cover" ? (
        <ReportOverview
          groups={groups}
          pages={pages}
          onPageSelect={onPageSelect}
          {...overviewProps}
        />
      ) : (
        <TwinView groups={groups} pages={pages} onPageSelect={onPageSelect} />
      )}
    </div>
  );
}

export default ReportHome;
