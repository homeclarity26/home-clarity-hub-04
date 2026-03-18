import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Shield, ClipboardCheck } from "lucide-react";
import { format } from "date-fns";

interface Props {
  projectId: string;
}

const InspectionsPermitsTab = ({ projectId }: Props) => {
  const { data: permits } = useQuery({
    queryKey: ["project-permits", projectId],
    queryFn: async () => {
      const { data } = await supabase.from("project_permits").select("*").eq("project_id", projectId).order("created_at");
      return data || [];
    },
  });

  const { data: inspections } = useQuery({
    queryKey: ["project-inspections", projectId],
    queryFn: async () => {
      const { data } = await supabase.from("project_inspections").select("*").eq("project_id", projectId).order("scheduled_date");
      return data || [];
    },
  });

  const resultColor = (r: string) => {
    if (r === "pass") return "default";
    if (r === "fail") return "destructive";
    return "secondary";
  };

  return (
    <div className="space-y-6 mt-4">
      {/* Permits */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-sans font-semibold text-foreground flex items-center gap-2">
            <Shield className="w-4 h-4 text-muted-foreground" />Permits
          </h3>
          <Button size="sm" variant="outline" className="gap-1 text-xs font-sans">
            <Plus className="w-3.5 h-3.5" />Add Permit
          </Button>
        </div>
        {(permits || []).length === 0 ? (
          <p className="text-sm text-muted-foreground font-sans">No permits tracked yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-sans">Type</TableHead>
                <TableHead className="text-xs font-sans">Permit #</TableHead>
                <TableHead className="text-xs font-sans">Submitted</TableHead>
                <TableHead className="text-xs font-sans">Approved</TableHead>
                <TableHead className="text-xs font-sans">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permits!.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="text-sm font-sans">{p.permit_type}</TableCell>
                  <TableCell className="text-sm font-mono">{p.permit_number || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.submitted_date ? format(new Date(p.submitted_date), "MMM d") : "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.approved_date ? format(new Date(p.approved_date), "MMM d") : "—"}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-[10px] capitalize">{p.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Inspections */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-sans font-semibold text-foreground flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-muted-foreground" />Inspections
          </h3>
          <Button size="sm" variant="outline" className="gap-1 text-xs font-sans">
            <Plus className="w-3.5 h-3.5" />Add Inspection
          </Button>
        </div>
        {(inspections || []).length === 0 ? (
          <p className="text-sm text-muted-foreground font-sans">No inspections scheduled yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-sans">Type</TableHead>
                <TableHead className="text-xs font-sans">Scheduled</TableHead>
                <TableHead className="text-xs font-sans">Inspector</TableHead>
                <TableHead className="text-xs font-sans">Result</TableHead>
                <TableHead className="text-xs font-sans">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inspections!.map((i: any) => (
                <TableRow key={i.id}>
                  <TableCell className="text-sm font-sans">{i.inspection_type}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{i.scheduled_date ? format(new Date(i.scheduled_date), "MMM d") : "—"}</TableCell>
                  <TableCell className="text-sm font-sans">{i.inspector_name || "—"}</TableCell>
                  <TableCell>
                    {i.result ? (
                      <Badge variant={resultColor(i.result)} className="text-[10px] capitalize">{i.result}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Pending</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{i.notes || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default InspectionsPermitsTab;
