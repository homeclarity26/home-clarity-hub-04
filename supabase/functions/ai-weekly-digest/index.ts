import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [activityRes, invoiceRes, msgRes, taskRes, reportRes] = await Promise.all([
      supabase.from("activity_log").select("action_type, message, created_at, property_id, properties(property_name, address)").gte("created_at", oneWeekAgo).order("created_at", { ascending: false }).limit(50),
      supabase.from("invoices").select("status, amount, property_id, properties(property_name)").or(`created_at.gte.${oneWeekAgo},updated_at.gte.${oneWeekAgo}`),
      supabase.from("property_messages").select("property_id, is_read, created_at").gte("created_at", oneWeekAgo),
      supabase.from("tasks").select("status, priority, title").gte("created_at", oneWeekAgo),
      supabase.from("reports").select("status, property_id, properties(property_name)").gte("updated_at", oneWeekAgo),
    ]);

    const activities = activityRes.data || [];
    const invoices = invoiceRes.data || [];
    const messages = msgRes.data || [];
    const tasks = taskRes.data || [];
    const reports = reportRes.data || [];

    const overdueInvoices = invoices.filter((i: any) => i.status === "overdue");
    const paidInvoices = invoices.filter((i: any) => i.status === "paid");
    const totalPaid = paidInvoices.reduce((s: number, i: any) => s + Number(i.amount), 0);
    const totalOverdue = overdueInvoices.reduce((s: number, i: any) => s + Number(i.amount), 0);
    const unreadMessages = messages.filter((m: any) => !m.is_read).length;
    const completedTasks = tasks.filter((t: any) => t.status === "done").length;
    const publishedReports = reports.filter((r: any) => r.status === "published").length;

    const prompt = `Generate a concise weekly business digest for a home consultant. Use markdown with sections. Include:

1. **Week at a Glance** - Key metrics summary
2. **Revenue & Payments** - Money in, outstanding, overdue
3. **Client Activity** - Messages, portal engagement, new activity
4. **Report Progress** - Reports published/updated
5. **Tasks Completed** - What got done
6. **Action Items for Next Week** - Top 5 priorities
7. **Notable Trends** - Any patterns or concerns

Data:
- Activities this week: ${activities.length}
- Revenue collected: $${totalPaid.toFixed(0)}
- Overdue invoices: ${overdueInvoices.length} ($${totalOverdue.toFixed(0)})
- Unread messages: ${unreadMessages}
- Tasks completed: ${completedTasks}/${tasks.length}
- Reports published: ${publishedReports}
- Activity breakdown: ${JSON.stringify(activities.reduce((acc: Record<string, number>, a: any) => { acc[a.action_type] = (acc[a.action_type] || 0) + 1; return acc; }, {}))}
- Recent activity: ${activities.slice(0, 10).map((a: any) => `${a.action_type}: ${a.message}`).join("; ")}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a business intelligence assistant for a home consulting practice. Generate actionable, data-driven weekly digests with clear priorities." },
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
    const digest = data.choices?.[0]?.message?.content || "Failed to generate digest.";

    return new Response(JSON.stringify({
      digest,
      stats: { totalPaid, totalOverdue, unreadMessages, completedTasks, totalTasks: tasks.length, publishedReports, totalActivities: activities.length },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-weekly-digest error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
