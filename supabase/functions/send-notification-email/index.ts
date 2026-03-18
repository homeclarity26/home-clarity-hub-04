import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BRAND = {
  navy: "#1B2B4D",
  gold: "#C5A55A",
  rust: "#B7410E",
  cream: "#E8DCC4",
  white: "#ffffff",
};

function emailWrapper(content: string, propertyAddress?: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:${BRAND.cream};font-family:'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.cream};">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="background-color:${BRAND.navy};padding:24px 40px;border-radius:12px 12px 0 0;text-align:center;">
  <h1 style="margin:0;color:${BRAND.white};font-size:20px;font-weight:700;">Home Clarity Hub</h1>
  ${propertyAddress ? `<p style="margin:6px 0 0;color:${BRAND.gold};font-size:11px;text-transform:uppercase;letter-spacing:2px;">${propertyAddress}</p>` : ""}
</td></tr>
<tr><td style="background-color:${BRAND.white};padding:32px 40px;">
  ${content}
</td></tr>
<tr><td style="background-color:${BRAND.navy};padding:20px 40px;border-radius:0 0 12px 12px;text-align:center;">
  <p style="margin:0;color:rgba(255,255,255,0.4);font-size:11px;">Home Clarity Hub · Hometown Builders Club</p>
</td></tr>
</table></td></tr></table>
</body></html>`;
}

function ctaButton(text: string, url: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:16px 0;">
    <a href="${url}" style="display:inline-block;padding:12px 32px;background-color:${BRAND.rust};color:${BRAND.white};text-decoration:none;font-size:14px;font-weight:600;border-radius:6px;">${text}</a>
  </td></tr></table>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, property_id, data } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get property and client info
    const { data: prop } = await supabase.from("properties").select("*, profiles!properties_client_user_id_fkey(email, full_name)").eq("id", property_id).single();
    if (!prop) throw new Error("Property not found");

    const clientEmail = (prop as any).profiles?.email;
    const clientName = (prop as any).profiles?.full_name || "Homeowner";
    const portalUrl = `${supabaseUrl.replace('.supabase.co', '')}/portal/${property_id}`;

    let subject = "";
    let body = "";

    switch (type) {
      case "report_published":
        subject = "Your Home Clarity Report is Ready";
        body = `<h2 style="margin:0 0 16px;color:${BRAND.navy};font-size:20px;">Your Report is Ready, ${clientName}!</h2>
          <p style="color:#4a5568;font-size:14px;line-height:1.7;">Your Home Clarity Report has been published and is ready for you to review in your portal.</p>
          ${ctaButton("View Your Report", portalUrl + "?tab=report")}`;
        break;

      case "invoice_sent":
        subject = "You Have a New Invoice from Home Clarity Hub";
        body = `<h2 style="margin:0 0 16px;color:${BRAND.navy};font-size:20px;">New Invoice</h2>
          <p style="color:#4a5568;font-size:14px;line-height:1.7;">${data?.description || "A new invoice"} has been sent to you.</p>
          ${data?.amount ? `<p style="font-size:24px;font-weight:700;color:${BRAND.navy};margin:16px 0;">$${Number(data.amount).toLocaleString()}</p>` : ""}
          ${data?.due_date ? `<p style="color:#4a5568;font-size:14px;">Due: ${data.due_date}</p>` : ""}
          ${ctaButton("View Invoice", portalUrl + "?tab=payments")}`;
        break;

      case "new_message":
        subject = "New Message from Your HBC Advisor";
        body = `<h2 style="margin:0 0 16px;color:${BRAND.navy};font-size:20px;">New Message</h2>
          <p style="color:#4a5568;font-size:14px;line-height:1.7;">You have a new message from your advisor:</p>
          <div style="background:#f7f5f0;border-radius:8px;padding:16px;margin:16px 0;">
            <p style="color:#4a5568;font-size:14px;font-style:italic;">"${(data?.preview || "").slice(0, 200)}${(data?.preview || "").length > 200 ? "..." : ""}"</p>
          </div>
          ${ctaButton("Reply in Portal", portalUrl + "?tab=messages")}`;
        break;

      case "payment_received":
        subject = "Payment Received — Thank You";
        body = `<h2 style="margin:0 0 16px;color:${BRAND.navy};font-size:20px;">Payment Confirmed</h2>
          <p style="color:#4a5568;font-size:14px;line-height:1.7;">We've received your payment. Thank you!</p>
          ${data?.amount ? `<p style="font-size:24px;font-weight:700;color:green;margin:16px 0;">$${Number(data.amount).toLocaleString()}</p>` : ""}
          ${ctaButton("View Account", portalUrl + "?tab=payments")}`;
        break;

      case "project_update":
        subject = `Project Update: ${data?.title || "Your Project"}`;
        body = `<h2 style="margin:0 0 16px;color:${BRAND.navy};font-size:20px;">Project Update</h2>
          <p style="color:#4a5568;font-size:14px;line-height:1.7;">${data?.title || "Your project"} has been updated to: <strong>${data?.status || "Updated"}</strong></p>
          ${data?.notes ? `<p style="color:#4a5568;font-size:14px;margin-top:12px;">${data.notes}</p>` : ""}
          ${ctaButton("View Projects", portalUrl + "?tab=projects")}`;
        break;

      case "maintenance_reminder": {
        const items = data?.items || [];
        const overdueCount = data?.overdue_count || 0;
        const dueSoonCount = data?.due_soon_count || 0;
        const upcomingCount = data?.upcoming_count || 0;

        subject = overdueCount > 0
          ? `⚠️ ${overdueCount} Overdue Maintenance Item${overdueCount > 1 ? "s" : ""} — Action Required`
          : `🔧 Upcoming Maintenance Reminder (${dueSoonCount + upcomingCount} items)`;

        const urgencyBadge = (urgency: string) => {
          const colors: Record<string, string> = { overdue: "#dc2626", due_soon: "#f59e0b", upcoming: "#3b82f6" };
          const labels: Record<string, string> = { overdue: "OVERDUE", due_soon: "DUE SOON", upcoming: "UPCOMING" };
          return `<span style="display:inline-block;padding:2px 8px;border-radius:4px;background:${colors[urgency] || "#6b7280"};color:#fff;font-size:10px;font-weight:700;letter-spacing:0.5px;">${labels[urgency] || urgency}</span>`;
        };

        const itemRows = items.map((item: any) => {
          const daysText = item.days_until <= 0
            ? `${Math.abs(item.days_until)} day${Math.abs(item.days_until) !== 1 ? "s" : ""} overdue`
            : `in ${item.days_until} day${item.days_until !== 1 ? "s" : ""}`;
          return `<tr>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;">
              <strong style="color:${BRAND.navy};font-size:14px;">${item.name}</strong>
              ${item.brand ? `<br><span style="color:#6b7280;font-size:12px;">${item.brand}${item.model ? ` ${item.model}` : ""}</span>` : ""}
            </td>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center;">
              ${urgencyBadge(item.urgency)}
            </td>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;color:#4a5568;font-size:13px;">
              ${daysText}
            </td>
          </tr>`;
        }).join("");

        body = `<h2 style="margin:0 0 8px;color:${BRAND.navy};font-size:20px;">Maintenance Reminder</h2>
          <p style="color:#4a5568;font-size:14px;line-height:1.7;margin:0 0 20px;">
            Hi ${clientName}, here's an update on your home's upcoming maintenance needs:
          </p>

          ${overdueCount > 0 ? `<div style="background:#fef2f2;border-left:4px solid #dc2626;padding:12px 16px;border-radius:4px;margin-bottom:16px;">
            <p style="margin:0;color:#991b1b;font-size:14px;font-weight:600;">⚠️ ${overdueCount} item${overdueCount > 1 ? "s" : ""} overdue — please schedule service soon</p>
          </div>` : ""}

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
            <tr style="background:#f9fafb;">
              <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;">Equipment</th>
              <th style="padding:10px 12px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;">Status</th>
              <th style="padding:10px 12px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;">Due</th>
            </tr>
            ${itemRows}
          </table>

          ${ctaButton("View Equipment in Portal", portalUrl + "?tab=equipment")}
          <p style="color:#6b7280;font-size:12px;text-align:center;margin-top:8px;">
            Need help scheduling service? Reply to this email or contact your HBC advisor.
          </p>`;
        break;
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown notification type" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const html = emailWrapper(body, prop.address);

    // Log the notification (we can't actually send email without email infra, but we log intent)
    console.log(`[Notification] type=${type} to=${clientEmail} subject="${subject}"`);

    return new Response(JSON.stringify({ success: true, type, recipient: clientEmail, subject }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Notification error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
