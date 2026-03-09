import { useState } from "react";
import { reportPages as staticPages, reportGroups as staticGroups, type ReportPageData } from "@/data/reportContent";
import ReportPage from "@/components/report/ReportPage";
import ImageGrid from "@/components/editor/ImageGrid";
import type { PortalGroup } from "@/hooks/useClientPortal";
import type { PDFReportData } from "@/features/pdf/PDFReport";
import PDFDownloadButton from "@/features/pdf/PDFDownloadButton";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
  Box,
  Ruler,
  LayoutDashboard,
  View,
  FileText,
  Home,
  Layers,
  Settings,
  Target,
  Award,
  MessageCircle,
  Phone,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";

interface ReportTabProps {
  activePageId: string | null;
  onNavigate?: (pageId: string) => void;
  onTabChange?: (tab: string) => void;
  groups?: PortalGroup[];
  pages?: Record<string, ReportPageData>;
  pageKeyToDbId?: Record<string, string>;
  pageImages?: Record<string, string[]>;
  propertyName?: string;
  propertyAddress?: string;
  pdfData?: PDFReportData;
  reportId?: string;
}

const conditionColor: Record<string, string> = {
  Excellent: "bg-emerald-100 text-emerald-700",
  Good: "bg-primary/10 text-primary",
  Fair: "bg-accent/20 text-accent-foreground",
  Poor: "bg-orange-100 text-orange-600",
  Critical: "bg-destructive/10 text-destructive",
};

const digitalAssets = [
  { icon: Box, title: "Your Home in 3D", subtitle: "Explore the full exterior model", href: "#" },
  { icon: Ruler, title: "Exterior Measurements", subtitle: "50-page detailed measurement report", href: "#" },
  { icon: LayoutDashboard, title: "Interior Floor Plans", subtitle: "Room-by-room layout and dimensions", href: "#" },
  { icon: View, title: "360° Photo Tour", subtitle: "Walk through every room", href: "#" },
];

interface SectionCardDef {
  id: string;
  icon: typeof FileText;
  title: string;
  subtitle: string;
  groupIds: string[];
  gold?: boolean;
}

const sectionCards: SectionCardDef[] = [
  { id: "full", icon: FileText, title: "Full Report", subtitle: "Read the complete home assessment", groupIds: [] },
  { id: "exterior", icon: Home, title: "Exterior Assessment", subtitle: "Roof, siding, windows, landscaping & more", groupIds: ["exterior"] },
  { id: "interior", icon: Layers, title: "Interior Assessment", subtitle: "Kitchen, bathrooms, bedrooms & every room", groupIds: ["interior"] },
  { id: "systems", icon: Settings, title: "Systems & Equipment", subtitle: "HVAC, electrical, plumbing & appliances", groupIds: ["systems"] },
  { id: "strategy", icon: Target, title: "Strategic Plan", subtitle: "Your 10-year financial roadmap", groupIds: ["strategy"], gold: true },
];

const ReportTab = ({
  activePageId,
  onNavigate,
  onTabChange,
  groups,
  pages,
  pageKeyToDbId = {},
  pageImages = {},
  propertyName = "The Johnson Residence",
  propertyAddress = "",
  pdfData,
  reportId,
}: ReportTabProps) => {
  const reportGroups = groups || staticGroups;
  const reportPages = pages || staticPages;
  const [showFullTOC, setShowFullTOC] = useState(false);

  const page = activePageId ? reportPages[activePageId] : null;

  // --- Individual report page view (unchanged) ---
  if (page) {
    const dbPageId = pageKeyToDbId[activePageId!];
    const images = pageImages[activePageId!] || [];
    const group = reportGroups.find(g => g.pages.includes(activePageId!));
    return (
      <div>
        <div className="max-w-[800px] mx-auto px-6 md:px-20 pt-8">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.15em]"
                  onClick={() => onNavigate?.("")}
                >
                  Report
                </BreadcrumbLink>
              </BreadcrumbItem>
              {group && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                      {group.title}
                    </span>
                  </BreadcrumbItem>
                </>
              )}
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-mono text-[11px] uppercase tracking-[0.15em]">
                  {page.title}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <ReportPage page={page} onNavigate={onNavigate} dbPageId={dbPageId} images={images} pdfData={pdfData} reportId={reportId} />
        {images.length > 0 && (
          <div className="max-w-[800px] mx-auto px-6 md:px-20 pb-16">
            <h3 className="font-display text-2xl text-foreground mb-6">Photos</h3>
            <ImageGrid images={images} />
          </div>
        )}
      </div>
    );
  }

  // --- Full TOC view ---
  if (showFullTOC) {
    return (
      <div className="max-w-[800px] mx-auto px-6 md:px-20 py-12">
        <button
          onClick={() => setShowFullTOC(false)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 font-mono text-[11px] uppercase tracking-[0.15em]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Overview
        </button>
        <h2 className="font-display text-3xl text-foreground mb-10">Complete Report</h2>
        <div className="space-y-10">
          {reportGroups.map((group) => (
            <div key={group.id}>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-4 pb-2 border-b border-border">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.pages.map((pageId, index) => {
                  const p = reportPages[pageId];
                  if (!p) return null;
                  return (
                    <button
                      key={pageId}
                      onClick={() => onNavigate?.(pageId)}
                      className="w-full text-left px-4 py-4 rounded-lg hover:bg-muted transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-[10px] text-muted-foreground/50 w-5 text-right">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="text-base text-foreground font-sans group-hover:text-accent transition-colors">
                          {p.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        {p.conditionRating && (
                          <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${conditionColor[p.conditionRating] || ""}`}>
                            {p.conditionRating}
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent transition-colors" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Helper: get page count and first page id for a set of group ids
  const getGroupInfo = (groupIds: string[]) => {
    const matched = reportGroups.filter(g => groupIds.includes(g.id));
    const allPages = matched.flatMap(g => g.pages);
    const firstPage = allPages[0] || "";
    // Collect condition ratings for badges
    const ratings: Record<string, number> = {};
    allPages.forEach(pid => {
      const r = reportPages[pid]?.conditionRating;
      if (r) ratings[r] = (ratings[r] || 0) + 1;
    });
    return { count: allPages.length, firstPage, ratings };
  };

  // --- Cover page / bento grid ---
  return (
    <div>
      {/* Hero */}
      <div className="bg-primary text-primary-foreground py-20 md:py-28 px-6 md:px-20 text-center relative">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-4">
          {propertyName}
        </p>
        <h1 className="font-display text-4xl md:text-[56px] leading-tight text-primary-foreground mb-3">
          Home Clarity Report
        </h1>
        {propertyAddress && (
          <p className="font-sans text-base text-primary-foreground/70 mb-4">
            {propertyAddress}
          </p>
        )}
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-primary-foreground/50">
          Your complete home stewardship guide
        </p>
        {pdfData && (
          <div className="absolute top-6 right-6">
            <PDFDownloadButton
              data={pdfData}
              variant="ghost"
              size="sm"
              className="bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground text-xs font-mono uppercase tracking-wider"
              label="Download PDF"
            />
          </div>
        )}
      </div>

      {/* Card Grid */}
      <div className="max-w-[1000px] mx-auto px-6 md:px-10 py-12 md:py-16 space-y-12">

        {/* Row 1: Digital Home Assets */}
        <section>
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">
            Your Digital Home
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {digitalAssets.map((asset) => (
              <a
                key={asset.title}
                href={asset.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-primary rounded-lg p-6 border-l-[3px] border-accent hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 flex flex-col gap-3"
              >
                <asset.icon className="w-6 h-6 text-accent" />
                <h3 className="font-display text-lg text-primary-foreground leading-snug">
                  {asset.title}
                </h3>
                <p className="font-sans text-sm text-primary-foreground/60 leading-relaxed">
                  {asset.subtitle}
                </p>
                <ChevronRight className="w-4 h-4 text-accent mt-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </div>
        </section>

        {/* Row 2: Report Navigation */}
        <section>
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">
            Report Sections
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sectionCards.map((card) => {
              const isFullReport = card.id === "full";
              const info = isFullReport ? null : getGroupInfo(card.groupIds);

              const handleClick = () => {
                if (isFullReport) {
                  setShowFullTOC(true);
                } else if (info?.firstPage) {
                  onNavigate?.(info.firstPage);
                }
              };

              return (
                <button
                  key={card.id}
                  onClick={handleClick}
                  className={`group text-left bg-card rounded-lg p-8 shadow-hbc-sm hover:shadow-hbc-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3 border min-h-[180px] ${
                    card.gold ? "border-border border-l-[3px] border-l-accent" : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <card.icon className={`w-5 h-5 ${card.gold ? "text-accent" : "text-muted-foreground"}`} />
                    {info && info.count > 0 && (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {info.count} section{info.count !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-xl text-foreground leading-snug">
                    {card.title}
                  </h3>
                  <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                    {card.subtitle}
                  </p>
                  {/* Condition rating badges */}
                  {info && Object.keys(info.ratings).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {Object.entries(info.ratings).map(([rating, count]) => (
                        <span
                          key={rating}
                          className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full ${conditionColor[rating] || ""}`}
                        >
                          {count} {rating}
                        </span>
                      ))}
                    </div>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent transition-colors mt-auto" />
                </button>
              );
            })}
          </div>
        </section>

        {/* Row 3: Quick Access */}
        <section>
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">
            Quick Access
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a
              href="https://hometownbuildersclub.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-card rounded-lg p-6 shadow-hbc-sm hover:shadow-hbc-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-2 border border-border"
            >
              <Award className="w-5 h-5 text-accent" />
              <h3 className="font-display text-lg text-foreground">Your HBC Membership</h3>
              <p className="font-sans text-sm text-muted-foreground">Lifetime access & advisory services</p>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent transition-colors mt-auto" />
            </a>

            <button
              onClick={() => {
                // Focus the footer search input to trigger chat
                const input = document.querySelector('footer input[type="text"]') as HTMLInputElement | null;
                if (input) {
                  input.focus();
                  input.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="group text-left bg-card rounded-lg p-6 shadow-hbc-sm hover:shadow-hbc-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-2 border border-border"
            >
              <MessageCircle className="w-5 h-5 text-accent" />
              <h3 className="font-display text-lg text-foreground">Ask a Question</h3>
              <p className="font-sans text-sm text-muted-foreground">AI-powered answers about your home</p>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent transition-colors mt-auto" />
            </button>

            <button
              onClick={() => onTabChange?.("contacts")}
              className="group text-left bg-card rounded-lg p-6 shadow-hbc-sm hover:shadow-hbc-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-2 border border-border"
            >
              <Phone className="w-5 h-5 text-accent" />
              <h3 className="font-display text-lg text-foreground">Contact Your Advisor</h3>
              <p className="font-sans text-sm text-muted-foreground">Adam Kinney — Founder & Lead Advisor</p>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent transition-colors mt-auto" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ReportTab;
