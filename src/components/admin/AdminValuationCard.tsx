import { useState } from "react";
import { RefreshCw, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePropertyValuation } from "@/hooks/usePropertyValuation";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

interface AdminValuationCardProps {
  propertyId: string;
  address: string;
  estimatedValue?: number | null;
}

const AdminValuationCard = ({ propertyId, address, estimatedValue }: AdminValuationCardProps) => {
  const { valuation, isLoading, fetchValuation } = usePropertyValuation(propertyId, address);
  const [hasRequested, setHasRequested] = useState(false);

  const handleRefresh = () => {
    setHasRequested(true);
    fetchValuation(true);
  };

  const handleFetch = () => {
    setHasRequested(true);
    fetchValuation(false);
  };

  const price = valuation?.price;
  const low = valuation?.price_range_low;
  const high = valuation?.price_range_high;
  const fetchedAt = valuation?.fetched_at;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent" />
          <h3 className="font-sans font-semibold text-foreground">Property Valuation</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={price ? handleRefresh : handleFetch}
          disabled={isLoading}
          className="gap-1.5 font-mono text-[10px] uppercase tracking-wider"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          {price ? "Refresh" : "Fetch Valuation"}
        </Button>
      </div>

      {price ? (
        <div className="space-y-3">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Estimated Value</p>
            <p className="font-display text-2xl text-foreground">{fmt(price)}</p>
          </div>
          {low != null && high != null && (
            <div className="flex gap-6">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Low</p>
                <p className="font-sans text-sm text-foreground">{fmt(low)}</p>
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">High</p>
                <p className="font-sans text-sm text-foreground">{fmt(high)}</p>
              </div>
            </div>
          )}
          {fetchedAt && (
            <p className="font-mono text-[9px] text-muted-foreground">
              Last updated: {new Date(fetchedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      ) : (
        <p className="font-sans text-sm text-muted-foreground">
          {isLoading ? "Fetching valuation..." : hasRequested ? "No valuation data available." : estimatedValue ? `Manual estimate: ${fmt(estimatedValue)}` : "Click 'Fetch Valuation' to get a Rentcast AVM estimate."}
        </p>
      )}
    </Card>
  );
};

export default AdminValuationCard;
