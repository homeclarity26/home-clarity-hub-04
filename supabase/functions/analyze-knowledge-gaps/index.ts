import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { client_id } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const [propRes, equipRes, warrantyRes, permitRes, serviceRes, kbRes, specRes, timelineRes] = await Promise.all([
      supabase.from("properties").select("*").eq("id", client_id).single(),
      supabase.from("equipment").select("name, category, brand, model, install_date, warranty_expiry, condition").eq("property_id", client_id),
      supabase.from("warranty_registry").select("item_name, warranty_type, expiration_date").eq("client_id", client_id),
      supabase.from("permit_registry").select("permit_type, description, status").eq("client_id", client_id),
      supabase.from("service_history").select("service_type, service_date, description").eq("client_id", client_id),
      supabase.from("home_knowledge_base").select("knowledge_type, subject").eq("client_id", client_id).eq("is_current", true),
      supabase.from("structural_specifications").select("spec_category, specification_name").eq("client_id", client_id),
      supabase.from("property_timeline").select("event_type, title, event_date").eq("client_id", client_id),
    ]);

    const context = {
      property: propRes.data,
      equipment_count: (equipRes.data || []).length,
      equipment_categories: [...new Set((equipRes.data || []).map(e => e.category))],
      warranties_count: (warrantyRes.data || []).length,
      permits_count: (permitRes.data || []).length,
      service_records_count: (serviceRes.data || []).length,
      knowledge_facts_count: (kbRes.data || []).length,
      structural_specs_count: (specRes.data || []).length,
      timeline_events_count: (timelineRes.data || []).length,
      equipment_details: equipRes.data || [],
      permit_types: (permitRes.data || []).map(p => p.permit_type),
      spec_categories: [...new Set((specRes.data || []).map(s => s.spec_category))],
    };

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a home documentation expert. Analyze this home's digital twin record and identify critical missing information. Consider the home's age, type, location, and what records should exist for a complete property record.`,
          },
          { role: "user", content: `Home digital twin status:\n${JSON.stringify(context, null, 2)}\n\nIdentify what critical information is missing.` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "report_gaps",
            description: "Report knowledge gaps in the home's digital twin",
            parameters: {
              type: "object",
              properties: {
                gaps: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      why_it_matters: { type: "string" },
                      how_to_obtain: { type: "string" },
                      difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                      category: { type: "string" },
                      can_upload: { type: "boolean" },
                    },
                    required: ["title", "description", "why_it_matters", "how_to_obtain", "difficulty", "category", "can_upload"],
                  },
                },
                completeness_score: { type: "number" },
                completeness_breakdown: {
                  type: "object",
                  properties: {
                    equipment: { type: "number" },
                    warranties: { type: "number" },
                    permits: { type: "number" },
                    service_history: { type: "number" },
                    documents: { type: "number" },
                    knowledge_base: { type: "number" },
                  },
                },
              },
              required: ["gaps", "completeness_score", "completeness_breakdown"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "report_gaps" } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    const result = toolCall ? JSON.parse(toolCall.function.arguments) : { gaps: [], completeness_score: 0, completeness_breakdown: {} };

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("analyze-knowledge-gaps error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
