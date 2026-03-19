import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { client_id, transcript, current_page } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

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

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an intelligent home portal voice assistant for Hometown Builders Club. The client is speaking to navigate their home portal, ask questions about their home, or take actions.

Available navigation tabs: ${context.available_tabs.join(", ")}
Report sections: ${reportPages.map(p => `${p.title} (${p.page_key})`).join(", ")}

Client's current page: ${current_page}

Home context:
${JSON.stringify(context, null, 2)}

Classify the voice command and respond appropriately. Be concise and helpful.`,
          },
          { role: "user", content: `Voice command: "${transcript}"` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "handle_voice_command",
            description: "Process a voice command from the client portal",
            parameters: {
              type: "object",
              properties: {
                type: { type: "string", enum: ["navigate", "answer", "action"] },
                destination: { type: "string", description: "Tab name for navigation commands" },
                sub_destination: { type: "string", description: "Section or page within the tab" },
                answer_text: { type: "string", description: "Answer text for query commands" },
                answer_source: { type: "string", description: "Where the answer data came from" },
                action_type: { type: "string", description: "Type of action to perform" },
                prefill_data: { type: "object", description: "Data to prefill for actions" },
                spoken_response: { type: "string", description: "Natural language confirmation to speak back to the client. Keep it brief and conversational." },
              },
              required: ["type", "spoken_response"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "handle_voice_command" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Credits required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const t = await aiResp.text();
      console.error("AI error:", aiResp.status, t);
      throw new Error("AI processing failed");
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No response from AI");

    const result = JSON.parse(toolCall.function.arguments);

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
