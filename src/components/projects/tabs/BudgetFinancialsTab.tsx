import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Plus, FileText, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface Props {
  project: any;
}

const BudgetFinancialsTab = ({ project }: Props) => {
  const budget = Number(project.budget || 0);
  const spent = Number(project.actual_spent || 0);
  const contingencyAmt = budget * (Number(project.contingency_pct || 10) / 100);
  const totalWithContingency = budget + contingencyAmt;
  const remaining = totalWithContingency - spent;
  const spentPct = totalWithContingency > 0 ? (spent / totalWithContingency) * 100 : 0;

  const { data: phases } = useQuery({
    queryKey: ["project-phases-budget", project.id],
    queryFn: async () => {
      const { data } = await supabase.from("project_phases").select("*").eq("project_id", project.id).order("sort_order");
      return data || [];
    },
  });

  const { data: changeOrders } = useQuery({
    queryKey: ["project-change-orders", project.id],
    queryFn: async () => {
      const { data } = await supabase.from("project_change_orders").select("*").eq("project_id", project.id).order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: purchaseOrders } = useQuery({
    queryKey: ["project-purchase-orders", project.id],
    queryFn: async () => {
      const { data } = await supabase.from("project_purchase_orders").select("*").eq("project_id", project.id).order("created_at", { ascending: false });
      return data || [];
    },
  });

  const approvedChangeTotal = (changeOrders || []).filter((co: any) => co.status === "approved").reduce((s: number, co: any) => s + Number(co.cost_impact), 0);

  return (
    <div className="space-y-6 mt-4">
      {/* Budget Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-[10px] font-sans text-muted-foreground uppercase tracking-wider">Base Budget</p>
          <p className="text-xl font-mono font-bold text-foreground">${budget.toLocaleString()}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-[10px] font-sans text-muted-foreground uppercase tracking-wider">Contingency ({project.contingency_pct || 10}%)</p>
          <p className="text-xl font-mono font-bold text-foreground">${contingencyAmt.toLocaleString()}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-[10px] font-sans text-muted-foreground uppercase tracking-wider">Spent</p>
          <p className={`text-xl font-mono font-bold ${spentPct >= 100 ? "text-destructive" : spentPct >= 80 ? "text-amber-500" : "text-emerald-500"}`}>${spent.toLocaleString()}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-[10px] font-sans text-muted-foreground uppercase tracking-wider">Remaining</p>
          <p className={`text-xl font-mono font-bold ${remaining < 0 ? "text-destructive" : "text-foreground"}`}>${remaining.toLocaleString()}</p>
        </Card>
      </div>

      {/* Budget by Phase */}
      <Card className="p-4">
        <h3 className="text-sm font-sans font-semibold text-foreground mb-3">Budget by Phase</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-sans">Phase</TableHead>
              <TableHead className="text-xs font-sans text-right">Estimated</TableHead>
              <TableHead className="text-xs font-sans text-right">Actual</TableHead>
              <TableHead className="text-xs font-sans text-right">Remaining</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(phases || []).map((phase: any) => (
              <TableRow key={phase.id}>
                <TableCell className="text-sm font-sans">{phase.name}</TableCell>
                <TableCell className="text-sm font-mono text-right">${Number(phase.estimated_cost || 0).toLocaleString()}</TableCell>
                <TableCell className="text-sm font-mono text-right">${Number(phase.actual_cost || 0).toLocaleString()}</TableCell>
                <TableCell className="text-sm font-mono text-right">${(Number(phase.estimated_cost || 0) - Number(phase.actual_cost || 0)).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Change Orders */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-sans font-semibold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            Change Orders
            {approvedChangeTotal !== 0 && (
              <span className="text-xs font-mono text-muted-foreground">
                ({approvedChangeTotal > 0 ? "+" : ""}${approvedChangeTotal.toLocaleString()} approved)
              </span>
            )}
          </h3>
          <Button size="sm" variant="outline" className="gap-1 text-xs font-sans">
            <Plus className="w-3.5 h-3.5" />New Change Order
          </Button>
        </div>
        {(changeOrders || []).length === 0 ? (
          <p className="text-sm text-muted-foreground font-sans">No change orders yet.</p>
        ) : (
          <div className="space-y-2">
            {changeOrders!.map((co: any) => (
              <div key={co.id} className="flex items-center justify-between p-3 border border-border rounded-md">
                <div>
                  <p className="text-sm font-sans font-medium text-foreground">{co.title}</p>
                  <p className="text-xs text-muted-foreground font-sans">{co.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-mono font-medium ${Number(co.cost_impact) > 0 ? "text-destructive" : "text-emerald-500"}`}>
                    {Number(co.cost_impact) > 0 ? "+" : ""}${Number(co.cost_impact).toLocaleString()}
                  </span>
                  <Badge variant={co.status === "approved" ? "default" : co.status === "declined" ? "destructive" : "secondary"} className="text-[10px] capitalize">
                    {co.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Purchase Orders */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-sans font-semibold text-foreground">Purchase Orders</h3>
          <Button size="sm" variant="outline" className="gap-1 text-xs font-sans">
            <Plus className="w-3.5 h-3.5" />New PO
          </Button>
        </div>
        {(purchaseOrders || []).length === 0 ? (
          <p className="text-sm text-muted-foreground font-sans">No purchase orders yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-sans">PO #</TableHead>
                <TableHead className="text-xs font-sans">Description</TableHead>
                <TableHead className="text-xs font-sans text-right">Amount</TableHead>
                <TableHead className="text-xs font-sans">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrders!.map((po: any) => (
                <TableRow key={po.id}>
                  <TableCell className="text-sm font-mono">{po.po_number || "—"}</TableCell>
                  <TableCell className="text-sm font-sans">{po.description}</TableCell>
                  <TableCell className="text-sm font-mono text-right">${Number(po.amount).toLocaleString()}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-[10px] capitalize">{po.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default BudgetFinancialsTab;
