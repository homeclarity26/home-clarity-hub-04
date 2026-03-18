import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useUpdateProjectStatus } from "@/hooks/useProjectData";
import { toast } from "sonner";
import { useState } from "react";

const COLUMNS = [
  { key: "lead", label: "Lead", color: "bg-muted" },
  { key: "estimating", label: "Estimating", color: "bg-blue-500/10" },
  { key: "approved", label: "Approved", color: "bg-emerald-500/10" },
  { key: "in_progress", label: "In Progress", color: "bg-amber-500/10" },
  { key: "punch_list", label: "Punch List", color: "bg-orange-500/10" },
  { key: "complete", label: "Complete", color: "bg-green-500/10" },
  { key: "on_hold", label: "On Hold", color: "bg-muted" },
];

interface Props { projects: any[]; isLoading: boolean; }

const ProjectsBoardView = ({ projects, isLoading }: Props) => {
  const navigate = useNavigate();
  const updateStatus = useUpdateProjectStatus();
  const [dragId, setDragId] = useState<string | null>(null);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  const handleDragStart = (e: React.DragEvent, id: string) => { e.dataTransfer.setData("text/plain", id); setDragId(id); };
  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const p = projects.find((x) => x.id === id);
    if (p && (p.status || "lead") !== newStatus) { updateStatus.mutate({ projectId: id, status: newStatus, title: p.title }); toast.success(`Moved to ${newStatus.replace("_", " ")}`); }
    setDragId(null);
  };

  return (
    <div className="grid grid-cols-7 gap-3 overflow-x-auto min-w-[1000px]">
      {COLUMNS.map((col) => {
        const colProjects = projects.filter((p) => (p.status || "lead") === col.key);
        return (
          <div key={col.key} className="space-y-2" onDrop={(e) => handleDrop(e, col.key)} onDragOver={(e) => e.preventDefault()}>
            <div className={`rounded-md px-3 py-2 ${col.color}`}>
              <p className="text-xs font-sans font-semibold text-foreground">{col.label}</p>
              <p className="text-[10px] text-muted-foreground font-sans">{colProjects.length}</p>
            </div>
            {colProjects.map((p) => (
              <Card key={p.id} className={`p-3 cursor-grab hover:shadow-md transition-shadow ${dragId === p.id ? "opacity-50" : ""}`} draggable onDragStart={(e) => handleDragStart(e, p.id)} onClick={() => navigate(`/admin/projects/${p.id}`)}>
                <p className="text-sm font-sans font-medium text-foreground truncate">{p.title}</p>
                <p className="text-[11px] text-muted-foreground font-sans truncate mt-0.5">{p.properties?.property_name || p.properties?.address || "No client"}</p>
                <div className="flex items-center gap-2 mt-2">
                  {p.priority && p.priority !== "normal" && <Badge variant={p.priority === "urgent" ? "destructive" : "secondary"} className="text-[10px] h-5">{p.priority}</Badge>}
                  {p.budget > 0 && <span className="text-[10px] font-mono text-muted-foreground">${Number(p.budget).toLocaleString()}</span>}
                </div>
                {(p.percent_complete || 0) > 0 && <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${p.percent_complete}%` }} /></div>}
              </Card>
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default ProjectsBoardView;
