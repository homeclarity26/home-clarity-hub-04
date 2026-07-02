import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth, corsHeaders, json } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Identity comes from the verified JWT, never from the request body. A
  // previous version read { role, userId } off the body with no auth, which
  // let any anonymous caller read a creator's advisor patterns.
  const auth = await requireAuth(req);
  if ("error" in auth) return auth.error;

  try {
    const { propertyId } = await req.json().catch(() => ({}));

    const userId = auth.user.id;
    const role: "creator" | "client" | null = auth.roles.includes("creator")
      ? "creator"
      : auth.roles.includes("client")
        ? "client"
        : null;

    // Service-role client is safe here only because every query below is
    // scoped to the authenticated userId (or to a property we verify the
    // caller owns). It is used for the aggregate insight tables that have no
    // per-row RLS of their own.
    const supabase = auth.adminSupabase;

    // For clients, only trust a propertyId they actually own. Creators have
    // global access. An unowned/absent property just omits property insights.
    let scopedPropertyId: string | null = null;
    if (propertyId) {
      if (role === "creator") {
        scopedPropertyId = propertyId;
      } else if (role === "client") {
        const { data: owned } = await supabase
          .from("properties")
          .select("id")
          .eq("id", propertyId)
          .eq("client_user_id", userId)
          .maybeSingle();
        if (owned) scopedPropertyId = propertyId;
      }
    }

    const context: Record<string, any> = {};

    if (role === "creator") {
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
        for (const o of (outcomes as any[])) {
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
      if (scopedPropertyId) {
        const { data: prop } = await supabase
          .from("properties")
          .select("metadata")
          .eq("id", scopedPropertyId)
          .single();

        const meta = (prop?.metadata ?? {}) as Record<string, unknown>;
        if (meta.year_built) {
          const decade = `${Math.floor(Number(meta.year_built) / 10) * 10}s`;
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

    if (role === "client") {
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
      if (scopedPropertyId) {
        const { data: prop } = await supabase
          .from("properties")
          .select("metadata")
          .eq("id", scopedPropertyId)
          .single();

        const meta = (prop?.metadata ?? {}) as Record<string, unknown>;
        if (meta.year_built) {
          const decade = `${Math.floor(Number(meta.year_built) / 10) * 10}s`;
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

    return json(context);
  } catch (err) {
    console.error("get-smart-context error:", err);
    return json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
});
