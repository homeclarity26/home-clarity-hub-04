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
    const { role, userId, entityType, entityId, propertyId, pageKey } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const context: Record<string, any> = {};

    if (role === "creator" && userId) {
      // ── Advisor patterns ──
      const { data: patterns } = await supabase
        .from("advisor_patterns")
        .select("pattern_type, pattern_key, pattern_data, confidence_score, usage_count")
        .eq("admin_id", userId)
        .gte("confidence_score", 0.3)
        .order("confidence_score", { ascending: false })
        .limit(10);

      if (patterns && patterns.length > 0) {
        context.advisor_patterns = patterns.map((p: any) => ({
          type: p.pattern_type,
          key: p.pattern_key,
          data: p.pattern_data,
          confidence: p.confidence_score,
          uses: p.usage_count,
        }));
      }

      // ── Recent suggestion outcomes (acceptance rate) ──
      const { data: outcomes } = await supabase
        .from("ai_suggestion_outcomes")
        .select("suggestion_type, outcome")
        .eq("admin_id", userId)
        .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString())
        .limit(100);

      if (outcomes && outcomes.length > 0) {
        const byType = new Map<string, { accepted: number; edited: number; rejected: number }>();
        for (const o of outcomes) {
          if (!byType.has(o.suggestion_type)) byType.set(o.suggestion_type, { accepted: 0, edited: 0, rejected: 0 });
          const counts = byType.get(o.suggestion_type)!;
          if (o.outcome === "accepted") counts.accepted++;
          else if (o.outcome === "edited") counts.edited++;
          else if (o.outcome === "rejected") counts.rejected++;
        }
        context.suggestion_history = Object.fromEntries(
          [...byType.entries()].map(([type, counts]) => [type, {
            ...counts,
            total: counts.accepted + counts.edited + counts.rejected,
            acceptance_rate: Math.round((counts.accepted / (counts.accepted + counts.edited + counts.rejected)) * 100),
          }])
        );
      }

      // ── Cross-client insights relevant to this property ──
      if (propertyId) {
        const { data: prop } = await supabase
          .from("properties")
          .select("metadata")
          .eq("id", propertyId)
          .single();

        if (prop?.metadata?.year_built) {
          const decade = `${Math.floor(Number(prop.metadata.year_built) / 10) * 10}s`;
          const { data: insights } = await supabase
            .from("cross_client_insights")
            .select("insight_type, insight_key, insight_data, confidence")
            .or(`insight_key.ilike.%${decade}%,insight_type.eq.budget_pattern`)
            .gte("confidence", 0.3)
            .limit(5);

          if (insights && insights.length > 0) {
            context.cross_client_insights = insights;
          }
        }
      }
    }

    if (role === "client" && userId) {
      // ── Client behavior profile ──
      const { data: profile } = await supabase
        .from("client_behavior_profiles")
        .select("*")
        .eq("client_id", userId)
        .single();

      if (profile) {
        context.behavior_profile = {
          engagement_level: profile.engagement_level,
          communication_preference: profile.communication_preference,
          satisfaction_trend: profile.satisfaction_trend,
          goals_active: profile.goals_active,
          focus_areas: profile.portal_focus_areas,
        };
      }

      // ── Cross-client insights relevant to their home ──
      if (propertyId) {
        const { data: prop } = await supabase
          .from("properties")
          .select("metadata")
          .eq("id", propertyId)
          .single();

        if (prop?.metadata?.year_built) {
          const decade = `${Math.floor(Number(prop.metadata.year_built) / 10) * 10}s`;
          const { data: insights } = await supabase
            .from("cross_client_insights")
            .select("insight_type, insight_key, insight_data")
            .ilike("insight_key", `%${decade}%`)
            .limit(3);

          if (insights && insights.length > 0) {
            context.home_insights = insights.map((i: any) => i.insight_data);
          }
        }
      }
    }

    return new Response(
      JSON.stringify(context),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("get-smart-context error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
