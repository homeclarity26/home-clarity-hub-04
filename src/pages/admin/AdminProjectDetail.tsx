import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import ProjectOverviewTab from "@/components/projects/tabs/ProjectOverviewTab";
import PhasesTasksTab from "@/components/projects/tabs/PhasesTasksTab";
import ProjectScheduleTab from "@/components/projects/tabs/ProjectScheduleTab";
import BudgetFinancialsTab from "@/components/projects/tabs/BudgetFinancialsTab";
import DocumentsPhotosTab from "@/components/projects/tabs/DocumentsPhotosTab";
import ProjectMessagesTab from "@/components/projects/tabs/ProjectMessagesTab";
import DailyLogsTab from "@/components/projects/tabs/DailyLogsTab";
import InspectionsPermitsTab from "@/components/projects/tabs/InspectionsPermitsTab";
import NotesDecisionsTab from "@/components/projects/tabs/NotesDecisionsTab";
import ProjectActivityLogTab from "@/components/projects/tabs/ProjectActivityLogTab";

const AdminProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const { data: project, isLoading } = useQuery({
    queryKey: ["project-detail", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("*, properties(property_name, address, client_user_id)")
        .eq("id", projectId!)
        .single();
      return data;
    },
  });

  if (isLoading) {
    return (
      <div>
        <AdminHeader breadcrumbs={[{ label: "Projects", path: "/admin/projects" }, { label: "Loading..." }]} />
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div>
        <AdminHeader breadcrumbs={[{ label: "Projects", path: "/admin/projects" }, { label: "Not Found" }]} />
        <div className="p-6 text-center text-muted-foreground font-sans">Project not found.</div>
      </div>
    );
  }

  const statusLabel = (project.status || "lead").replace("_", " ");

  return (
    <div>
      <AdminHeader breadcrumbs={[{ label: "Projects", href: "/admin/projects" }, { label: project.title }]} />
      <div className="p-6 max-w-7xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-sans font-bold text-foreground">{project.title}</h1>
              <Badge variant="secondary" className="capitalize text-xs font-sans">{statusLabel}</Badge>
              {project.priority && project.priority !== "normal" && (
                <Badge variant={project.priority === "urgent" ? "destructive" : "default"} className="capitalize text-xs font-sans">
                  {project.priority}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground font-sans mt-1">
              {project.properties?.property_name || project.properties?.address || "No client assigned"}
              {project.project_type && project.project_type !== "custom" && ` · ${project.project_type.replace("_", " ")}`}
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/admin/projects")} className="gap-2 text-sm font-sans">
            <ArrowLeft className="w-4 h-4" />Back to Projects
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${project.percent_complete || 0}%` }} />
          </div>
          <span className="text-sm font-mono text-foreground font-medium">{project.percent_complete || 0}%</span>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="text-xs font-sans">Overview</TabsTrigger>
            <TabsTrigger value="phases" className="text-xs font-sans">Phases & Tasks</TabsTrigger>
            <TabsTrigger value="schedule" className="text-xs font-sans">Schedule</TabsTrigger>
            <TabsTrigger value="budget" className="text-xs font-sans">Budget</TabsTrigger>
            <TabsTrigger value="documents" className="text-xs font-sans">Docs & Photos</TabsTrigger>
            <TabsTrigger value="messages" className="text-xs font-sans">Messages</TabsTrigger>
            <TabsTrigger value="daily-logs" className="text-xs font-sans">Daily Logs</TabsTrigger>
            <TabsTrigger value="inspections" className="text-xs font-sans">Inspections</TabsTrigger>
            <TabsTrigger value="decisions" className="text-xs font-sans">Decisions</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs font-sans">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><ProjectOverviewTab project={project} /></TabsContent>
          <TabsContent value="phases"><PhasesTasksTab projectId={project.id} /></TabsContent>
          <TabsContent value="schedule"><ProjectScheduleTab projectId={project.id} /></TabsContent>
          <TabsContent value="budget"><BudgetFinancialsTab project={project} /></TabsContent>
          <TabsContent value="documents"><DocumentsPhotosTab projectId={project.id} /></TabsContent>
          <TabsContent value="messages"><ProjectMessagesTab projectId={project.id} /></TabsContent>
          <TabsContent value="daily-logs"><DailyLogsTab projectId={project.id} /></TabsContent>
          <TabsContent value="inspections"><InspectionsPermitsTab projectId={project.id} /></TabsContent>
          <TabsContent value="decisions"><NotesDecisionsTab projectId={project.id} /></TabsContent>
          <TabsContent value="activity"><ProjectActivityLogTab projectId={project.id} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminProjectDetail;
