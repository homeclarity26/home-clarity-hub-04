import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireCron } from "../_shared/cron-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-cron-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Cron-only: service-role scan across all tenants. Gate before any work.
  const denied = requireCron(req);
  if (denied) return denied;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    // Get all invoices with outstanding balances and past due dates
    const { data: overdueInvoices } = await supabase
      .from("invoices")
      .select("id, property_id, invoice_number, balance_due, due_date, total, description")
      .gt("balance_due", 0)
      .lt("due_date", todayStr);

    if (!overdueInvoices || overdueInvoices.length === 0) {
      return new Response(JSON.stringify({ message: "No overdue invoices", processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const escalationRules = [
      { minDays: 1, maxDays: 6, level: "reminder", actionType: "payment_reminder" },
      { minDays: 7, maxDays: 13, level: "follow_up", actionType: "payment_follow_up" },
      { minDays: 14, maxDays: 29, level: "final_notice", actionType: "payment_final_notice" },
      { minDays: 30, maxDays: 999, level: "collections_risk", actionType: "payment_collections_risk" },
    ];

    let processed = 0;

    for (const inv of overdueInvoices) {
      const dueDate = new Date(inv.due_date);
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      const rule = escalationRules.find((r) => daysOverdue >= r.minDays && daysOverdue <= r.maxDays);
      if (!rule) continue;

      // Check if we already logged this escalation level for this invoice
      const { data: existing } = await supabase
        .from("activity_log")
        .select("id")
        .eq("property_id", inv.property_id)
        .eq("action_type", rule.actionType)
        .gte("created_at", new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (existing && existing.length > 0) continue;

      // Log the escalation
      await supabase.from("activity_log").insert({
        property_id: inv.property_id,
        action_type: rule.actionType,
        message: `Payment ${rule.level.replace("_", " ")}: ${inv.invoice_number || "Invoice"} — $${Number(inv.balance_due).toLocaleString()} is ${daysOverdue} days overdue`,
        metadata: {
          invoice_id: inv.id,
          invoice_number: inv.invoice_number,
          amount: inv.balance_due,
          days_overdue: daysOverdue,
          escalation_level: rule.level,
        },
      });

      // For collections risk, create an urgent task
      if (rule.level === "collections_risk") {
        // Get a creator user for the task
        const { data: creators } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "creator")
          .limit(1);

        if (creators && creators.length > 0) {
          await supabase.from("tasks").insert({
            admin_id: creators[0].user_id,
            client_id: inv.property_id,
            title: `Collections Risk: ${inv.invoice_number || "Invoice"} — $${Number(inv.balance_due).toLocaleString()}`,
            description: `Invoice ${inv.invoice_number} is ${daysOverdue} days overdue. Balance: $${Number(inv.balance_due).toLocaleString()}. Consider direct outreach.`,
            priority: "urgent",
            status: "open",
          });
        }
      }

      // Try to send notification email
      try {
        await supabase.functions.invoke("send-notification-email", {
          body: {
            type: "invoice_sent",
            property_id: inv.property_id,
            data: {
              description: `${rule.level === "reminder" ? "Friendly reminder" : rule.level === "follow_up" ? "Follow-up" : rule.level === "final_notice" ? "Final notice" : "Urgent"}: Invoice ${inv.invoice_number || ""} for $${Number(inv.balance_due).toLocaleString()} was due ${daysOverdue} days ago.`,
              amount: inv.balance_due,
              due_date: inv.due_date,
            },
          },
        });
      } catch {
        // Silent fail on email
      }

      processed++;
    }

    return new Response(JSON.stringify({ message: "Escalation check complete", processed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Escalation error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
