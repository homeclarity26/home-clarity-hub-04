import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Target, Search, ArrowRight, Plus } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = { dreaming: "bg-muted text-muted-foreground", planning: "bg-accent/20 text-accent-foreground", "in_progress": "bg-primary/10 text-primary", complete: "bg-green-100 text-green-800" };

const AdminGoalsDashboard = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-all-goals"],
    queryFn: async () => {
      const { data: goals } = await supabase.from("home_goals").select("*").order("created_at", { ascending: false });
      const clientIds = [...new Set((goals || []).map(g => g.client_id))];
      if (clientIds.length === 0) return [];

      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name");
      const { data: props } = await supabase.from("properties").select("id, property_name, address, client_user_id");
      const profileMap: Record<string, string> = {};
      profiles?.forEach(p => { profileMap[p.user_id] = p.full_name || "Unknown"; });
      const propMap: Record<string, any> = {};
      props?.forEach(p => { propMap[p.client_user_id] = p; });

      return (goals || []).map(g => ({
        ...g,
        clientName: profileMap[g.client_id] || "Unknown",
        propertyName: propMap[g.client_id]?.property_name || propMap[g.client_id]?.address || "",
        propertyId: propMap[g.client_id]?.id || "",
      }));
    },
  });

  const filtered = (data || []).filter((g: any) => {
    if (search && !g.title.toLowerCase().includes(search.toLowerCase()) && !g.clientName.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== "all" && g.status !== filterStatus) return false;
    return true;
  });

  const statusCounts = (data || []).reduce((acc: Record<string, number>, g: any) => { acc[g.status] = (acc[g.status] || 0) + 1; return acc; }, {});

  return (
    <div>
      <AdminHeader breadcrumbs={[{ label: "Goals" }]} />
      <div className="p-6 max-w-7xl space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{(data || []).length}</p>
            <p className="text-xs text-muted-foreground">Total Goals</p>
          </Card>
          {Object.entries(statusCounts).map(([s, c]) => (
            <Card key={s} className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{c}</p>
              <p className="text-xs text-muted-foreground capitalize">{s.replace("_", " ")}</p>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search goals..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-[220px] text-sm" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px] text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="dreaming">Dreaming</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <Card className="p-8 text-center">
            <Target className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No goals found across any clients.</p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Client</TableHead>
                  <TableHead className="text-xs">Goal</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Target Year</TableHead>
                  <TableHead className="text-xs">Budget</TableHead>
                  <TableHead className="text-xs"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((g: any) => (
                  <TableRow key={g.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <p className="text-sm font-medium">{g.clientName}</p>
                      <p className="text-xs text-muted-foreground">{g.propertyName}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{g.title}</p>
                      {g.description && <p className="text-xs text-muted-foreground line-clamp-1">{g.description}</p>}
                    </TableCell>
                    <TableCell><Badge className={`text-[10px] ${STATUS_COLORS[g.status] || ""}`}>{g.status}</Badge></TableCell>
                    <TableCell className="text-sm">{g.target_year || "—"}</TableCell>
                    <TableCell className="text-sm">{g.estimated_budget ? `$${Number(g.estimated_budget).toLocaleString()}` : "—"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/clients/${g.propertyId}`)}>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminGoalsDashboard;
