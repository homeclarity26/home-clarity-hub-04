import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAI, parseJSON } from "../_shared/ai-client.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { client_id } = await req.json();
    if (!client_id) throw new Error("client_id required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    // Load all home data
    const [
      { data: properties },
      { data: equipment },
      { data: reports },
      { data: outcomes },
    ] = await Promise.all([
      sb.from("properties").select("*").eq("client_user_id", client_id),
      sb.from("equipment").select("*").in("property_id",
        (await sb.from("properties").select("id").eq("client_user_id", client_id)).data?.map((p: any) => p.id) || []
      ),
      sb.from("reports").select("*, report_pages(*)").in("property_id",
        (await sb.from("properties").select("id").eq("client_user_id", client_id)).data?.map((p: any) => p.id) || []
      ),
      sb.from("maintenance_outcomes").select("*").eq("client_id", client_id).order("actual_service_date", { ascending: false }).limit(50),
    ]);

    const property = properties?.[0];
    if (!property) throw new Error("No property found for this client");

    const reportPages = reports?.[0]?.report_pages || [];
    const metadata = property.metadata as any || {};

    const homeContext = {
      property: {
        address: property.address,
        city: property.city,
        state: property.state,
        year_built: metadata.year_built,
        sqft: metadata.sqft,
        property_type: property.property_type,
      },
      equipment: (equipment || []).map((e: any) => ({
        id: e.id,
        name: e.name,
        category: e.category,
        brand: e.brand,
        model: e.model,
        condition: e.condition,
        install_date: e.install_date,
        last_service_date: e.last_service_date,
        next_service_date: e.next_service_date,
        warranty_expiry: e.warranty_expiry,
        estimated_replacement_cost: e.estimated_replacement_cost,
        notes: e.notes,
      })),
      report_sections: reportPages.map((p: any) => ({
        title: p.title,
        condition_rating: p.condition_rating,
        key_observations: p.key_observations,
        risks: p.risks,
        maintenance_notes: p.maintenance_notes,
      })),
      past_outcomes: (outcomes || []).slice(0, 20),
    };

    const systemPrompt = `You are a master home systems engineer with 30 years of experience in residential property maintenance, mechanical systems, and building science. You analyze homes and predict future maintenance needs with high accuracy.

Analyze the complete home data provided and generate maintenance predictions for each major system and component. Consider:
- Equipment age vs expected lifespan for that category
- Current condition rating and degradation trends
- Manufacturer recommended service intervals
- Climate and weather factors based on the city/state location
- Known failure patterns for specific equipment types, brands, and ages
- Deferred maintenance items identified in the report
- Past maintenance outcomes to calibrate accuracy

For each prediction, provide:
- system_type: the home system (e.g., "HVAC", "Roof", "Plumbing", "Electrical", "Kitchen Appliances")
- prediction_type: "service", "replacement", or "inspection"
- probability_score: 0-100 (how likely this will be needed)
- predicted_timeframe: "immediate", "3_months", "6_months", "1_year", "2_years", "3_years", or "5_years"
- confidence_level: "low", "medium", or "high"
- reasoning: array of { factor: string, detail: string, impact: "high"|"medium"|"low" }
- estimated_cost_low: number
- estimated_cost_high: number
- equipment_id: the equipment UUID if directly related, or null
- factors: array of { factor_name: string, factor_value: string, weight: number (0-1), description: string }

Generate predictions ONLY for items that have meaningful data. Aim for 5-15 predictions per home.`;

    const _aiText = await callAI({ messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this home and generate maintenance predictions:\n\n${JSON.stringify(homeContext, null, 2)}` },
        ], model: "google/gemini-2.5-flash" });
    const response = { ok: true, json: async () => ({ choices: [{ message: { content: _aiText } }] }) };

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const { predictions } = JSON.parse(toolCall.function.arguments);

    // Delete old predictions (>30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    await sb.from("maintenance_predictions")
      .delete()
      .eq("client_id", client_id)
      .lt("generated_at", thirtyDaysAgo);

    // Also delete current active predictions to replace with fresh ones
    await sb.from("maintenance_predictions")
      .delete()
      .eq("client_id", client_id)
      .eq("status", "active");

    // Insert new predictions
    const insertedPredictions = [];
    for (const pred of predictions) {
      const { factors, ...predData } = pred;
      const { data: inserted, error: insertErr } = await sb
        .from("maintenance_predictions")
        .insert({
          client_id,
          system_type: predData.system_type,
          prediction_type: predData.prediction_type,
          probability_score: predData.probability_score,
          predicted_timeframe: predData.predicted_timeframe,
          confidence_level: predData.confidence_level,
          reasoning: predData.reasoning,
          estimated_cost_low: predData.estimated_cost_low,
          estimated_cost_high: predData.estimated_cost_high,
          equipment_id: predData.equipment_id || null,
          status: "active",
        })
        .select()
        .single();

      if (insertErr) {
        console.error("Insert prediction error:", insertErr);
        continue;
      }

      // Insert factors
      if (inserted && factors?.length) {
        await sb.from("prediction_factors").insert(
          factors.map((f: any) => ({
            prediction_id: inserted.id,
            factor_name: f.factor_name,
            factor_value: f.factor_value,
            weight: f.weight,
            description: f.description,
          }))
        );
      }

      insertedPredictions.push(inserted);
    }

    // Check for high-priority predictions needing notification
    const urgent = insertedPredictions.filter(
      (p: any) => p.probability_score >= 75 && ["immediate", "3_months", "6_months"].includes(p.predicted_timeframe)
    );

    if (urgent.length > 0) {
      // Log activity for admin
      for (const u of urgent) {
        await sb.from("activity_log").insert({
          user_id: client_id,
          property_id: property.id,
          action_type: "prediction_alert",
          message: `High-priority prediction: ${u.system_type} ${u.prediction_type} likely needed within ${u.predicted_timeframe.replace("_", " ")}`,
          metadata: { prediction_id: u.id, probability: u.probability_score },
        });
      }
    }

    return new Response(JSON.stringify({ predictions: insertedPredictions, count: insertedPredictions.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-predictions error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
