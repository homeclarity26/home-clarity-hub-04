import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAI, parseJSON } from "../_shared/ai-client.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { client_id, transcript, current_page } = await req.json();
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Load context snapshot
    const [propRes, equipRes, projRes, invRes, kbRes, warRes] = await Promise.all([
      supabase.from("properties").select("property_name, address, metadata").eq("id", client_id).single(),
      supabase.from("equipment").select("name, category, condition, brand, model, next_service_date, warranty_expiry").eq("property_id", client_id).limit(30),
      supabase.from("projects").select("title, status, priority, estimated_cost").eq("property_id", client_id).limit(20),
      supabase.from("invoices").select("description, amount, status, due_date").eq("property_id", client_id).limit(20),
      supabase.from("home_knowledge_base").select("subject, content, knowledge_type").eq("client_id", client_id).eq("is_current", true).limit(30),
      supabase.from("warranty_registry").select("item_name, expiration_date, manufacturer").eq("client_id", client_id).limit(20),
    ]);

    // Get report pages for navigation context
    const reportRes = await supabase.from("reports").select("id").eq("property_id", client_id).limit(1).single();
    let reportPages: any[] = [];
    if (reportRes.data?.id) {
      const { data } = await supabase.from("report_pages").select("page_key, title, condition_rating, group_name")
        .eq("report_id", reportRes.data.id).order("sort_order");
      reportPages = data || [];
    }

    const context = {
      property: propRes.data,
      current_page,
      available_tabs: ["home", "report", "projects", "payments", "estimates", "services", "equipment", "documents", "messages", "contacts", "schedule"],
      equipment: (equipRes.data || []).slice(0, 15),
      projects: (projRes.data || []).slice(0, 10),
      invoices: (invRes.data || []).slice(0, 10),
      knowledge_facts: (kbRes.data || []).slice(0, 15),
      warranties: (warRes.data || []).slice(0, 10),
      report_pages: reportPages.slice(0, 20),
    };

    // Previously had a duplicate `const aiJson` declaration + a dead
    // tool-call parse that made this module fail to compile (Supabase
    // reported BOOT_ERROR on every invocation, so the voice command
    // feature was completely dead). callAI returns plain text JSON; parse
    // it directly.
    const _vcText = await callAI({
      system: `You are an intelligent home portal voice assistant for Hometown Builders Club. The client is speaking to navigate their home portal, ask questions about their home, or take actions.

Available navigation tabs: ${context.available_tabs.join(", ")}
Current page: ${current_page}

Home Context Summary:
${JSON.stringify(context, null, 2)}

Parse the user's voice command and return JSON: {
  "intent": "navigate"|"answer_question"|"take_action"|"clarify",
  "navigate_to": string|null,
  "report_page_key": string|null,
  "answer": string|null,
  "action": { "type": string, "params": object }|null,
  "clarification_needed": string|null,
  "confidence": number
}`,
      prompt: transcript,
      model: "google/gemini-2.5-flash",
      json: true,
    });
    const result = parseJSON<any>(_vcText);

    // Log interaction
    await supabase.from("voice_interactions").insert({
      client_id,
      transcript,
      command_type: result.type,
      response_text: result.spoken_response,
      destination: result.destination || null,
      was_successful: true,
    });

    // Log to activity feed for admin visibility
    await supabase.from("activity_log").insert({
      property_id: client_id,
      action_type: "voice_command",
      message: `Client used voice search: "${transcript}"`,
      metadata: { command_type: result.type, destination: result.destination },
    });

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("voice-command error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
