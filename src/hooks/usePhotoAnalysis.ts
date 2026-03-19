import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { PhotoAnalysis } from "@/components/wysiwyg/blocks/PhotoAnalysisPanel";

interface UsePhotoAnalysisOptions {
  sectionType?: string;
  reportId?: string;
  reportPageId?: string;
  propertyId?: string;
  propertyContext?: {
    age?: number;
    location?: string;
    existing_condition?: string;
    property_type?: string;
  };
}

export function usePhotoAnalysis(options: UsePhotoAnalysisOptions = {}) {
  const [analyses, setAnalyses] = useState<PhotoAnalysis[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingCount, setAnalyzingCount] = useState({ current: 0, total: 0 });
  const queueRef = useRef<string[]>([]);

  const analyzePhoto = useCallback(async (photoUrl: string): Promise<PhotoAnalysis | null> => {
    try {
      const { data, error } = await supabase.functions.invoke("analyze-photo", {
        body: {
          photo_url: photoUrl,
          section_type: options.sectionType,
          property_context: options.propertyContext,
        },
      });

      if (error) throw error;

      const analysis: PhotoAnalysis = { ...data, photo_url: photoUrl };

      // Save to photo_analyses table
      await supabase.from("photo_analyses" as any).insert({
        photo_url: photoUrl,
        report_id: options.reportId || null,
        report_page_id: options.reportPageId || null,
        property_id: options.propertyId || null,
        section_type: options.sectionType || null,
        condition_rating: analysis.condition_rating,
        confidence_score: analysis.confidence_score,
        identified_defects: analysis.identified_defects,
        estimated_age_years: analysis.estimated_age_years || null,
        recommended_actions: analysis.recommended_actions,
        narrative_paragraph: analysis.narrative_paragraph,
        raw_observations: analysis.raw_observations,
      });

      return analysis;
    } catch (err) {
      console.error("Photo analysis failed:", err);
      return null;
    }
  }, [options.sectionType, options.propertyContext, options.reportId, options.reportPageId, options.propertyId]);

  const analyzePhotos = useCallback(async (photoUrls: string[]) => {
    const urls = photoUrls.filter(Boolean);
    if (urls.length === 0) return;

    setIsAnalyzing(true);
    setAnalyzingCount({ current: 0, total: urls.length });
    const results: PhotoAnalysis[] = [];

    for (let i = 0; i < urls.length; i++) {
      setAnalyzingCount({ current: i + 1, total: urls.length });
      const result = await analyzePhoto(urls[i]);
      if (result) {
        results.push(result);
        setAnalyses((prev) => [...prev, result]);
      }
    }

    setIsAnalyzing(false);

    if (results.length === 0) {
      toast.error("Photo analysis failed");
    } else {
      toast.success(`Analyzed ${results.length} photo${results.length !== 1 ? "s" : ""}`);
    }

    return results;
  }, [analyzePhoto]);

  const analyzeSinglePhoto = useCallback(async (photoUrl: string) => {
    if (!photoUrl) return;
    setIsAnalyzing(true);
    setAnalyzingCount({ current: 1, total: 1 });

    const result = await analyzePhoto(photoUrl);
    if (result) {
      setAnalyses((prev) => [...prev, result]);
      toast.success("Photo analyzed");
    }

    setIsAnalyzing(false);
    return result;
  }, [analyzePhoto]);

  const clearAnalyses = useCallback(() => setAnalyses([]), []);

  return {
    analyses,
    isAnalyzing,
    analyzingCount,
    analyzePhotos,
    analyzeSinglePhoto,
    clearAnalyses,
  };
}
