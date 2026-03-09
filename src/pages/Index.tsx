import { useState, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HomeTab from "@/components/tabs/HomeTab";
import ReportTab from "@/components/tabs/ReportTab";
import ProjectsTab from "@/components/tabs/ProjectsTab";
import PaymentsTab from "@/components/tabs/PaymentsTab";
import ContactsTab from "@/components/tabs/ContactsTab";
import ScheduleTab from "@/components/tabs/ScheduleTab";
import { useClientPortal } from "@/hooks/useClientPortal";
import type { PDFReportData } from "@/features/pdf/PDFReport";

const Index = () => {
  const { propertyId } = useParams<{ propertyId?: string }>();
  const portal = useClientPortal(propertyId);
  const [activeTab, setActiveTab] = useState("home");
  const [reportPageId, setReportPageId] = useState<string | null>(null);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    // Always reset to cover page when clicking "Report" tab
    if (tab === "report") {
      setReportPageId(null);
    } else if (tab !== "report") {
      setReportPageId(null);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleReportPageSelect = useCallback((pageId: string) => {
    setActiveTab("report");
    setReportPageId(pageId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleNavigate = useCallback((tab: string, pageId?: string) => {
    if (pageId) {
      handleReportPageSelect(pageId);
    } else {
      handleTabChange(tab);
    }
  }, [handleTabChange, handleReportPageSelect]);

  const propertyName = portal.property?.property_name || "Your Home";

  const pdfData: PDFReportData | undefined = useMemo(() => {
    if (!portal.hasDbData && Object.keys(portal.pages).length === 0) return undefined;
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    return {
      propertyName,
      address: portal.property?.address || "",
      date: dateStr,
      creatorName: portal.creatorName,
      creatorEmail: portal.creatorProfile?.email,
      creatorPhone: portal.creatorProfile?.phone,
      groups: portal.groups,
      pages: portal.pages,
      pageImages: portal.pageImages,
    };
  }, [propertyName, portal]);

  if (portal.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
          Loading your portal...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onReportPageSelect={handleReportPageSelect}
      />

      <main className="pt-20 pb-48 md:pb-[140px]">
        <div className={`transition-opacity duration-300 ${activeTab === "home" ? "opacity-100" : "opacity-0 hidden"}`}>
          {activeTab === "home" && (
            <HomeTab
              onNavigate={handleNavigate}
              propertyName={propertyName}
              completionPercent={portal.completionPercent}
              creatorName={portal.creatorName}
            />
          )}
        </div>
        <div className={`transition-opacity duration-300 ${activeTab === "report" ? "opacity-100" : "opacity-0 hidden"}`}>
          {activeTab === "report" && (
            <ReportTab
              activePageId={reportPageId}
              onNavigate={handleReportPageSelect}
              groups={portal.groups}
              pages={portal.pages}
              pageKeyToDbId={portal.pageKeyToDbId}
              pageImages={portal.pageImages}
              propertyName={propertyName}
              pdfData={pdfData}
            />
          )}
        </div>
        <div className={`transition-opacity duration-300 ${activeTab === "projects" ? "opacity-100" : "opacity-0 hidden"}`}>
          {activeTab === "projects" && <ProjectsTab onNavigate={handleNavigate} propertyId={portal.property?.id} pages={portal.pages} />}
        </div>
        <div className={`transition-opacity duration-300 ${activeTab === "payments" ? "opacity-100" : "opacity-0 hidden"}`}>
          {activeTab === "payments" && <PaymentsTab propertyId={portal.property?.id} />}
        </div>
        <div className={`transition-opacity duration-300 ${activeTab === "contacts" ? "opacity-100" : "opacity-0 hidden"}`}>
          {activeTab === "contacts" && <ContactsTab creator={portal.creatorProfile} />}
        </div>
        <div className={`transition-opacity duration-300 ${activeTab === "schedule" ? "opacity-100" : "opacity-0 hidden"}`}>
          {activeTab === "schedule" && <ScheduleTab propertyId={portal.property?.id} />}
        </div>
      </main>

      <Footer
        activeTab={activeTab}
        onNavigate={handleNavigate}
        reportContext={Object.values(portal.pages).map((p) => ({
          title: p.title,
          conditionRating: p.conditionRating,
          narrative: p.narrative,
          specs: p.specs,
          tiers: p.tiers,
          timing: p.timing,
          recommendations: p.recommendations,
        }))}
      />
    </div>
  );
};

export default Index;
