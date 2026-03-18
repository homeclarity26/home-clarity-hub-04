import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { useAdminClients } from "@/hooks/useAdminData";
import type { AdminClient } from "@/hooks/useAdminData";

const ClientComparisonView = () => {
  const { data: clients } = useAdminClients();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleClient = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 6 ? [...prev, id] : prev
    );
  };

  const selected = (clients || []).filter((c) => selectedIds.includes(c.id));

  const getCompletionPct = (c: AdminClient) =>
    c.totalPages > 0 ? Math.round((c.completePages / c.totalPages) * 100) : 0;

  const getHealthIndicator = (c: AdminClient) => {
    const issues = c.unreadMessages + c.unreadComments + c.flaggedPages;
    if (issues === 0) return { label: "Healthy", color: "bg-emerald-100 text-emerald-700" };
    if (issues <= 2) return { label: "Attention", color: "bg-amber-100 text-amber-700" };
    return { label: "At Risk", color: "bg-destructive/10 text-destructive" };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-accent" />
        <h2 className="text-base font-sans font-semibold text-foreground">Client Comparison</h2>
        <Badge variant="outline" className="text-[10px] font-sans">{selectedIds.length}/6 selected</Badge>
      </div>

      {/* Client Selector */}
      <Card className="p-4">
        <p className="text-xs font-sans text-muted-foreground mb-3">Select up to 6 clients to compare</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
          {(clients || []).map((c) => (
            <label
              key={c.id}
              className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors text-sm font-sans ${
                selectedIds.includes(c.id) ? "bg-primary/10" : "hover:bg-muted/50"
              }`}
            >
              <Checkbox
                checked={selectedIds.includes(c.id)}
                onCheckedChange={() => toggleClient(c.id)}
              />
              <span className="truncate">{c.propertyName}</span>
            </label>
          ))}
        </div>
      </Card>

      {/* Comparison Table */}
      {selected.length >= 2 && (
        <Card className="p-0 overflow-x-auto">
          <table className="w-full text-sm font-sans">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Metric</th>
                {selected.map((c) => (
                  <th key={c.id} className="text-center p-3 text-xs font-semibold text-foreground min-w-[140px]">
                    {c.propertyName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Health Status */}
              <tr className="border-b">
                <td className="p-3 text-xs text-muted-foreground">Health Status</td>
                {selected.map((c) => {
                  const h = getHealthIndicator(c);
                  return (
                    <td key={c.id} className="p-3 text-center">
                      <Badge className={`${h.color} text-[10px] border-none`}>{h.label}</Badge>
                    </td>
                  );
                })}
              </tr>

              {/* Report Status */}
              <tr className="border-b">
                <td className="p-3 text-xs text-muted-foreground">Report Status</td>
                {selected.map((c) => (
                  <td key={c.id} className="p-3 text-center">
                    <Badge variant="outline" className="text-[10px] capitalize">{c.reportStatus}</Badge>
                  </td>
                ))}
              </tr>

              {/* Completion */}
              <tr className="border-b">
                <td className="p-3 text-xs text-muted-foreground">Completion</td>
                {selected.map((c) => {
                  const pct = getCompletionPct(c);
                  return (
                    <td key={c.id} className="p-3">
                      <div className="flex flex-col items-center gap-1">
                        <Progress value={pct} className="h-1.5 w-20" />
                        <span className="text-[10px] font-mono text-muted-foreground">{pct}%</span>
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Pages */}
              <tr className="border-b">
                <td className="p-3 text-xs text-muted-foreground">Total Pages</td>
                {selected.map((c) => (
                  <td key={c.id} className="p-3 text-center text-sm font-mono">{c.totalPages}</td>
                ))}
              </tr>

              {/* Flagged */}
              <tr className="border-b">
                <td className="p-3 text-xs text-muted-foreground">Flagged Pages</td>
                {selected.map((c) => (
                  <td key={c.id} className="p-3 text-center">
                    <span className={`text-sm font-mono ${c.flaggedPages > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                      {c.flaggedPages}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Unread Messages */}
              <tr className="border-b">
                <td className="p-3 text-xs text-muted-foreground">Unread Messages</td>
                {selected.map((c) => (
                  <td key={c.id} className="p-3 text-center">
                    <span className={`text-sm font-mono ${c.unreadMessages > 0 ? "text-accent" : "text-muted-foreground"}`}>
                      {c.unreadMessages}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Property Type */}
              <tr className="border-b">
                <td className="p-3 text-xs text-muted-foreground">Property Type</td>
                {selected.map((c) => (
                  <td key={c.id} className="p-3 text-center text-xs capitalize">{c.propertyType?.replace("_", " ") || "—"}</td>
                ))}
              </tr>

              {/* Year Built */}
              <tr className="border-b">
                <td className="p-3 text-xs text-muted-foreground">Year Built</td>
                {selected.map((c) => (
                  <td key={c.id} className="p-3 text-center text-sm font-mono">{c.yearBuilt || "—"}</td>
                ))}
              </tr>

              {/* Sqft */}
              <tr>
                <td className="p-3 text-xs text-muted-foreground">Square Feet</td>
                {selected.map((c) => (
                  <td key={c.id} className="p-3 text-center text-sm font-mono">
                    {c.sqft ? c.sqft.toLocaleString() : "—"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </Card>
      )}

      {selected.length < 2 && (
        <Card className="p-8 text-center">
          <p className="text-sm font-sans text-muted-foreground">Select at least 2 clients to compare</p>
        </Card>
      )}
    </div>
  );
};

export default ClientComparisonView;
