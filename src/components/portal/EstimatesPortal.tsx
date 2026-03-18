import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  declined: "bg-destructive/10 text-destructive",
  converted: "bg-accent/20 text-accent-foreground",
};

interface EstimatesPortalProps {
  propertyId?: string;
}

const EstimatesPortal = ({ propertyId }: EstimatesPortalProps) => {
  const qc = useQueryClient();

  const { data: estimates = [] } = useQuery({
    queryKey: ["portal-estimates", propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      const { data } = await (supabase.from("estimates") as any).select("*").eq("property_id", propertyId).in("status", ["sent", "accepted", "declined", "converted"]).order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: lineItems = [] } = useQuery({
    queryKey: ["portal-estimate-lines", propertyId],
    enabled: estimates.length > 0,
    queryFn: async () => {
      const ids = estimates.map((e: any) => e.id);
      const { data } = await (supabase.from("estimate_line_items") as any).select("*").in("estimate_id", ids).order("sort_order");
      return data || [];
    },
  });

  const respond = async (id: string, status: "accepted" | "declined") => {
    await (supabase.from("estimates") as any).update({ status, responded_at: new Date().toISOString() }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["portal-estimates", propertyId] });
    toast.success(status === "accepted" ? "Estimate accepted! Your advisor will follow up shortly." : "Estimate declined.");
  };

  if (estimates.length === 0) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 md:px-20 py-10 text-center">
        <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
        <h2 className="font-display text-xl text-foreground mb-2">No Proposals Yet</h2>
        <p className="font-sans text-sm text-muted-foreground">When your advisor sends you an estimate, it will appear here for your review.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 md:px-20 py-10 space-y-6">
      <div>
        <h2 className="font-display text-2xl text-foreground">Proposals & Estimates</h2>
        <p className="font-sans text-sm text-muted-foreground mt-1">Review and respond to proposals from your advisor.</p>
      </div>

      {estimates.map((est: any) => {
        const lis = lineItems.filter((li: any) => li.estimate_id === est.id);
        return (
          <Card key={est.id} className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-sans font-bold text-foreground">{est.title}</h3>
                <p className="text-xs font-sans text-muted-foreground">Received {format(new Date(est.sent_at || est.created_at), "MMMM d, yyyy")}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-mono font-bold text-foreground">{fmt(est.total)}</span>
                <Badge className={`text-[10px] ${statusColors[est.status]}`}>{est.status.toUpperCase()}</Badge>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-sans text-xs">Service</TableHead>
                  <TableHead className="font-sans text-xs text-right">Qty</TableHead>
                  <TableHead className="font-sans text-xs text-right">Price</TableHead>
                  <TableHead className="font-sans text-xs text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lis.map((li: any) => (
                  <TableRow key={li.id}>
                    <TableCell className="font-sans text-sm">{li.description}</TableCell>
                    <TableCell className="font-mono text-sm text-right">{li.quantity}</TableCell>
                    <TableCell className="font-mono text-sm text-right">{fmt(li.unit_price)}</TableCell>
                    <TableCell className="font-mono text-sm text-right">{fmt(li.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-end">
              <div className="w-64 space-y-1 text-sm font-sans">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-mono">{fmt(est.subtotal)}</span></div>
                {est.discount_amount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="font-mono text-green-600">-{fmt(est.discount_type === "percent" ? est.subtotal * est.discount_amount / 100 : est.discount_amount)}</span></div>}
                {est.tax > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span className="font-mono">{fmt(est.tax)}</span></div>}
                <div className="flex justify-between font-bold pt-1 border-t border-border"><span>Total</span><span className="font-mono">{fmt(est.total)}</span></div>
              </div>
            </div>

            {est.notes && <div className="bg-muted/50 rounded-md p-3"><p className="text-xs font-sans text-muted-foreground">{est.notes}</p></div>}

            {est.status === "sent" && (
              <div className="flex justify-end gap-3 pt-2 border-t border-border">
                <Button variant="outline" className="gap-1.5 font-sans" onClick={() => respond(est.id, "declined")}>
                  <X className="w-4 h-4" />Decline
                </Button>
                <Button className="gap-1.5 font-sans" onClick={() => respond(est.id, "accepted")}>
                  <Check className="w-4 h-4" />Accept Proposal
                </Button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default EstimatesPortal;
