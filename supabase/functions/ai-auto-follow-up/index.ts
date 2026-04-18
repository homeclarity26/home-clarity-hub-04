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
    const { propertyId } = await req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const [propRes, invoiceRes, msgRes, projectRes, eventRes, sessionRes] = await Promise.all([
      supabase.from("properties").select("property_name, address").eq("id", propertyId).single(),
      supabase.from("invoices").select("status, amount, due_date, description").eq("property_id", propertyId),
      supabase.from("property_messages").select("message, created_at, sender_id, is_read").eq("property_id", propertyId).order("created_at", { ascending: false }).limit(20),
      supabase.from("projects").select("title, status").eq("property_id", propertyId),
      supabase.from("schedule_events").select("title, event_date, status").eq("property_id", propertyId).order("event_date", { ascending: false }).limit(5),
      supabase.from("client_sessions").select("last_active_at").eq("client_id", propertyId).order("last_active_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    const property = propRes.data;
    const invoices = invoiceRes.data || [];
    const messages = msgRes.data || [];
    const projects = projectRes.data || [];
    const events = eventRes.data || [];
    const lastSession = sessionRes.data;

    const lastMessageDate = messages[0]?.created_at || "Never";
    const daysSinceContact = messages[0] ? Math.floor((Date.now() - new Date(messages[0].created_at).getTime()) / 86400000) : 999;
    const unansweredMessages = messages.filter((m: any) => !m.is_read).length;
    const overdueInvoices = invoices.filter((i: any) => i.status === "overdue");
    const staleProjects = projects.filter((p: any) => p.status === "planned" || p.status === "in_progress");

    const prompt = `Analyze this client's engagement and suggest specific follow-up actions with urgency levels.

Client: ${property?.property_name || property?.address}
Days since last contact: ${daysSinceContact}
Unanswered messages: ${unansweredMessages}
Last portal activity: ${lastSession?.last_active_at || "Unknown"}
Overdue invoices: ${overdueInvoices.length} ($${overdueInvoices.reduce((s: number, i: any) => s + Number(i.amount), 0).toFixed(0)})
Active projects: ${staleProjects.map((p: any) => `${p.title} (${p.status})`).join(", ") || "None"}
Recent events: ${events.map((e: any) => `${e.title} (${e.event_date})`).join(", ") || "None"}
Recent messages preview: ${messages.slice(0, 5).map((m: any) => m.message.substring(0, 80)).join(" | ")}

Suggest 3-5 follow-up actions with timing and draft messages.`;

    const _aiText = await callAI({ system: "You are a client relationship management AI for a home consulting business.", messages: [
          { role: "system", content: "You are a client relationship management AI for a home consulting business." },
          { role: "user", content: prompt },
        ], model: "google/gemini-3-flash-preview" });
    const response = { ok: true, json: async () => ({ choices: [{ message: { content: _aiText } }] }) };

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let result = null;
    if (toolCall?.function?.arguments) {
      result = JSON.parse(toolCall.function.arguments);
    }

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-auto-follow-up error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
