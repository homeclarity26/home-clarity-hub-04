import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { useState } from "react";
import { Activity, Search } from "lucide-react";

interface Props {
  projectId: string;
}

const ProjectActivityLogTab = ({ projectId }: Props) => {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: activities } = useQuery({
    queryKey: ["project-activity-log", projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from("project_activity_log")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(100);
      return data || [];
    },
  });

  const filtered = (activities || []).filter((a: any) => {
    if (filter !== "all" && a.action_type !== filter) return false;
    if (search && !a.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const actionTypes = [...new Set((activities || []).map((a: any) => a.action_type))];

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-sans font-semibold text-foreground flex items-center gap-2">
          <Activity className="w-4 h-4 text-muted-foreground" />Activity Log
        </h3>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="h-8 text-xs pl-8 w-48"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Types</SelectItem>
              {actionTypes.map((t) => (
                <SelectItem key={t} value={t} className="text-xs capitalize">{t.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground font-sans">No activity logged yet.</p>
        </Card>
      ) : (
        <Card className="p-4">
          <div className="space-y-0">
            {filtered.map((a: any, i: number) => (
              <div key={a.id} className="flex items-start gap-3 py-3 border-b border-border last:border-0">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-sans text-foreground">{a.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-sans text-muted-foreground">
                      {format(new Date(a.created_at), "MMM d, yyyy · h:mm a")}
                    </span>
                    <Badge variant="outline" className="text-[8px] h-4 capitalize">{a.action_type.replace("_", " ")}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ProjectActivityLogTab;
