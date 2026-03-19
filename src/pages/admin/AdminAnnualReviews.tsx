import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminHeader from "@/components/admin/AdminHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Award, ArrowLeft, RefreshCw, CheckCircle, AlertTriangle, TrendingUp, TrendingDown, Minus, DollarSign, Star, Flag, MessageSquare, Target, Gift, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { differenceInDays, format } from "date-fns";

const AdminAnnualReviews = () => {
  const qc = useQueryClient();
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [outcomeNotes, setOutcomeNotes] = useState("");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Load all clients with memberships
  const { data: clients, isLoading } = useQuery({
    queryKey: ["annual-review-clients"],
    queryFn: async () => {
      const { data: memberships } = await (supabase.from("client_memberships") as any)
        .select("*, membership_tiers(*)")
        .order("current_period_end", { ascending: true });

      if (!memberships?.length) return [];

      const clientIds = [...new Set(memberships.map((m: any) => m.client_id))] as string[];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", clientIds);
      const { data: properties } = await supabase.from("properties").select("id, property_name, address, client_user_id").in("client_user_id", clientIds);

      // Load existing reviews for current year
      const year = new Date().getFullYear();
      const propIds = (properties || []).map((p: any) => p.id) as string[];
      const { data: reviews } = await (supabase.from("annual_reviews" as any) as any)
        .select("*")
        .in("property_id", propIds.length ? propIds : ["none"])
        .eq("review_year", year);

      return memberships.map((m: any) => {
        const profile = profiles?.find((p: any) => p.user_id === m.client_id);
        const property = properties?.find((p: any) => p.client_user_id === m.client_id);
        const review = reviews?.find((r: any) => r.property_id === property?.id && r.review_year === year);
        const renewalDate = m.current_period_end ? new Date(m.current_period_end) : null;
        const daysUntilRenewal = renewalDate ? differenceInDays(renewalDate, new Date()) : null;

        return {
          ...m,
          profile,
          property,
          review,
          renewalDate,
          daysUntilRenewal,
        };
      }).sort((a: any, b: any) => (a.daysUntilRenewal ?? 999) - (b.daysUntilRenewal ?? 999));
    },
  });

  const handleGenerate = async (client: any) => {
    if (!client.property) { toast.error("No property linked"); return; }
    setGenerating(client.client_id);
    try {
      const { data, error } = await supabase.functions.invoke("generate-annual-review", {
        body: {
          client_id: client.client_id,
          review_year: new Date().getFullYear(),
          property_id: client.property.id,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Annual review brief generated");
      qc.invalidateQueries({ queryKey: ["annual-review-clients"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to generate");
    } finally {
      setGenerating(null);
    }
  };

  const handleComplete = async (reviewId: string) => {
    await (supabase.from("annual_reviews" as any) as any)
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        outcome_notes: outcomeNotes || null,
      })
      .eq("id", reviewId);
    toast.success("Review marked complete");
    setOutcomeNotes("");
    qc.invalidateQueries({ queryKey: ["annual-review-clients"] });
  };

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const statusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      not_started: { variant: "secondary", label: "Not Started" },
      brief_generated: { variant: "default", label: "Brief Ready" },
      review_scheduled: { variant: "outline", label: "Scheduled" },
      completed: { variant: "secondary", label: "Completed" },
    };
    const v = variants[status] || variants.not_started;
    return <Badge variant={v.variant} className="text-[10px] font-sans">{v.label}</Badge>;
  };

  if (selectedReview) {
    return <ReviewDetail review={selectedReview} onBack={() => setSelectedReview(null)} onComplete={handleComplete} outcomeNotes={outcomeNotes} setOutcomeNotes={setOutcomeNotes} expandedSections={expandedSections} toggleSection={toggleSection} onRegenerate={() => handleGenerate(selectedReview)} generating={generating === selectedReview.client_id} />;
  }

  return (
    <div>
      <AdminHeader breadcrumbs={[{ label: "Annual Reviews" }]} />
      <div className="p-6 max-w-5xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-sans font-bold text-foreground flex items-center gap-2"><Award className="w-5 h-5 text-primary" />Annual Reviews</h1>
            <p className="text-sm text-muted-foreground font-sans mt-1">Prepare advisor briefings for membership renewal calls</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : !clients?.length ? (
          <Card className="p-8 text-center"><p className="text-sm font-sans text-muted-foreground">No clients with memberships found.</p></Card>
        ) : (
          <div className="space-y-2">
            {clients.map((client: any) => {
              const isUrgent = client.daysUntilRenewal !== null && client.daysUntilRenewal <= 90 && client.daysUntilRenewal > 0;
              const isOverdue = client.daysUntilRenewal !== null && client.daysUntilRenewal <= 0;
              return (
                <Card key={client.id} className={`p-4 cursor-pointer hover:bg-muted/30 transition-colors ${isUrgent ? "border-amber-300 dark:border-amber-700" : isOverdue ? "border-destructive/50" : ""}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-sans font-bold text-primary shrink-0">
                      {(client.profile?.full_name || "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0" onClick={() => client.review && setSelectedReview(client)}>
                      <p className="text-sm font-sans font-medium text-foreground truncate">{client.profile?.full_name || client.profile?.email || "Unknown"}</p>
                      <p className="text-[10px] text-muted-foreground font-sans truncate">{client.property?.address || "No property"}</p>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      {client.renewalDate && (
                        <p className={`text-xs font-mono ${isOverdue ? "text-destructive" : isUrgent ? "text-amber-600" : "text-muted-foreground"}`}>
                          {isOverdue ? "Overdue" : `${client.daysUntilRenewal}d`}
                        </p>
                      )}
                      {client.renewalDate && (
                        <p className="text-[10px] text-muted-foreground font-sans">{format(client.renewalDate, "MMM d, yyyy")}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isUrgent && !client.review && <Badge variant="outline" className="text-[9px] border-amber-400 text-amber-600">Renewal Soon</Badge>}
                      {client.review ? statusBadge(client.review.status) : statusBadge("not_started")}
                      {!client.review || client.review.status === "not_started" ? (
                        <Button size="sm" variant="outline" className="text-xs font-sans gap-1" onClick={() => handleGenerate(client)} disabled={generating === client.client_id}>
                          {generating === client.client_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Award className="w-3 h-3" />}
                          Generate
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" className="text-xs font-sans" onClick={() => setSelectedReview(client)}>
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// Briefing detail view
const ReviewDetail = ({ review, onBack, onComplete, outcomeNotes, setOutcomeNotes, expandedSections, toggleSection, onRegenerate, generating }: any) => {
  const briefing = review.review?.briefing_json || {};
  const crs = briefing.client_relationship_summary || {};
  const fin = briefing.financial_summary || {};
  const hht = briefing.home_health_trajectory || {};
  const signals = briefing.client_signals || {};
  const offer = briefing.suggested_renewal_offer || {};

  const healthColor = hht.direction === "improving" ? "text-emerald-600" : hht.direction === "declining" ? "text-destructive" : "text-muted-foreground";
  const HealthIcon = hht.direction === "improving" ? TrendingUp : hht.direction === "declining" ? TrendingDown : Minus;
  const relationshipColor = crs.relationship_health === "strong" ? "bg-emerald-500" : crs.relationship_health === "at_risk" ? "bg-destructive" : "bg-amber-500";

  return (
    <div>
      <AdminHeader breadcrumbs={[{ label: "Annual Reviews", path: "/admin/annual-reviews" }, { label: review.profile?.full_name || "Review" }]} />
      <div className="p-6 max-w-4xl space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="gap-2 text-sm font-sans"><ArrowLeft className="w-4 h-4" />Back</Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onRegenerate} disabled={generating} className="gap-1.5 text-xs font-sans">
              {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}Regenerate
            </Button>
            {review.review?.status !== "completed" && (
              <Button size="sm" onClick={() => onComplete(review.review?.id)} className="gap-1.5 text-xs font-sans">
                <CheckCircle className="w-3 h-3" />Mark Complete
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-4 pr-4">
            {/* Relationship Summary */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2.5 h-2.5 rounded-full ${relationshipColor}`} />
                <h3 className="text-sm font-sans font-semibold text-foreground">Client Relationship</h3>
                <Badge variant="secondary" className="text-[10px] capitalize">{crs.engagement_level || "?"} engagement</Badge>
              </div>
              <p className="text-sm font-sans text-foreground leading-relaxed">{crs.summary}</p>
              <p className="text-[10px] text-muted-foreground font-sans mt-2">Member since: {crs.member_since}</p>
            </Card>

            {/* Year in Review */}
            <Card className="p-5">
              <h3 className="text-sm font-sans font-semibold text-foreground mb-3 flex items-center gap-2"><Star className="w-4 h-4 text-primary" />Year in Review</h3>
              <p className="text-sm font-sans text-foreground leading-relaxed whitespace-pre-line">{briefing.year_in_review}</p>
            </Card>

            {/* Financial + Health side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-5">
                <h3 className="text-sm font-sans font-semibold text-foreground mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary" />Financial Summary</h3>
                <div className="space-y-2 text-sm font-sans">
                  <div className="flex justify-between"><span className="text-muted-foreground">Total Invested</span><span className="font-mono font-medium">${(fin.total_invested || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Total Invoiced</span><span className="font-mono font-medium">${(fin.total_invoiced || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Outstanding</span><span className={`font-mono font-medium ${fin.outstanding > 0 ? "text-destructive" : ""}`}>${(fin.outstanding || 0).toLocaleString()}</span></div>
                </div>
                <p className="text-xs font-sans text-muted-foreground mt-3 leading-relaxed">{fin.roi_narrative}</p>
              </Card>

              <Card className="p-5">
                <h3 className="text-sm font-sans font-semibold text-foreground mb-3 flex items-center gap-2"><HealthIcon className={`w-4 h-4 ${healthColor}`} />Home Health Trajectory</h3>
                <Badge variant="outline" className={`text-xs capitalize ${healthColor} mb-2`}>{hht.direction || "unknown"}</Badge>
                <p className="text-sm font-sans text-foreground leading-relaxed">{hht.explanation}</p>
              </Card>
            </div>

            {/* Top 3 Wins */}
            {briefing.top_three_wins?.length > 0 && (
              <Card className="p-5">
                <h3 className="text-sm font-sans font-semibold text-foreground mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-primary" />Top Wins</h3>
                <div className="space-y-3">
                  {briefing.top_three_wins.map((w: any, i: number) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-lg font-mono font-bold text-primary/40">{i + 1}</span>
                      <div><p className="text-sm font-sans font-medium text-foreground">{w.title}</p><p className="text-xs text-muted-foreground font-sans">{w.description}</p></div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Open Items */}
            {briefing.open_items?.length > 0 && (
              <Card className="p-5">
                <button onClick={() => toggleSection("open")} className="w-full flex items-center justify-between bg-transparent border-none cursor-pointer p-0">
                  <h3 className="text-sm font-sans font-semibold text-foreground flex items-center gap-2"><Flag className="w-4 h-4 text-destructive" />Open Items ({briefing.open_items.length})</h3>
                  {expandedSections["open"] ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
                {expandedSections["open"] && (
                  <div className="mt-3 space-y-2">
                    {briefing.open_items.map((item: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded bg-muted/30">
                        <Badge variant={item.priority === "high" ? "destructive" : "secondary"} className="text-[9px] shrink-0 mt-0.5">{item.priority}</Badge>
                        <div><p className="text-xs font-sans text-foreground">{item.item}</p><p className="text-[10px] text-muted-foreground">{item.category}</p></div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Client Signals */}
            <Card className="p-5">
              <button onClick={() => toggleSection("signals")} className="w-full flex items-center justify-between bg-transparent border-none cursor-pointer p-0">
                <h3 className="text-sm font-sans font-semibold text-foreground flex items-center gap-2"><MessageSquare className="w-4 h-4 text-primary" />Client Signals</h3>
                {expandedSections["signals"] ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>
              {expandedSections["signals"] && (
                <div className="mt-3 space-y-2 text-sm font-sans">
                  <p><span className="text-muted-foreground">Engagement:</span> {signals.engagement_pattern}</p>
                  <p><span className="text-muted-foreground">Satisfaction:</span> {signals.satisfaction_trend}</p>
                  {signals.top_topics?.length > 0 && <p><span className="text-muted-foreground">Top Topics:</span> {signals.top_topics.join(", ")}</p>}
                  {signals.risk_flags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {signals.risk_flags.map((f: string, i: number) => (
                        <Badge key={i} variant="destructive" className="text-[9px]">{f}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Renewal Talking Points */}
            {briefing.renewal_talking_points?.length > 0 && (
              <Card className="p-5">
                <h3 className="text-sm font-sans font-semibold text-foreground mb-3 flex items-center gap-2"><Target className="w-4 h-4 text-primary" />Renewal Talking Points</h3>
                <ul className="space-y-1.5">
                  {briefing.renewal_talking_points.map((pt: string, i: number) => (
                    <li key={i} className="text-sm font-sans text-foreground flex gap-2"><span className="text-primary font-bold">•</span>{pt}</li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Next Year Priorities */}
            {briefing.recommended_next_year_priorities?.length > 0 && (
              <Card className="p-5">
                <h3 className="text-sm font-sans font-semibold text-foreground mb-3">Recommended Next Year Priorities</h3>
                <div className="space-y-3">
                  {briefing.recommended_next_year_priorities.map((p: any, i: number) => (
                    <div key={i} className="p-3 rounded-md bg-muted/30">
                      <p className="text-sm font-sans font-medium text-foreground">{p.title}</p>
                      <p className="text-xs text-muted-foreground font-sans mt-1">{p.rationale}</p>
                      {p.estimated_investment && <p className="text-[10px] font-mono text-primary mt-1">Est. {p.estimated_investment}</p>}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Suggested Renewal Offer */}
            <Card className="p-5 border-primary/20">
              <h3 className="text-sm font-sans font-semibold text-foreground mb-2 flex items-center gap-2"><Gift className="w-4 h-4 text-primary" />Suggested Renewal Offer</h3>
              <Badge variant="default" className="text-xs capitalize mb-2">{offer.recommendation}</Badge>
              <p className="text-sm font-sans text-foreground leading-relaxed">{offer.reasoning}</p>
            </Card>

            {/* Outcome Notes */}
            {review.review?.status !== "completed" && (
              <Card className="p-5">
                <h3 className="text-sm font-sans font-semibold text-foreground mb-2">Outcome Notes</h3>
                <Textarea
                  value={outcomeNotes}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                  placeholder="Add notes after the review call..."
                  rows={3}
                  className="font-sans text-sm"
                />
              </Card>
            )}
            {review.review?.outcome_notes && (
              <Card className="p-5 bg-muted/20">
                <h3 className="text-sm font-sans font-semibold text-foreground mb-2">Review Outcome</h3>
                <p className="text-sm font-sans text-foreground">{review.review.outcome_notes}</p>
                {review.review.completed_at && <p className="text-[10px] text-muted-foreground font-sans mt-2">Completed {format(new Date(review.review.completed_at), "MMM d, yyyy")}</p>}
              </Card>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default AdminAnnualReviews;
