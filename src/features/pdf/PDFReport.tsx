import { Document } from "@react-pdf/renderer";
import PDFCoverPage from "./PDFCoverPage";
import PDFTitlePage from "./PDFTitlePage";
import PDFTableOfContents from "./PDFTableOfContents";
import PDFSectionDivider from "./PDFSectionDivider";
import PDFSpacePage from "./PDFSpacePage";
import PDFRoadmapPage from "./PDFRoadmapPage";
import type { PortalGroup } from "@/hooks/useClientPortal";
import type { ReportPageData } from "@/data/reportContent";

// Import styles to trigger font registration
import "./pdfStyles";

export interface PDFBrandConfig {
  companyName: string;
  tagline?: string;
  logoUrl?: string;
}

export const DEFAULT_BRAND: PDFBrandConfig = {
  companyName: "Home Clarity Hub",
  tagline: "Professional Home Stewardship",
};

export interface PDFReportData {
  propertyName: string;
  address: string;
  date: string;
  coverImageUrl?: string;
  creatorName: string;
  creatorEmail?: string;
  creatorPhone?: string;
  groups: PortalGroup[];
  pages: Record<string, ReportPageData>;
  pageImages: Record<string, string[]>;
  brand?: PDFBrandConfig;
}

// Pages that should use the roadmap layout
const roadmapPageIds = ["financial-roadmap", "action-plan"];

const PDFReport = ({ data }: { data: PDFReportData }) => {
  const brand = data.brand || DEFAULT_BRAND;
  return (
  <Document
    title={`Home Clarity Report — ${data.propertyName}`}
    author={brand.companyName}
    subject="Home Clarity Report"
    creator={brand.companyName}
  >
    {/* Cover */}
    <PDFCoverPage
      propertyName={data.propertyName}
      address={data.address}
      date={data.date}
      coverImageUrl={data.coverImageUrl}
      brand={brand}
    />

    {/* Title / Inside Cover */}
    <PDFTitlePage
      creatorName={data.creatorName}
      creatorEmail={data.creatorEmail}
      creatorPhone={data.creatorPhone}
    />

    {/* Table of Contents */}
    <PDFTableOfContents
      groups={data.groups}
      pages={data.pages}
    />

    {/* Content: section divider + pages */}
    {data.groups.map((group, gi) => [
      <PDFSectionDivider
        key={`div-${group.id}`}
        sectionTitle={group.title}
        sectionNumber={gi + 1}
      />,
      ...group.pages.map((pageId) => {
        const page = data.pages[pageId];
        if (!page) return null;

        const images = data.pageImages[pageId] || [];

        if (roadmapPageIds.includes(pageId)) {
          return (
            <PDFRoadmapPage
              key={pageId}
              page={page}
            />
          );
        }

        return (
          <PDFSpacePage
            key={pageId}
            page={page}
            groupName={group.title}
            images={images}
          />
        );
      }),
    ])}
  </Document>
  );
};

export default PDFReport;
