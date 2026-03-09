import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { ReportPageData } from "@/data/reportContent";
import type { Json } from "@/integrations/supabase/types";

interface ReportPageRow {
  id: string;
  report_id: string;
  page_key: string;
  title: string;
  group_name: string;
  condition_rating: string | null;
  narrative: string[];
  health_bar: { label: string; current: number; total: number; unit: string } | null;
  specs: { label: string; value: string }[] | null;
  tiers: { essential: { price: string; description: string }; enhanced: { price: string; description: string }; signature: { price: string; description: string } } | null;
  timing: string | null;
  recommendations: string[] | null;
  images: string[] | null;
  status: "draft" | "complete" | "needs_review";
  updated_at: string;
}

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useReportPage(pageKey: string, fallbackData: ReportPageData) {
  const { user, isCreator } = useAuth();
  const [pageData, setPageData] = useState<ReportPageData>(fallbackData);
  const [pageId, setPageId] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [status, setStatus] = useState<"draft" | "complete" | "needs_review">("draft");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isLoading, setIsLoading] = useState(true);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingChangesRef = useRef<Partial<ReportPageData> | null>(null);

  // Load page data from database
  useEffect(() => {
    async function loadPage() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Get the report page by page_key
        const { data: pages, error } = await supabase
          .from("report_pages")
          .select("*")
          .eq("page_key", pageKey)
          .limit(1);

        if (error) throw error;

        if (pages && pages.length > 0) {
          const row = pages[0];
          setPageId(row.id);
          setReportId(row.report_id);
          setStatus(row.status as "draft" | "complete" | "needs_review");
          
          // Convert DB row to ReportPageData
          setPageData({
            id: row.page_key,
            title: row.title,
            group: row.group_name,
            conditionRating: row.condition_rating as ReportPageData["conditionRating"],
            narrative: (row.narrative as unknown as string[]) || [],
            healthBar: row.health_bar as unknown as ReportPageData["healthBar"],
            specs: (row.specs as unknown as { label: string; value: string }[]) || undefined,
            tiers: row.tiers as unknown as ReportPageData["tiers"],
            timing: row.timing || undefined,
            recommendations: (row.recommendations as unknown as string[]) || undefined,
          });
        }
        // If no data in DB, keep using fallbackData
      } catch (err) {
        console.error("Error loading report page:", err);
        // Keep using fallback data
      } finally {
        setIsLoading(false);
      }
    }

    loadPage();
  }, [pageKey, user, fallbackData]);

  // Debounced save function
  const saveToDatabase = useCallback(async (updates: Partial<ReportPageData>) => {
    if (!isCreator || !user) return;

    setSaveStatus("saving");

    try {
      // If no pageId, we need to create the page (and possibly the report)
      if (!pageId) {
        // First, get or create a report for the demo property
        let reportIdToUse = reportId;
        
        if (!reportIdToUse) {
          // Check if there's an existing report
          const { data: existingReports } = await supabase
            .from("reports")
            .select("id")
            .limit(1);

          if (existingReports && existingReports.length > 0) {
            reportIdToUse = existingReports[0].id;
          } else {
            // Need a property first - check if one exists
            const { data: properties } = await supabase
              .from("properties")
              .select("id")
              .limit(1);

            let propertyId: string;
            if (properties && properties.length > 0) {
              propertyId = properties[0].id;
            } else {
              // Create a demo property
              const { data: newProperty, error: propError } = await supabase
                .from("properties")
                .insert({
                  address: "742 Evergreen Terrace",
                  client_user_id: user.id,
                  property_name: "The Johnson Residence",
                })
                .select()
                .single();

              if (propError) throw propError;
              propertyId = newProperty.id;
            }

            // Create the report
            const { data: newReport, error: reportError } = await supabase
              .from("reports")
              .insert({
                property_id: propertyId,
                title: "Home Clarity Report",
                created_by: user.id,
              })
              .select()
              .single();

            if (reportError) throw reportError;
            reportIdToUse = newReport.id;
          }
          setReportId(reportIdToUse);
        }

        // Create the page
        const insertData = {
          report_id: reportIdToUse,
          page_key: pageKey,
          title: pageData.title,
          group_name: pageData.group,
          condition_rating: pageData.conditionRating || null,
          narrative: pageData.narrative as unknown as Record<string, unknown>,
          health_bar: pageData.healthBar as unknown as Record<string, unknown> || null,
          specs: (pageData.specs || []) as unknown as Record<string, unknown>,
          tiers: pageData.tiers as unknown as Record<string, unknown> || null,
          timing: pageData.timing || null,
          recommendations: (pageData.recommendations || []) as unknown as Record<string, unknown>,
        };
        
        const { data: newPage, error: pageError } = await supabase
          .from("report_pages")
          .insert([insertData])
          .select()
          .single();

        if (pageError) throw pageError;
        setPageId(newPage.id);
      }

      // Update existing page
      if (pageId) {
        const updateData: Record<string, unknown> = {};
        
        if (updates.narrative !== undefined) updateData.narrative = updates.narrative;
        if (updates.recommendations !== undefined) updateData.recommendations = updates.recommendations;
        if (updates.title !== undefined) updateData.title = updates.title;
        if (updates.conditionRating !== undefined) updateData.condition_rating = updates.conditionRating;
        if (updates.specs !== undefined) updateData.specs = updates.specs;
        if (updates.tiers !== undefined) updateData.tiers = updates.tiers;
        if (updates.timing !== undefined) updateData.timing = updates.timing;

        const { error } = await supabase
          .from("report_pages")
          .update(updateData)
          .eq("id", pageId);

        if (error) throw error;

        // Log to edit history
        for (const [field, value] of Object.entries(updates)) {
          await supabase.from("report_edit_history").insert({
            report_page_id: pageId,
            edited_by: user.id,
            field_name: field,
            new_value: JSON.stringify(value),
          });
        }
      }

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      console.error("Error saving report page:", err);
      setSaveStatus("error");
      toast.error("Failed to save changes");
    }
  }, [isCreator, user, pageId, reportId, pageKey, pageData]);

  // Update page data with debounced save
  const updatePageData = useCallback((updates: Partial<ReportPageData>) => {
    // Update local state immediately
    setPageData(prev => ({ ...prev, ...updates }));

    // Accumulate pending changes
    pendingChangesRef.current = {
      ...pendingChangesRef.current,
      ...updates,
    };

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new debounced save (2 seconds)
    saveTimeoutRef.current = setTimeout(() => {
      if (pendingChangesRef.current) {
        saveToDatabase(pendingChangesRef.current);
        pendingChangesRef.current = null;
      }
    }, 2000);
  }, [saveToDatabase]);

  // Update page status
  const updateStatus = useCallback(async (newStatus: "draft" | "complete" | "needs_review") => {
    if (!pageId || !isCreator) return;

    try {
      const { error } = await supabase
        .from("report_pages")
        .update({ status: newStatus })
        .eq("id", pageId);

      if (error) throw error;
      setStatus(newStatus);
      toast.success(`Page marked as ${newStatus}`);
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Failed to update status");
    }
  }, [pageId, isCreator]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        // Save any pending changes immediately
        if (pendingChangesRef.current) {
          saveToDatabase(pendingChangesRef.current);
        }
      }
    };
  }, [saveToDatabase]);

  return {
    pageData,
    pageId,
    status,
    saveStatus,
    isLoading,
    updatePageData,
    updateStatus,
  };
}
