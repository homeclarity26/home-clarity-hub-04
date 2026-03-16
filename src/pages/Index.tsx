import { useState, useCallback, useMemo, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HomeTab from "@/components/tabs/HomeTab";
import ReportTab from "@/components/tabs/ReportTab";
import ProjectsTab from "@/components/tabs/ProjectsTab";
import PaymentsTab from "@/components/tabs/PaymentsTab";
import ContactsTab from "@/components/tabs/ContactsTab";
import ScheduleTab from "@/components/tabs/ScheduleTab";
import DocumentsTab from "@/components/tabs/DocumentsTab";
import { useClientPortal } from "@/hooks/useClientPortal";
import { useEditMode } from "@/contexts/EditModeContext";
import type { PDFReportData } from "@/features/pdf/PDFReport";

const Index = () => {
  const { propertyId } = useParams<{ propertyId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEditLink = searchParams.get("edit") === "true";
  const portal = useClientPortal(propertyId);
  const [activeTab, setActiveTab] = useState("home");
  const [reportPageId, setReportPageId] = useState<string | null>(null);
  const { editMode, toggleEditMode, canEdit } = useEditMode();

  // Read URL query params for edit mode and page navigation
  useEffect(() => {
    const editParam = searchParams.get("edit");
    const pageParam = searchParams.get("page");

    if (editParam === "true" && !editMode) {
      toggleEditMode();
    }

    if (pageParam) {
      setActiveTab("report");
      setReportPageId(pageParam);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setReportPageId(null);
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

  if (!portal.property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <h1 className="font-display text-2xl text-foreground">Your Portal is Being Prepared</h1>
          <p className="font-sans text-sm text-muted-foreground max-w-md">
            Your HBC advisor is setting up your home stewardship portal. You'll receive an email once it's ready.
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
            Questions? Contact your advisor directly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {isEditLink && canEdit && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground">
          <div className="max-w-[1200px] mx-auto px-4 py-2 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] hover:text-accent transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Admin
            </button>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary-foreground/50">
              Editing Portal Preview
            </span>
          </div>
        </div>
      )}
      <Header
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onReportPageSelect={handleReportPageSelect}
      />

      <main className={`${isEditLink && canEdit ? "pt-[calc(2rem+36px)]" : "pt-20"} pb-16`}>
        <div className={`transition-opacity duration-300 ${activeTab === "home" ? "opacity-100" : "opacity-0 hidden"}`}>
          {activeTab === "home" && (
          <HomeTab
              onNavigate={handleNavigate}
              onTabChange={handleTabChange}
              propertyName={propertyName}
              propertyAddress={portal.property?.address || ""}
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
              onTabChange={handleTabChange}
              groups={portal.groups}
              pages={portal.pages}
              pageKeyToDbId={portal.pageKeyToDbId}
              pageImages={portal.pageImages}
              propertyName={propertyName}
              propertyAddress={portal.property?.address || ""}
              pdfData={pdfData}
              reportId={portal.report?.id}
              propertyContext={portal.property ? {
                yearBuilt: portal.property.year_built ?? undefined,
                sqft: portal.property.sqft ?? undefined,
                bedrooms: portal.property.bedrooms ?? undefined,
                bathrooms: portal.property.bathrooms ?? undefined,
                propertyType: portal.property.property_type ?? undefined,
                relationshipType: portal.property.relationship_type ?? undefined,
                clientIntelligenceSummary: portal.property.client_intelligence_summary ?? undefined,
              } : undefined}
            />
          )}
        </div>
        <div className={`transition-opacity duration-300 ${activeTab === "projects" ? "opacity-100" : "opacity-0 hidden"}`}>
          {activeTab === "projects" && <ProjectsTab onNavigate={handleNavigate} onTabChange={handleTabChange} propertyId={portal.property?.id} pages={portal.pages} />}
        </div>
        <div className={`transition-opacity duration-300 ${activeTab === "payments" ? "opacity-100" : "opacity-0 hidden"}`}>
          {activeTab === "payments" && <PaymentsTab propertyId={portal.property?.id} onTabChange={handleTabChange} />}
        </div>
        <div className={`transition-opacity duration-300 ${activeTab === "contacts" ? "opacity-100" : "opacity-0 hidden"}`}>
          {activeTab === "contacts" && <ContactsTab creator={portal.creatorProfile} onTabChange={handleTabChange} propertyId={portal.property?.id} />}
        </div>
        <div className={`transition-opacity duration-300 ${activeTab === "documents" ? "opacity-100" : "opacity-0 hidden"}`}>
          {activeTab === "documents" && <DocumentsTab propertyId={portal.property?.id} />}
        </div>
        <div className={`transition-opacity duration-300 ${activeTab === "schedule" ? "opacity-100" : "opacity-0 hidden"}`}>
          {activeTab === "schedule" && <ScheduleTab propertyId={portal.property?.id} onTabChange={handleTabChange} />}
        </div>
      </main>

      <Footer
        activeTab={activeTab}
        onNavigate={handleNavigate}
        invoiceBalance={portal.invoiceBalance}
        reportContext={{
          propertyName,
          propertyAddress: portal.property?.address || "Unknown address",
          reportCompletionPercent: portal.completionPercent ?? 0,
          invoiceBalance: portal.invoiceBalance,
          pages: Object.values(portal.pages).map((p) => ({
            title: p.title,
            group: p.group,
            conditionRating: p.conditionRating,
            narrative: p.narrative,
            specs: p.specs,
            tiers: p.tiers,
            timing: p.timing,
            recommendations: p.recommendations,
          })),
        }}
      />
    </div>
  );
};

export default Index;
