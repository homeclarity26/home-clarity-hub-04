import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const results: string[] = [];

    // ─── PHASE 2: Extract advisor patterns from learning_events ───
    await extractAdvisorPatterns(supabase, results);

    // ─── PHASE 4: Compute client behavior profiles ───
    await computeClientBehaviorProfiles(supabase, results);

    // ─── PHASE 5: Aggregate cross-client insights ───
    await aggregateCrossClientInsights(supabase, results);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("learn-from-activity error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ─── ADVISOR PATTERN EXTRACTION ───
async function extractAdvisorPatterns(supabase: any, results: string[]) {
  // Analyze report page completions for structure patterns
  const { data: reportEvents } = await supabase
    .from("learning_events")
    .select("actor_id, entity_type, entity_id, event_data, event_type")
    .in("event_type", ["report_page_updated", "draft_narrative_accepted", "draft_narrative_edited", "estimate_created", "estimate_sent"])
    .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString())
    .limit(500);

  if (!reportEvents || reportEvents.length === 0) {
    results.push("No recent learning events to process for advisor patterns");
    return;
  }

  // Group by actor
  const byActor = new Map<string, any[]>();
  for (const evt of reportEvents) {
    if (!evt.actor_id) continue;
    if (!byActor.has(evt.actor_id)) byActor.set(evt.actor_id, []);
    byActor.get(evt.actor_id)!.push(evt);
  }

  let patternsUpserted = 0;

  for (const [adminId, events] of byActor) {
    // Report writing patterns
    const reportEdits = events.filter((e: any) => e.event_type === "report_page_updated");
    if (reportEdits.length > 0) {
      const pageKeys = reportEdits.map((e: any) => e.event_data?.page_key).filter(Boolean);
      const avgNarrativeLength = reportEdits
        .map((e: any) => e.event_data?.narrative_length || 0)
        .filter((n: number) => n > 0);

      const patternData = {
        common_page_keys: [...new Set(pageKeys)],
        avg_narrative_paragraphs: avgNarrativeLength.length > 0
          ? Math.round(avgNarrativeLength.reduce((a: number, b: number) => a + b, 0) / avgNarrativeLength.length)
          : 3,
        recent_condition_ratings: reportEdits
          .map((e: any) => e.event_data?.condition_rating)
          .filter(Boolean)
          .slice(-20),
        edit_count: reportEdits.length,
      };

      await supabase.from("advisor_patterns").upsert({
        admin_id: adminId,
        pattern_type: "report_structure",
        pattern_key: "general",
        pattern_data: patternData,
        usage_count: reportEdits.length,
        last_used_at: new Date().toISOString(),
        confidence_score: Math.min(0.99, 0.3 + reportEdits.length * 0.05),
      }, { onConflict: "admin_id,pattern_type,pattern_key" });
      patternsUpserted++;
    }

    // Estimate pricing patterns
    const estimateEvents = events.filter((e: any) => e.event_type === "estimate_created");
    if (estimateEvents.length > 0) {
      const avgTotal = estimateEvents
        .map((e: any) => e.event_data?.total || 0)
        .filter((n: number) => n > 0);

      const patternData = {
        avg_estimate_total: avgTotal.length > 0
          ? Math.round(avgTotal.reduce((a: number, b: number) => a + b, 0) / avgTotal.length)
          : 0,
        estimate_count: estimateEvents.length,
        common_service_types: estimateEvents
          .map((e: any) => e.event_data?.title)
          .filter(Boolean)
          .slice(-10),
      };

      await supabase.from("advisor_patterns").upsert({
        admin_id: adminId,
        pattern_type: "pricing_pattern",
        pattern_key: "general",
        pattern_data: patternData,
        usage_count: estimateEvents.length,
        last_used_at: new Date().toISOString(),
        confidence_score: Math.min(0.99, 0.3 + estimateEvents.length * 0.07),
      }, { onConflict: "admin_id,pattern_type,pattern_key" });
      patternsUpserted++;
    }

    // AI suggestion acceptance patterns
    const draftAccepted = events.filter((e: any) => e.event_type === "draft_narrative_accepted");
    const draftEdited = events.filter((e: any) => e.event_type === "draft_narrative_edited");
    if (draftAccepted.length + draftEdited.length > 0) {
      const total = draftAccepted.length + draftEdited.length;
      const acceptRate = draftAccepted.length / total;

      await supabase.from("advisor_patterns").upsert({
        admin_id: adminId,
        pattern_type: "communication_style",
        pattern_key: "ai_draft_preferences",
        pattern_data: {
          acceptance_rate: Math.round(acceptRate * 100),
          total_suggestions: total,
          common_edits: draftEdited.map((e: any) => e.event_data?.edit_summary).filter(Boolean).slice(-5),
        },
        usage_count: total,
        last_used_at: new Date().toISOString(),
        confidence_score: Math.min(0.99, 0.3 + total * 0.05),
      }, { onConflict: "admin_id,pattern_type,pattern_key" });
      patternsUpserted++;
    }
  }

  results.push(`Advisor patterns: ${patternsUpserted} upserted from ${reportEvents.length} events`);
}

// ─── CLIENT BEHAVIOR PROFILING ───
async function computeClientBehaviorProfiles(supabase: any, results: string[]) {
  // Get all clients with recent activity
  const { data: sessions } = await supabase
    .from("client_sessions")
    .select("client_id, session_duration_minutes, pages_visited, login_at")
    .gte("login_at", new Date(Date.now() - 30 * 86400000).toISOString())
    .limit(1000);

  if (!sessions || sessions.length === 0) {
    results.push("No recent client sessions for behavior profiling");
    return;
  }

  // Group by client
  const byClient = new Map<string, any[]>();
  for (const s of sessions) {
    if (!byClient.has(s.client_id)) byClient.set(s.client_id, []);
    byClient.get(s.client_id)!.push(s);
  }

  let profilesUpdated = 0;

  for (const [clientId, clientSessions] of byClient) {
    const totalDuration = clientSessions.reduce((s: number, cs: any) => s + (cs.session_duration_minutes || 0), 0);
    const sessionCount = clientSessions.length;

    // Determine engagement level
    let engagement = "medium";
    if (sessionCount >= 10 && totalDuration >= 60) engagement = "high";
    else if (sessionCount <= 2 && totalDuration < 10) engagement = "low";
    else if (sessionCount === 0) engagement = "dormant";

    // Aggregate focus areas
    const pageCounts = new Map<string, number>();
    for (const s of clientSessions) {
      const pages = Array.isArray(s.pages_visited) ? s.pages_visited : [];
      for (const p of pages) {
        pageCounts.set(p, (pageCounts.get(p) || 0) + 1);
      }
    }
    const topPages = [...pageCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([page]) => page);

    // Communication preference from session patterns
    let commPref = "summary";
    if (totalDuration > 120 && sessionCount > 8) commPref = "detailed";
    else if (totalDuration < 15) commPref = "minimal";

    // Get feedback trend
    const { data: feedback } = await supabase
      .from("feedback")
      .select("rating, created_at")
      .eq("user_id", clientId)
      .order("created_at", { ascending: false })
      .limit(5);

    let trend = "stable";
    if (feedback && feedback.length >= 2) {
      const recent = feedback.slice(0, Math.ceil(feedback.length / 2));
      const older = feedback.slice(Math.ceil(feedback.length / 2));
      const recentAvg = recent.reduce((s: number, f: any) => s + f.rating, 0) / recent.length;
      const olderAvg = older.reduce((s: number, f: any) => s + f.rating, 0) / older.length;
      if (recentAvg > olderAvg + 0.5) trend = "improving";
      else if (recentAvg < olderAvg - 0.5) trend = "declining";
    }

    // Churn risk (simple heuristic)
    const daysSinceLastSession = Math.floor(
      (Date.now() - new Date(clientSessions[0].login_at).getTime()) / 86400000
    );
    let churnRisk = 10;
    if (daysSinceLastSession > 60) churnRisk = 80;
    else if (daysSinceLastSession > 30) churnRisk = 50;
    else if (daysSinceLastSession > 14) churnRisk = 30;
    if (trend === "declining") churnRisk = Math.min(100, churnRisk + 20);

    // Active goals count
    const { count: goalsCount } = await supabase
      .from("client_goals")
      .select("*", { count: "exact", head: true })
      .eq("client_id", clientId)
      .eq("status", "active");

    await supabase.from("client_behavior_profiles").upsert({
      client_id: clientId,
      engagement_level: engagement,
      communication_preference: commPref,
      portal_focus_areas: topPages,
      goals_active: goalsCount || 0,
      satisfaction_trend: trend,
      churn_risk_score: churnRisk,
      last_computed_at: new Date().toISOString(),
    }, { onConflict: "client_id" });
    profilesUpdated++;
  }

  results.push(`Client profiles: ${profilesUpdated} updated from ${sessions.length} sessions`);
}

// ─── CROSS-CLIENT INSIGHTS ───
async function aggregateCrossClientInsights(supabase: any, results: string[]) {
  // Pattern: Homes by decade and common condition issues
  const { data: properties } = await supabase
    .from("properties")
    .select("id, metadata")
    .limit(500);

  if (!properties || properties.length === 0) {
    results.push("No properties for cross-client insights");
    return;
  }

  let insightsUpserted = 0;

  // Group by decade
  const byDecade = new Map<string, string[]>();
  for (const p of properties) {
    const yearBuilt = p.metadata?.year_built;
    if (!yearBuilt) continue;
    const decade = `${Math.floor(Number(yearBuilt) / 10) * 10}s`;
    if (!byDecade.has(decade)) byDecade.set(decade, []);
    byDecade.get(decade)!.push(p.id);
  }

  for (const [decade, propIds] of byDecade) {
    if (propIds.length < 2) continue;

    // Find common condition issues for this decade
    const { data: pages } = await supabase
      .from("report_pages")
      .select("title, condition_rating, report_id")
      .in("report_id", (await supabase.from("reports").select("id").in("property_id", propIds.slice(0, 50))).data?.map((r: any) => r.id) || [])
      .in("condition_rating", ["poor", "critical", "fair"]);

    if (pages && pages.length > 0) {
      const issueCounts = new Map<string, number>();
      for (const p of pages) {
        const key = `${p.title}_${p.condition_rating}`;
        issueCounts.set(key, (issueCounts.get(key) || 0) + 1);
      }

      const topIssues = [...issueCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([key, count]) => {
          const [title, rating] = key.split("_");
          return { system: title, condition: rating, occurrences: count };
        });

      if (topIssues.length > 0) {
        await supabase.from("cross_client_insights").upsert({
          insight_type: "common_issue",
          insight_key: `homes_${decade}_conditions`,
          insight_data: { decade, common_issues: topIssues, sample_size: propIds.length },
          affected_client_count: propIds.length,
          confidence: Math.min(0.99, 0.3 + propIds.length * 0.05),
          last_updated: new Date().toISOString(),
        }, { onConflict: "insight_type,insight_key" });
        insightsUpserted++;
      }
    }
  }

  // Budget pattern: Projects over/under budget
  const { data: projects } = await supabase
    .from("projects")
    .select("title, estimated_cost, actual_cost, status")
    .eq("status", "completed")
    .not("estimated_cost", "is", null)
    .not("actual_cost", "is", null)
    .limit(200);

  if (projects && projects.length >= 3) {
    const overBudget = projects.filter((p: any) => p.actual_cost > p.estimated_cost);
    const underBudget = projects.filter((p: any) => p.actual_cost <= p.estimated_cost);
    const avgOverrun = overBudget.length > 0
      ? overBudget.reduce((s: number, p: any) => s + ((p.actual_cost - p.estimated_cost) / p.estimated_cost) * 100, 0) / overBudget.length
      : 0;

    await supabase.from("cross_client_insights").upsert({
      insight_type: "budget_pattern",
      insight_key: "project_budget_accuracy",
      insight_data: {
        total_projects: projects.length,
        over_budget_count: overBudget.length,
        under_budget_count: underBudget.length,
        avg_overrun_percent: Math.round(avgOverrun),
      },
      affected_client_count: projects.length,
      confidence: Math.min(0.99, 0.3 + projects.length * 0.03),
      last_updated: new Date().toISOString(),
    }, { onConflict: "insight_type,insight_key" });
    insightsUpserted++;
  }

  results.push(`Cross-client insights: ${insightsUpserted} upserted`);
}
