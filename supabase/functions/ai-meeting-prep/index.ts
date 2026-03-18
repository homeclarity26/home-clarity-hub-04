import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { propertyId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Gather all client data
    const [propRes, reportRes, invoiceRes, msgRes, equipRes, projectRes, eventRes] = await Promise.all([
      supabase.from("properties").select("*, profiles!properties_client_user_id_fkey(full_name, email, phone)").eq("id", propertyId).single(),
      supabase.from("reports").select("*, report_pages(title, condition_rating, status, narrative, tiers, key_observations, risks)").eq("property_id", propertyId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("invoices").select("*").eq("property_id", propertyId),
      supabase.from("property_messages").select("message, created_at, sender_id").eq("property_id", propertyId).order("created_at", { ascending: false }).limit(10),
      supabase.from("equipment").select("name, category, condition, next_service_date, warranty_expiry").eq("property_id", propertyId),
      supabase.from("projects").select("title, status, estimated_cost").eq("property_id", propertyId),
      supabase.from("schedule_events").select("title, event_date, event_type, status").eq("property_id", propertyId).gte("event_date", new Date().toISOString()).order("event_date").limit(5),
    ]);

    const property = propRes.data;
    const report = reportRes.data;
    const invoices = invoiceRes.data || [];
    const messages = msgRes.data || [];
    const equipment = equipRes.data || [];
    const projects = projectRes.data || [];
    const upcomingEvents = eventRes.data || [];

    const overdueInvoices = invoices.filter((i: any) => i.status === "overdue" || (i.status === "pending" && i.due_date && new Date(i.due_date) < new Date()));
    const pendingInvoices = invoices.filter((i: any) => i.status === "pending");
    const totalOutstanding = [...overdueInvoices, ...pendingInvoices].reduce((s: number, i: any) => s + Number(i.amount), 0);

    const poorEquipment = equipment.filter((e: any) => e.condition === "poor" || e.condition === "critical");
    const activeProjects = projects.filter((p: any) => p.status === "in_progress" || p.status === "planned");

    const reportPages = report?.report_pages || [];
    const criticalPages = reportPages.filter((p: any) => p.condition_rating === "poor" || p.condition_rating === "critical");

    const prompt = `Generate a concise client meeting preparation brief. Include:
1. Client Overview (name, property, key details)
2. Current Status (report progress, outstanding items)
3. Financial Summary (outstanding invoices, overdue amounts)
4. Key Concerns (critical conditions, equipment issues)
5. Active Projects status
6. Upcoming Events
7. Recent Messages summary
8. Suggested Talking Points (3-5 actionable items)
9. Recommended Next Steps

Property: ${property?.property_name || property?.address}
Address: ${property?.address}
Year Built: ${property?.metadata?.year_built || "Unknown"}
Sqft: ${property?.metadata?.sqft || "Unknown"}
Type: ${property?.property_type || "Unknown"}

Report Status: ${report?.status || "No report"}
Report Pages: ${reportPages.length} total, ${reportPages.filter((p: any) => p.status === "complete" || p.status === "published").length} complete
Critical Conditions: ${criticalPages.map((p: any) => p.title).join(", ") || "None"}

Financials: ${overdueInvoices.length} overdue ($${overdueInvoices.reduce((s: number, i: any) => s + Number(i.amount), 0).toFixed(0)}), ${pendingInvoices.length} pending, Total outstanding: $${totalOutstanding.toFixed(0)}

Equipment Issues: ${poorEquipment.map((e: any) => `${e.name} (${e.condition})`).join(", ") || "None"}

Active Projects: ${activeProjects.map((p: any) => `${p.title} (${p.status}, est. $${p.estimated_cost || 0})`).join("; ") || "None"}

Upcoming Events: ${upcomingEvents.map((e: any) => `${e.title} on ${e.event_date}`).join("; ") || "None"}

Recent Messages (last 10): ${messages.map((m: any) => m.message.substring(0, 100)).join(" | ") || "None"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a professional home consultant's AI assistant. Generate structured, actionable meeting prep briefs. Use markdown formatting." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const brief = data.choices?.[0]?.message?.content || "Failed to generate brief.";

    return new Response(JSON.stringify({ brief }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-meeting-prep error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
