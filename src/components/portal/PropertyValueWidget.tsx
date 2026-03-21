import { useState, useEffect } from "react";
import { TrendingUp, RefreshCw, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface PropertyValueWidgetProps {
  propertyId?: string;
  estimatedValue?: number | null;
}

const PropertyValueWidget = ({ propertyId, estimatedValue: initialValue }: PropertyValueWidgetProps) => {
  const [value, setValue] = useState<number | null>(initialValue ?? null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!propertyId || propertyId.startsWith("mock-")) return;
    const load = async () => {
      const { data } = await supabase
        .from("properties")
        .select("estimated_value, value_updated_at")
        .eq("id", propertyId)
        .single();
      if (data) {
        if (data.estimated_value) setValue(Number(data.estimated_value));
        if ((data as any).value_updated_at) setLastUpdated((data as any).value_updated_at);
      }
    };
    load();
  }, [propertyId]);

  const refresh = async () => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-home-value", {
        body: { propertyId },
      });
      if (error) throw error;
      if (data?.estimatedValue) {
        setValue(data.estimatedValue);
        setLastUpdated(new Date().toISOString());
      }
    } catch {
      // silently fail — value stays as-is
    } finally {
      setLoading(false);
    }
  };

  if (!value && !initialValue) return null;

  const displayValue = value || initialValue || 0;
  const formatted = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(displayValue);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Estimated Value</p>
            <p className="font-display text-2xl text-foreground">{formatted}</p>
            {lastUpdated && (
              <p className="text-[10px] font-sans text-muted-foreground">
                Updated {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}
              </p>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm" className="gap-1 text-xs font-sans" onClick={refresh} disabled={loading}>
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Refresh
        </Button>
      </div>
    </Card>
  );
};

export default PropertyValueWidget;
