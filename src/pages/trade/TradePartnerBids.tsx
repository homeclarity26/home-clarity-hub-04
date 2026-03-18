import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Clock, FileText } from "lucide-react";
import { useMyBids } from "@/hooks/useTradePartnerData";
import { format } from "date-fns";

const statusColor = (s: string) => {
  const m: Record<string, string> = { pending: "bg-amber-100 text-amber-800", accepted: "bg-emerald-100 text-emerald-800", rejected: "bg-red-100 text-red-800", expired: "bg-muted text-muted-foreground" };
  return m[s] || "bg-muted text-muted-foreground";
};

const TradePartnerBids = () => {
  const { data: bids, isLoading } = useMyBids();

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>;

  const openBids = (bids || []).filter((b: any) => b.status === "pending");
  const pastBids = (bids || []).filter((b: any) => b.status !== "pending");

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-sans font-bold text-foreground">Bids & Quotes</h1>

      {(bids || []).length === 0 ? (
        <Card className="p-12 text-center">
          <DollarSign className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-sm font-sans font-semibold text-foreground mb-1">No bids</h3>
          <p className="text-xs text-muted-foreground font-sans">Bid invitations and your submitted quotes will appear here.</p>
        </Card>
      ) : (
        <>
          {openBids.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-sans font-semibold text-muted-foreground uppercase tracking-wider">Open Bids ({openBids.length})</h2>
              {openBids.map((b: any) => <BidCard key={b.id} bid={b} />)}
            </div>
          )}
          {pastBids.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-sans font-semibold text-muted-foreground uppercase tracking-wider">Past Bids ({pastBids.length})</h2>
              {pastBids.map((b: any) => <BidCard key={b.id} bid={b} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const BidCard = ({ bid }: { bid: any }) => (
  <Card className="p-4">
    <div className="flex items-center justify-between mb-2">
      <div>
        <h4 className="text-sm font-sans font-medium text-foreground">{bid.scope_of_work || "Bid"}</h4>
        <p className="text-xs text-muted-foreground font-sans">{bid.projects?.title || "Project"}</p>
      </div>
      <Badge className={`text-[10px] font-sans ${statusColor(bid.status)}`}>{bid.status}</Badge>
    </div>
    <div className="flex items-center gap-4 text-xs text-muted-foreground font-sans">
      <span className="flex items-center gap-1 text-foreground font-medium"><DollarSign className="w-3 h-3" />${Number(bid.bid_amount).toLocaleString()}</span>
      {bid.estimated_timeline && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{bid.estimated_timeline}</span>}
      <span>{format(new Date(bid.created_at), "MMM d, yyyy")}</span>
    </div>
    {bid.notes && <p className="text-xs text-muted-foreground font-sans mt-2 border-t border-border pt-2">{bid.notes}</p>}
  </Card>
);

export default TradePartnerBids;
