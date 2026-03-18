import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, ChevronDown, ChevronRight, Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AuditLogSection = () => {
  const [search, setSearch] = useState("");
  const [actorFilter, setActorFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit-log", page, actorFilter, actionFilter, search],
    queryFn: async () => {
      let query = (supabase.from("audit_log") as any)
        .select("*")
        .order("created_at", { ascending: false })
        .range(page * 50, (page + 1) * 50 - 1);

      if (actorFilter !== "all") query = query.eq("actor_type", actorFilter);
      if (actionFilter !== "all") query = query.eq("action_type", actionFilter);
      if (search.trim()) query = query.or(`actor_name.ilike.%${search}%,entity_label.ilike.%${search}%`);

      const { data } = await query;
      return data || [];
    },
  });

  const exportCSV = () => {
    const headers = ["Timestamp", "Actor Type", "Actor", "Action", "Entity Type", "Entity", "Details"];
    const rows = logs.map((l: any) => [
      new Date(l.created_at).toISOString(),
      l.actor_type, l.actor_name || "", l.action_type,
      l.entity_type, l.entity_label || "",
      JSON.stringify(l.new_value_json || {}),
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const actionColor = (type: string) => {
    if (type.includes("create") || type.includes("publish")) return "bg-green-100 text-green-800";
    if (type.includes("delete") || type.includes("revoke")) return "bg-red-100 text-red-800";
    if (type.includes("update") || type.includes("change")) return "bg-blue-100 text-blue-800";
    return "bg-muted text-muted-foreground";
  };

  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-accent" />
          <h3 className="text-base font-sans font-semibold text-foreground">Audit Log</h3>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs font-sans" onClick={exportCSV}>
          <Download className="w-3.5 h-3.5" />Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search actor or entity..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 font-sans text-sm" />
        </div>
        <Select value={actorFilter} onValueChange={setActorFilter}>
          <SelectTrigger className="w-[140px] text-sm font-sans"><SelectValue placeholder="Actor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actors</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="client">Client</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[160px] text-sm font-sans"><SelectValue placeholder="Action" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="create">Create</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
            <SelectItem value="publish">Publish</SelectItem>
            <SelectItem value="login">Login</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead className="text-xs font-sans">Timestamp</TableHead>
              <TableHead className="text-xs font-sans">Actor</TableHead>
              <TableHead className="text-xs font-sans">Action</TableHead>
              <TableHead className="text-xs font-sans">Entity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log: any) => (
              <>
                <TableRow key={log.id} className="cursor-pointer" onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}>
                  <TableCell className="py-2">
                    {expandedId === log.id ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                  </TableCell>
                  <TableCell className="py-2 text-xs font-mono text-muted-foreground whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[9px] font-mono">{log.actor_type}</Badge>
                      <span className="text-xs font-sans">{log.actor_name || "System"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2">
                    <Badge className={`text-[10px] font-sans border-none ${actionColor(log.action_type)}`}>
                      {log.action_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2">
                    <span className="text-xs font-sans">{log.entity_type}: {log.entity_label || "—"}</span>
                  </TableCell>
                </TableRow>
                {expandedId === log.id && (
                  <TableRow key={`${log.id}-details`}>
                    <TableCell colSpan={5} className="bg-muted/30 py-3">
                      <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                        {log.old_value_json && (
                          <div>
                            <p className="text-muted-foreground mb-1 font-sans text-[11px] font-medium">Previous Value</p>
                            <pre className="bg-card p-2 rounded text-[11px] overflow-auto max-h-32">{JSON.stringify(log.old_value_json, null, 2)}</pre>
                          </div>
                        )}
                        {log.new_value_json && (
                          <div>
                            <p className="text-muted-foreground mb-1 font-sans text-[11px] font-medium">New Value</p>
                            <pre className="bg-card p-2 rounded text-[11px] overflow-auto max-h-32">{JSON.stringify(log.new_value_json, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-sm font-sans text-muted-foreground">
                  No audit log entries found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-sans text-muted-foreground">Page {page + 1}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="text-xs font-sans">Previous</Button>
          <Button variant="outline" size="sm" disabled={logs.length < 50} onClick={() => setPage(p => p + 1)} className="text-xs font-sans">Next</Button>
        </div>
      </div>
    </Card>
  );
};

export default AuditLogSection;
