import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { ReportPageData } from "@/data/reportContent";
import type { Json } from "@/integrations/supabase/types";
import type { BlockConfig, PageContent } from "@/lib/templateUtils";
import { computePageStatus } from "@/lib/templateUtils";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

// Extended page data that includes all DB fields
export interface ExtendedPageData extends ReportPageData {
  key_observations?: string[];
  dependencies?: { pageKey: string; title: string; type: "before" | "after" }[];
  risks?: string[];
  maintenance?: { frequency?: string; tasks: string[] };
  creator_notes?: string;
}

export function useReportPage(pageKey: string, fallbackData: ReportPageData, reportId?: string) {
  const { user, isCreator } = useAuth();
  const [pageData, setPageData] = useState<ExtendedPageData>(fallbackData);
  const [blockConfig, setBlockConfig] = useState<BlockConfig | null>(null);
  const [pageId, setPageId] = useState<string | null>(null);
  const [dbReportId, setDbReportId] = useState<string | null>(reportId || null);
  const [status, setStatus] = useState<"draft" | "complete" | "needs_review">("draft");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isLoading, setIsLoading] = useState(true);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingChangesRef = useRef<Partial<ExtendedPageData> | null>(null);

  // Load page data from database
  useEffect(() => {
    async function loadPage() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Dev bypass: skip Supabase query for mock user, use fallback data directly
      if (user.id === "00000000-0000-0000-0000-000000000000") {
        setIsLoading(false);
        return;
      }

      try {
        let query = supabase
          .from("report_pages")
          .select("*")
          .eq("page_key", pageKey);

        // Scope to specific report if provided
        if (reportId) {
          query = query.eq("report_id", reportId);
        }

        const { data: pages, error } = await query.limit(1);

        if (error) throw error;

        if (pages && pages.length > 0) {
          const row = pages[0];
          setPageId(row.id);
          setDbReportId(row.report_id);
          setStatus(row.status as "draft" | "complete" | "needs_review");
          setBlockConfig((row.block_config as unknown as BlockConfig) || null);
          
          setPageData({
            id: row.page_key,
            title: row.title,
            group: row.group_name,
            conditionRating: row.condition_rating as ReportPageData["conditionRating"],
            narrative: (row.narrative as unknown as string[]) || [],
            specs: (row.specs as unknown as { label: string; value: string }[]) || undefined,
            tiers: row.tiers as unknown as ReportPageData["tiers"],
            timing: row.timing || undefined,
            recommendations: (row.recommendations as unknown as string[]) || undefined,
            images: (row.images as unknown as string[]) || undefined,
            key_observations: (row.key_observations as unknown as string[]) || undefined,
            risks: (row.risks as unknown as string[]) || undefined,
            dependencies: (row.dependencies as unknown as { pageKey: string; title: string; type: "before" | "after" }[]) || undefined,
            maintenance: (row.maintenance as unknown as { frequency?: string; tasks: string[] }) || undefined,
            creator_notes: row.creator_notes || undefined,
          });
        }
        // If no page found, just use fallback data — no auto-creation
      } catch (err) {
        console.error("Error loading report page:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadPage();
  }, [pageKey, user, fallbackData, reportId]);

  // Debounced save function
  const saveToDatabase = useCallback(async (updates: Partial<ExtendedPageData>) => {
    if (!isCreator || !user) return;

    setSaveStatus("saving");

    try {
      // If no page exists and no reportId, we can't save — skip silently
      if (!pageId && !dbReportId) {
        console.warn("Cannot save: no page or report context");
        setSaveStatus("idle");
        return;
      }

      if (!pageId && dbReportId) {
        // Create a new page in the existing report
        const insertData = {
          report_id: dbReportId,
          page_key: pageKey,
          title: pageData.title,
          group_name: pageData.group,
          condition_rating: pageData.conditionRating || null,
          narrative: pageData.narrative as unknown as Json,
          specs: (pageData.specs || []) as unknown as Json,
          tiers: (pageData.tiers as unknown as Json) || null,
          timing: pageData.timing || null,
          recommendations: (pageData.recommendations || []) as unknown as Json,
          key_observations: (pageData.key_observations || null) as unknown as Json,
          risks: (pageData.risks || null) as unknown as Json,
          dependencies: (pageData.dependencies || null) as unknown as Json,
          maintenance: (pageData.maintenance || null) as unknown as Json,
          creator_notes: pageData.creator_notes || null,
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
        if (updates.images !== undefined) updateData.images = updates.images;
        if (updates.key_observations !== undefined) updateData.key_observations = updates.key_observations;
        if (updates.risks !== undefined) updateData.risks = updates.risks;
        if (updates.dependencies !== undefined) updateData.dependencies = updates.dependencies;
        if (updates.maintenance !== undefined) updateData.maintenance = updates.maintenance;
        if (updates.creator_notes !== undefined) updateData.creator_notes = updates.creator_notes;

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

      // Auto-compute status from block config + content
      const mergedData = { ...pageData, ...updates };
      const contentForStatus: PageContent = {
        title: mergedData.title,
        conditionRating: mergedData.conditionRating,
        narrative: mergedData.narrative,
        key_observations: mergedData.key_observations,
        specs: mergedData.specs,
        tiers: mergedData.tiers as PageContent["tiers"],
        timing: mergedData.timing,
        dependencies: mergedData.dependencies,
        risks: mergedData.risks,
        images: mergedData.images,
        maintenance: mergedData.maintenance,
        creator_notes: mergedData.creator_notes,
      };
      const computedStatus = computePageStatus(blockConfig, contentForStatus);
      if (computedStatus !== status && pageId) {
        await supabase.from("report_pages").update({ status: computedStatus }).eq("id", pageId);
        setStatus(computedStatus as "draft" | "complete" | "needs_review");
      }

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      console.error("Error saving report page:", err);
      setSaveStatus("error");
      toast.error("Failed to save changes");
    }
  }, [isCreator, user, pageId, dbReportId, pageKey, pageData, blockConfig, status]);

  // Update page data with debounced save
  const updatePageData = useCallback((updates: Partial<ExtendedPageData>) => {
    setPageData(prev => ({ ...prev, ...updates }));

    pendingChangesRef.current = {
      ...pendingChangesRef.current,
      ...updates,
    };

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

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
        if (pendingChangesRef.current) {
          saveToDatabase(pendingChangesRef.current);
        }
      }
    };
  }, [saveToDatabase]);

  return {
    pageData,
    blockConfig,
    pageId,
    status,
    saveStatus,
    isLoading,
    updatePageData,
    updateStatus,
  };
}