import { useState, useCallback } from "react";
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

const Index = () => {
  const { propertyId } = useParams<{ propertyId?: string }>();
  const portal = useClientPortal(propertyId);
  const [activeTab, setActiveTab] = useState("home");
  const [reportPageId, setReportPageId] = useState<string | null>(null);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    if (tab !== "report") setReportPageId(null);
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

  if (portal.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
          Loading your portal...
        </div>
      </div>
    );
  }

  const propertyName = portal.property?.property_name || "Your Home";

  return (
    <div className="min-h-screen bg-background">
      <Header
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onReportPageSelect={handleReportPageSelect}
        groups={portal.groups}
        pages={portal.pages}
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
            />
          )}
        </div>
        <div className={`transition-opacity duration-300 ${activeTab === "projects" ? "opacity-100" : "opacity-0 hidden"}`}>
          {activeTab === "projects" && <ProjectsTab onNavigate={handleNavigate} />}
        </div>
        <div className={`transition-opacity duration-300 ${activeTab === "payments" ? "opacity-100" : "opacity-0 hidden"}`}>
          {activeTab === "payments" && <PaymentsTab />}
        </div>
        <div className={`transition-opacity duration-300 ${activeTab === "contacts" ? "opacity-100" : "opacity-0 hidden"}`}>
          {activeTab === "contacts" && <ContactsTab />}
        </div>
        <div className={`transition-opacity duration-300 ${activeTab === "schedule" ? "opacity-100" : "opacity-0 hidden"}`}>
          {activeTab === "schedule" && <ScheduleTab />}
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
