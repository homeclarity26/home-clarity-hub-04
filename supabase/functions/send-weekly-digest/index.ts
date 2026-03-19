import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Gather metrics
    const [propRes, invoiceRes, paymentRes, projectRes, reportRes, taskRes, msgRes, equipRes] = await Promise.all([
      supabase.from("properties").select("id, property_name, created_at").gte("created_at", oneWeekAgo),
      supabase.from("invoices").select("status, total, balance_due, created_at, due_date"),
      supabase.from("payments_posted").select("amount, payment_date").gte("payment_date", oneWeekAgo),
      supabase.from("projects").select("status, title, created_at").gte("created_at", oneWeekAgo),
      supabase.from("reports").select("status, updated_at").gte("updated_at", oneWeekAgo),
      supabase.from("tasks").select("status, title, created_at").gte("created_at", oneWeekAgo),
      supabase.from("property_messages").select("id, is_read, created_at").gte("created_at", oneWeekAgo),
      supabase.from("equipment").select("name, next_service_date").not("next_service_date", "is", null),
    ]);

    const newClients = (propRes.data || []).length;
    const collected = (paymentRes.data || []).reduce((s: number, p: any) => s + Number(p.amount), 0);
    const invoicesSent = (invoiceRes.data || []).filter((i: any) => new Date(i.created_at) >= new Date(oneWeekAgo)).length;
    const overdueInvoices = (invoiceRes.data || []).filter((i: any) => i.status === "overdue");
    const totalOverdue = overdueInvoices.reduce((s: number, i: any) => s + Number(i.balance_due || i.total), 0);
    const completedProjects = (projectRes.data || []).filter((p: any) => p.status === "complete").length;
    const publishedReports = (reportRes.data || []).filter((r: any) => r.status === "published").length;
    const completedTasks = (taskRes.data || []).filter((t: any) => t.status === "done").length;
    const unreadMessages = (msgRes.data || []).filter((m: any) => !m.is_read).length;

    // Maintenance due in next 30 days
    const in30 = new Date(Date.now() + 30 * 86400000).toISOString();
    const maintenanceDue = (equipRes.data || []).filter((e: any) => e.next_service_date && e.next_service_date <= in30).length;

    // Generate digest with AI
    const prompt = `Generate an HTML email digest for a home consulting business. Use inline CSS styles. The email should be professional, clean, and branded.

Include these sections:
1. A header with "Weekly Business Digest" and the date range
2. Key Metrics row (use a table with 4 columns): Revenue Collected ($${collected.toFixed(0)}), New Clients (${newClients}), Invoices Sent (${invoicesSent}), Tasks Done (${completedTasks})
3. Highlights section with bullet points for notable activity
4. Alerts section (red) if there are overdue items: ${overdueInvoices.length} overdue invoices ($${totalOverdue.toFixed(0)}), ${unreadMessages} unread messages, ${maintenanceDue} maintenance items due
5. A "Open Dashboard" call-to-action button

Use colors: primary #1a2744 (navy), accent #c9a96e (gold), text #2d3748, background #f7f5f0.
Keep the HTML simple and email-client compatible (tables, inline styles, no CSS classes).
Return ONLY the HTML string, no markdown code blocks.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an email template designer. Return only valid HTML for email clients. No markdown." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI error:", aiRes.status, t);
      throw new Error("AI generation failed");
    }

    const aiData = await aiRes.json();
    let emailHtml = aiData.choices?.[0]?.message?.content || "";
    
    // Strip markdown code blocks if present
    emailHtml = emailHtml.replace(/```html\n?/g, "").replace(/```\n?/g, "").trim();

    // Get admin email
    const { data: profiles } = await supabase
      .from("profiles")
      .select("email, full_name")
      .limit(1);

    const adminEmail = profiles?.[0]?.email;

    // For now, return the digest content (email sending would use Resend/Lovable email infra)
    return new Response(JSON.stringify({
      success: true,
      digest_html: emailHtml,
      admin_email: adminEmail,
      stats: {
        newClients,
        collected,
        invoicesSent,
        overdueCount: overdueInvoices.length,
        totalOverdue,
        completedProjects,
        publishedReports,
        completedTasks,
        unreadMessages,
        maintenanceDue,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-weekly-digest error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
