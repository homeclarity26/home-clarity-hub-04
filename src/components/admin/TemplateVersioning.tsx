import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GitBranch, ArrowUpCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  reportId: string;
}

const TemplateVersioning = ({ reportId }: Props) => {
  const { data } = useQuery({
    queryKey: ["template-versions", reportId],
    enabled: !!reportId,
    queryFn: async () => {
      // Fetch report pages with their template references
      const { data: pages } = await supabase
        .from("report_pages")
        .select("id, title, template_id, page_key")
        .eq("report_id", reportId);

      // Fetch current template versions
      const { data: templates } = await supabase
        .from("page_templates")
        .select("id, slug, version, name");

      if (!pages || !templates) return { pages: [], outdated: [] };

      const templateMap = new Map(templates.map((t) => [t.id, t]));
      const slugMap = new Map(templates.map((t) => [t.slug, t]));

      const outdated = pages.filter((p) => {
        const tmpl = p.template_id ? templateMap.get(p.template_id) : slugMap.get(p.page_key);
        // If template doesn't exist it's always current
        return tmpl && p.template_id && tmpl.version > 1;
      }).map((p) => {
        const tmpl = p.template_id ? templateMap.get(p.template_id) : slugMap.get(p.page_key);
        return { ...p, latestVersion: tmpl?.version || 1, templateName: tmpl?.name || p.title };
      });

      return { pages, outdated };
    },
  });

  if (!data || data.outdated.length === 0) return null;

  return (
    <Card className="p-3 border-amber-200 bg-amber-50/30">
      <div className="flex items-center gap-2 mb-2">
        <GitBranch className="w-3.5 h-3.5 text-amber-600" />
        <span className="text-xs font-sans font-medium text-amber-700">
          {data.outdated.length} template{data.outdated.length !== 1 ? "s" : ""} updated since this report was created
        </span>
      </div>
      <div className="space-y-1">
        {data.outdated.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-2 text-xs font-sans">
            <span>{p.templateName}</span>
            <Badge variant="outline" className="text-[9px]">v{p.latestVersion}</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default TemplateVersioning;
