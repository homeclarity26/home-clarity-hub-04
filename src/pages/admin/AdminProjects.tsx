import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, LayoutGrid, List, Calendar, BarChart3, Briefcase, DollarSign, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminHeader from "@/components/admin/AdminHeader";
import ProjectsBoardView from "@/components/projects/ProjectsBoardView";
import ProjectsListView from "@/components/projects/ProjectsListView";
import ProjectsCalendarView from "@/components/projects/ProjectsCalendarView";
import ProjectsGanttView from "@/components/projects/ProjectsGanttView";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AdminProjects = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("board");

  const { data: projects, isLoading } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("*, properties(property_name, address, client_user_id)")
        .order("updated_at", { ascending: false });
      return data || [];
    },
  });

  const activeProjects = (projects || []).filter((p: any) => !["complete", "cancelled"].includes(p.status));
  const totalBudget = activeProjects.reduce((s: number, p: any) => s + Number(p.budget || 0), 0);
  const totalSpent = activeProjects.reduce((s: number, p: any) => s + Number(p.actual_spent || 0), 0);
  const behindSchedule = activeProjects.filter((p: any) => p.end_date && new Date(p.end_date) < new Date() && p.status !== "complete").length;
  const dueThisWeek = activeProjects.filter((p: any) => {
    if (!p.end_date) return false;
    const end = new Date(p.end_date);
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 86400000);
    return end >= now && end <= weekFromNow;
  }).length;

  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;

  return (
    <div>
      <AdminHeader breadcrumbs={[{ label: "Projects" }]} />
      <div className="p-6 max-w-7xl space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/10"><Briefcase className="w-4 h-4 text-primary" /></div>
            <div>
              <p className="text-2xl font-bold font-sans text-foreground">{activeProjects.length}</p>
              <p className="text-xs text-muted-foreground font-sans">Active Projects</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/10"><DollarSign className="w-4 h-4 text-primary" /></div>
            <div>
              <p className="text-2xl font-bold font-sans text-foreground">{fmt(totalBudget)}</p>
              <p className="text-xs text-muted-foreground font-sans">Total Budget</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-accent/10"><DollarSign className="w-4 h-4 text-accent" /></div>
            <div>
              <p className="text-2xl font-bold font-sans text-foreground">{fmt(totalSpent)}</p>
              <p className="text-xs text-muted-foreground font-sans">Total Spent</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-destructive/10"><AlertTriangle className="w-4 h-4 text-destructive" /></div>
            <div>
              <p className="text-2xl font-bold font-sans text-foreground">{behindSchedule}</p>
              <p className="text-xs text-muted-foreground font-sans">Behind Schedule</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/10"><Clock className="w-4 h-4 text-primary" /></div>
            <div>
              <p className="text-2xl font-bold font-sans text-foreground">{dueThisWeek}</p>
              <p className="text-xs text-muted-foreground font-sans">Due This Week</p>
            </div>
          </Card>
        </div>

        {/* View Switcher */}
        <div className="flex items-center justify-between">
          <Tabs value={activeView} onValueChange={setActiveView}>
            <TabsList>
              <TabsTrigger value="board" className="gap-1.5 text-xs font-sans"><LayoutGrid className="w-3.5 h-3.5" />Board</TabsTrigger>
              <TabsTrigger value="list" className="gap-1.5 text-xs font-sans"><List className="w-3.5 h-3.5" />List</TabsTrigger>
              <TabsTrigger value="calendar" className="gap-1.5 text-xs font-sans"><Calendar className="w-3.5 h-3.5" />Calendar</TabsTrigger>
              <TabsTrigger value="gantt" className="gap-1.5 text-xs font-sans"><BarChart3 className="w-3.5 h-3.5" />Gantt</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={() => navigate("/admin/projects/new")} className="gap-2 text-sm font-sans">
            <Plus className="w-4 h-4" />New Project
          </Button>
        </div>

        {/* Views */}
        {activeView === "board" && <ProjectsBoardView projects={projects || []} isLoading={isLoading} />}
        {activeView === "list" && <ProjectsListView projects={projects || []} isLoading={isLoading} />}
        {activeView === "calendar" && <ProjectsCalendarView projects={projects || []} />}
        {activeView === "gantt" && <ProjectsGanttView projects={projects || []} />}
      </div>
    </div>
  );
};

export default AdminProjects;
