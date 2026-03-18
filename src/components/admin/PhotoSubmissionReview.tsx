import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, CheckCircle, Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface PhotoSubmissionReviewProps {
  propertyId: string;
}

const PhotoSubmissionReview = ({ propertyId }: PhotoSubmissionReviewProps) => {
  const qc = useQueryClient();

  const { data: submissions = [] } = useQuery({
    queryKey: ["photo-submissions", propertyId],
    queryFn: async () => {
      const { data } = await (supabase.from("photo_submissions") as any)
        .select("*")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const markReviewed = async (id: string) => {
    await (supabase.from("photo_submissions") as any).update({ review_status: "reviewed", reviewed_at: new Date().toISOString() }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["photo-submissions", propertyId] });
    toast.success("Marked as reviewed");
  };

  if (submissions.length === 0) return null;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Camera className="w-4 h-4 text-accent" />
        <h4 className="text-sm font-sans font-semibold text-foreground">Client Photo Submissions</h4>
        <Badge variant="secondary" className="text-[10px]">{submissions.filter((s: any) => s.review_status === "pending").length} pending</Badge>
      </div>
      <div className="space-y-2">
        {submissions.slice(0, 5).map((sub: any) => (
          <div key={sub.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <div className="flex items-center gap-2">
              {sub.is_concern && <Flag className="w-3 h-3 text-destructive" />}
              <Badge variant="outline" className="text-[9px] font-mono">{sub.tag}</Badge>
              {sub.notes && <span className="text-xs font-sans text-muted-foreground truncate max-w-[150px]">{sub.notes}</span>}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={sub.review_status === "pending" ? "destructive" : "secondary"} className="text-[10px]">
                {sub.review_status}
              </Badge>
              {sub.review_status === "pending" && (
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => markReviewed(sub.id)}>
                  <CheckCircle className="w-3 h-3 mr-1" />Review
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default PhotoSubmissionReview;
