import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import TodaysBriefBlock from "@/components/wysiwyg/blocks/TodaysBriefBlock";
import type { TodaysBriefContent } from "@/components/wysiwyg/types";

interface TodaysBriefProps {
  propertyId?: string;
}

interface DailyBriefRow {
  id: string;
  brief_date: string;
  brief_html: string;
  why_it_matters_html: string | null;
}

const formatBriefDate = (iso: string): string => {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
};

export function TodaysBrief({ propertyId }: TodaysBriefProps) {
  const [brief, setBrief] = useState<DailyBriefRow | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!propertyId || propertyId.startsWith("mock-")) {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("daily_briefs")
        .select("id, brief_date, brief_html, why_it_matters_html")
        .eq("property_id", propertyId)
        .order("brief_date", { ascending: false })
        .limit(1);
      if (cancelled) return;
      if (data && data.length > 0) setBrief(data[0]);
      setLoaded(true);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  if (!loaded || !brief) return null;

  const content: TodaysBriefContent = {
    eyebrow: `From your Concierge · ${formatBriefDate(brief.brief_date)}`,
    title: "Today's Brief",
    briefDate: brief.brief_date,
    briefHtml: brief.brief_html,
    whyItMattersHtml: brief.why_it_matters_html ?? undefined,
  };

  return <TodaysBriefBlock content={content} />;
}

export default TodaysBrief;
