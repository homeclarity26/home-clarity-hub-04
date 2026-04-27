import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ReportOverview from "@/components/report/ReportOverview";
import DocumentsTab from "@/components/tabs/DocumentsTab";
import EquipmentTab from "@/components/tabs/EquipmentTab";
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

/**
 * ReportHome — the written record. Distinct from PortalHome (embeds + brief).
 *
 * Wraps the existing ReportOverview document cover + chapter index,
 * then folds Documents and Equipment in as collapsible sections per C12.
 * The per-page reader is rendered separately by ReportTab when activePageId
 * is set.
 */
export function ReportHome({
  onTabChange,
  ...overviewProps
}: ReportHomeProps) {
  return (
    <div>
      <ReportOverview {...overviewProps} />

      <div className="max-w-[1040px] mx-auto px-6 sm:px-8 md:px-10 pb-16 space-y-4">
        <Collapsible>
          <CollapsibleTrigger className="group w-full flex items-center justify-between text-left bg-card rounded-lg border border-border px-5 py-4 hover:border-accent/40 transition-colors [&[data-state=open]>svg]:rotate-180">
            <div>
              <p className="font-display text-lg text-foreground">Documents</p>
              <p className="font-sans text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-0.5">
                Plans, warranties, manuals, inspections
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-6">
            <DocumentsTab propertyId={overviewProps.propertyId} />
          </CollapsibleContent>
        </Collapsible>

        <Collapsible>
          <CollapsibleTrigger className="group w-full flex items-center justify-between text-left bg-card rounded-lg border border-border px-5 py-4 hover:border-accent/40 transition-colors [&[data-state=open]>svg]:rotate-180">
            <div>
              <p className="font-display text-lg text-foreground">Equipment</p>
              <p className="font-sans text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-0.5">
                Major systems, appliances, serial numbers
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-6">
            <EquipmentTab
              propertyId={overviewProps.propertyId}
              onTabChange={onTabChange}
              onSendMessage={overviewProps.onSendMessage}
            />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}

export default ReportHome;
