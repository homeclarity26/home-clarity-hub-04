import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Clock, CheckCircle, XCircle, AlertTriangle, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface ServiceRequest {
  id: string;
  property_id: string;
  client_id: string;
  request_type: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  created_at: string;
  resolved_at: string | null;
}

const STATUS_STYLES: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: "bg-accent/20 text-accent-foreground", label: "Pending" },
  in_progress: { icon: AlertTriangle, color: "bg-primary/10 text-primary", label: "In Progress" },
  resolved: { icon: CheckCircle, color: "bg-primary/10 text-primary", label: "Resolved" },
  cancelled: { icon: XCircle, color: "bg-muted text-muted-foreground", label: "Cancelled" },
};

const ServiceRequestsManager = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      let query = supabase.from("service_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (filter !== "all") query = query.eq("status", filter);
      const { data } = await query.limit(50);
      if (data) setRequests(data as any);
    };
    load();
  }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === "resolved") updates.resolved_at = new Date().toISOString();
    await supabase.from("service_requests").update(updates).eq("id", id);
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, ...updates } : r));
    toast.success(`Request marked as ${status}`);
  };

  const filtered = requests;
  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-sans font-semibold text-foreground">Concierge Requests</h3>
        {pendingCount > 0 && (
          <Badge variant="destructive" className="text-[10px] font-mono">{pendingCount} pending</Badge>
        )}
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="ml-auto w-[130px] h-8 text-xs font-sans">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All</SelectItem>
            <SelectItem value="pending" className="text-xs">Pending</SelectItem>
            <SelectItem value="in_progress" className="text-xs">In Progress</SelectItem>
            <SelectItem value="resolved" className="text-xs">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm font-sans text-muted-foreground text-center py-6">No service requests yet.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            const statusInfo = STATUS_STYLES[req.status] || STATUS_STYLES.pending;
            const StatusIcon = statusInfo.icon;
            return (
              <div key={req.id} className="border border-border rounded-md p-3">
                <div className="flex items-start gap-3">
                  <StatusIcon className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-sans font-medium text-foreground">{req.title}</span>
                      <Badge variant="outline" className="text-[9px] font-mono">{req.request_type}</Badge>
                      {req.priority === "urgent" && (
                        <Badge variant="destructive" className="text-[9px] font-mono">Urgent</Badge>
                      )}
                    </div>
                    {req.description && (
                      <p className="text-xs font-sans text-muted-foreground mb-2">{req.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                      <span>{format(new Date(req.created_at), "MMM d, h:mm a")}</span>
                      <Badge className={`${statusInfo.color} text-[9px] border-none`}>{statusInfo.label}</Badge>
                    </div>
                  </div>
                  {req.status === "pending" && (
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => updateStatus(req.id, "in_progress")}>
                        Start
                      </Button>
                      <Button size="sm" className="h-7 text-[10px]" onClick={() => updateStatus(req.id, "resolved")}>
                        Resolve
                      </Button>
                    </div>
                  )}
                  {req.status === "in_progress" && (
                    <Button size="sm" className="h-7 text-[10px] shrink-0" onClick={() => updateStatus(req.id, "resolved")}>
                      Resolve
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default ServiceRequestsManager;
