import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Clock, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ChangeItem {
  id: string;
  title: string;
  updated_at: string;
  type: "page_update";
}

interface WhatChangedFeedProps {
  propertyId: string;
  reportId?: string;
}

export function WhatChangedFeed({ propertyId, reportId }: WhatChangedFeedProps) {
  const [items, setItems] = useState<ChangeItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!propertyId || propertyId.startsWith("mock-")) {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    const load = async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const query = supabase
        .from("report_pages")
        .select("id, title, updated_at")
        .eq("status", "published")
        .gte("updated_at", thirtyDaysAgo)
        .order("updated_at", { ascending: false })
        .limit(5);
      if (reportId) query.eq("report_id", reportId);

      const { data } = await query;
      if (cancelled) return;
      if (data && data.length > 0) {
        setItems(
          data.map((r) => ({
            id: r.id,
            title: r.title ?? "Untitled page",
            updated_at: r.updated_at,
            type: "page_update" as const,
          })),
        );
      }
      setLoaded(true);
    };
    load();
    return () => { cancelled = true; };
  }, [propertyId, reportId]);

  if (!loaded || items.length === 0) return null;

  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-accent" />
        <h3 className="text-[10px] font-mono uppercase tracking-wider text-accent">
          What Changed
        </h3>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3">
            <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-sans text-foreground truncate">{item.title}</p>
              <p className="text-[10px] font-mono text-muted-foreground">
                Updated {new Date(item.updated_at).toLocaleDateString()}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
