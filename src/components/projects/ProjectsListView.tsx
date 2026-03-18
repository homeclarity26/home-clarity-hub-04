import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

const priorityColors: Record<string, string> = {
  low: "secondary",
  normal: "outline",
  high: "default",
  urgent: "destructive",
};

interface Props {
  projects: any[];
  isLoading: boolean;
}

const ProjectsListView = ({ projects, isLoading }: Props) => {
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-sans text-xs">Project Name</TableHead>
            <TableHead className="font-sans text-xs">Client</TableHead>
            <TableHead className="font-sans text-xs">Start</TableHead>
            <TableHead className="font-sans text-xs">End</TableHead>
            <TableHead className="font-sans text-xs text-right">Budget</TableHead>
            <TableHead className="font-sans text-xs text-right">Spent</TableHead>
            <TableHead className="font-sans text-xs text-center">% Complete</TableHead>
            <TableHead className="font-sans text-xs">Status</TableHead>
            <TableHead className="font-sans text-xs">Priority</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-8 font-sans">
                No projects yet. Create your first project to get started.
              </TableCell>
            </TableRow>
          ) : (
            projects.map((p) => (
              <TableRow
                key={p.id}
                className="cursor-pointer"
                onClick={() => navigate(`/admin/projects/${p.id}`)}
              >
                <TableCell className="font-sans text-sm font-medium">{p.title}</TableCell>
                <TableCell className="font-sans text-sm text-muted-foreground">
                  {p.properties?.property_name || "—"}
                </TableCell>
                <TableCell className="font-sans text-xs text-muted-foreground">
                  {p.start_date ? format(new Date(p.start_date), "MMM d") : "—"}
                </TableCell>
                <TableCell className="font-sans text-xs text-muted-foreground">
                  {p.end_date ? format(new Date(p.end_date), "MMM d") : "—"}
                </TableCell>
                <TableCell className="font-mono text-xs text-right">
                  {p.budget > 0 ? `$${Number(p.budget).toLocaleString()}` : "—"}
                </TableCell>
                <TableCell className="font-mono text-xs text-right">
                  {p.actual_spent > 0 ? `$${Number(p.actual_spent).toLocaleString()}` : "—"}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${p.percent_complete || 0}%` }} />
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">{p.percent_complete || 0}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-[10px] capitalize font-sans">{(p.status || "lead").replace("_", " ")}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={priorityColors[p.priority || "normal"] as any} className="text-[10px] capitalize font-sans">
                    {p.priority || "normal"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProjectsListView;
