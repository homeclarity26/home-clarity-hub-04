import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAI, parseJSON } from "../_shared/ai-client.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireRole } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  
  const auth = await requireRole(req, ["creator"]);
  if ("error" in auth) return auth.error;
try {
    const { client_id } = await req.json();
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

    const _gapText = await callAI({
      system: "You are a home documentation expert. Analyze this home's digital twin record and identify critical missing information. Consider the home's age, type, location, and what records should exist for a complete property record.",
      prompt: `Home digital twin status:\n${JSON.stringify(context, null, 2)}\n\nIdentify what critical information is missing.\n\nReturn JSON: { "gaps": [{ "title": string, "description": string, "why_it_matters": string, "how_to_obtain": string, "difficulty": "easy"|"medium"|"hard", "category": string, "can_upload": boolean }], "completeness_score": number, "completeness_breakdown": { "equipment": number, "warranties": number, "permits": number, "service_history": number, "documents": number, "knowledge_base": number } }`,
      model: "google/gemini-2.5-flash",
      json: true,
    });
    const result = parseJSON<{ gaps: any[]; completeness_score: number; completeness_breakdown: Record<string, number> }>(_gapText);

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("analyze-knowledge-gaps error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
