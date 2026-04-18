import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Star, Plus, BarChart3, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

interface VendorPerformanceCardProps {
  vendorId: string;
  vendorName: string;
}

const DIMENSIONS = [
  { key: "quality_rating", label: "Quality" },
  { key: "timeliness_rating", label: "Timeliness" },
  { key: "communication_rating", label: "Communication" },
  { key: "cost_accuracy_rating", label: "Cost Accuracy" },
] as const;

const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <button key={n} onClick={() => onChange(n)} className="p-0 bg-transparent border-none cursor-pointer">
        <Star className={`w-4 h-4 ${n <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
      </button>
    ))}
  </div>
);

const VendorPerformanceCard = ({ vendorId, vendorName }: VendorPerformanceCardProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    quality_rating: 3,
    timeliness_rating: 3,
    communication_rating: 3,
    cost_accuracy_rating: 3,
    notes: "",
  });

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["vendor-reviews", vendorId],
    queryFn: async () => {
      const { data, error } = await supabase.from("vendor_performance_reviews")
        .select("*")
        .eq("vendor_id", vendorId)
        .order("review_date", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const handleAdd = async () => {
    if (!user) return;
    const { error } = await supabase.from("vendor_performance_reviews").insert({
      vendor_id: vendorId,
      admin_id: user.id,
      ...form,
    });
    if (error) { toast.error("Failed to add review"); return; }
    toast.success("Performance review added");
    setAddOpen(false);
    setForm({ quality_rating: 3, timeliness_rating: 3, communication_rating: 3, cost_accuracy_rating: 3, notes: "" });
    queryClient.invalidateQueries({ queryKey: ["vendor-reviews", vendorId] });
  };

  // Compute averages
  const avgScores = DIMENSIONS.map((d) => {
    const vals = (reviews || []).map((r: any) => Number(r[d.key]));
    const avg = vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
    return { ...d, avg: Math.round(avg * 10) / 10 };
  });
  const overallAvg = avgScores.length > 0 ? avgScores.reduce((s, d) => s + d.avg, 0) / avgScores.length : 0;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-accent" />
          <h4 className="text-sm font-sans font-semibold text-foreground">{vendorName}</h4>
          {reviews && reviews.length > 0 && (
            <Badge variant="outline" className="text-[10px] font-sans">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</Badge>
          )}
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs font-sans gap-1"><Plus className="w-3 h-3" />Review</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-sans">Rate {vendorName}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              {DIMENSIONS.map((d) => (
                <div key={d.key} className="flex items-center justify-between">
                  <Label className="text-sm font-sans">{d.label}</Label>
                  <StarRating value={(form as any)[d.key]} onChange={(v) => setForm({ ...form, [d.key]: v })} />
                </div>
              ))}
              <div><Label className="font-sans text-xs">Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} /></div>
              <Button onClick={handleAdd} className="w-full font-sans">Submit Review</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      ) : reviews && reviews.length > 0 ? (
        <>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl font-mono font-bold text-foreground">{overallAvg.toFixed(1)}</span>
            <StarRating value={Math.round(overallAvg)} onChange={() => {}} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {avgScores.map((d) => (
              <div key={d.key} className="flex items-center justify-between p-1.5">
                <span className="text-[11px] font-sans text-muted-foreground">{d.label}</span>
                <span className="text-xs font-mono font-medium text-foreground">{d.avg.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-xs font-sans text-muted-foreground">No reviews yet</p>
      )}
    </Card>
  );
};

export default VendorPerformanceCard;
