// NO AUTH: cron job. This function is meant to be hit by Supabase
// scheduled jobs and by the admin "Send Reminders Now" button. It
// sweeps schedule_events for upcoming items, emails each affected
// client, and flips reminder_sent=true so the same event isn't
// emailed twice.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ScheduleEvent {
  id: string;
  property_id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_type: string;
}

interface PropertyRow {
  id: string;
  address: string | null;
  client_user_id: string | null;
}

interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildEmailBody(clientName: string, items: ScheduleEvent[]): { subject: string; html: string; text: string } {
  const greeting = clientName ? `Hi ${clientName},` : "Hi,";
  const lines = items.map((it) => {
    const when = new Date(it.event_date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    return `- ${it.title} (${when})`;
  });
  const text = `${greeting}\n\nA quick heads up on what's on your home schedule in the next 7 days:\n\n${lines.join("\n")}\n\nReply if you'd like us to handle scheduling for any of these.\n\nAdam`;
  const htmlList = items.map((it) => {
    const when = new Date(it.event_date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    return `<li style="margin:4px 0;color:#1B2B4D;font-size:14px;line-height:1.6;">${it.title} <span style="color:#6b7280;">(${when})</span></li>`;
  }).join("");
  const html = `<div style="background:#E8DCC4;padding:32px 0;font-family:'Helvetica Neue',Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;">
      <p style="margin:0 0 12px;color:#1B2B4D;font-size:14px;line-height:1.6;">${greeting}</p>
      <p style="margin:0 0 12px;color:#1B2B4D;font-size:14px;line-height:1.6;">A quick heads up on what's on your home schedule in the next 7 days:</p>
      <ul style="padding-left:20px;margin:0 0 16px;">${htmlList}</ul>
      <p style="margin:0 0 12px;color:#1B2B4D;font-size:14px;line-height:1.6;">Reply if you'd like us to handle scheduling for any of these.</p>
      <p style="margin:0;color:#1B2B4D;font-size:14px;line-height:1.6;">Adam</p>
    </div>
  </div>`;
  const subject = items.length === 1
    ? `Upcoming maintenance: ${items[0].title}`
    : `Upcoming maintenance: ${items.length} items in the next 7 days`;
  return { subject, html, text };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!supabaseUrl || !serviceKey) {
      return jsonResponse({ error: "Missing Supabase env" }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const now = new Date();
    const cutoff = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const { data: events, error: eventsErr } = await supabase
      .from("schedule_events")
      .select("id, property_id, title, description, event_date, event_type")
      .gte("event_date", now.toISOString())
      .lte("event_date", cutoff.toISOString())
      .neq("reminder_sent", true)
      .order("event_date", { ascending: true });

    if (eventsErr) {
      console.error("[send-maintenance-reminders] events query failed", eventsErr);
      return jsonResponse({ error: eventsErr.message }, 500);
    }

    const eventList = (events ?? []) as ScheduleEvent[];
    if (eventList.length === 0) {
      return jsonResponse({ success: true, sent: 0, processed: 0, reason: "No upcoming events within 7 days." });
    }

    const propertyIds = Array.from(new Set(eventList.map((e) => e.property_id)));
    const { data: props } = await supabase
      .from("properties")
      .select("id, address, client_user_id")
      .in("id", propertyIds);
    const propertyMap = new Map<string, PropertyRow>();
    for (const p of (props ?? []) as PropertyRow[]) propertyMap.set(p.id, p);

    const clientUserIds = Array.from(
      new Set(((props ?? []) as PropertyRow[]).map((p) => p.client_user_id).filter((v): v is string => !!v)),
    );
    const profileMap = new Map<string, ProfileRow>();
    if (clientUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", clientUserIds);
      for (const pr of (profiles ?? []) as ProfileRow[]) profileMap.set(pr.id, pr);
    }

    const groups = new Map<string, ScheduleEvent[]>();
    for (const ev of eventList) {
      const list = groups.get(ev.property_id) ?? [];
      list.push(ev);
      groups.set(ev.property_id, list);
    }

    let sent = 0;
    let skipped = 0;
    const successfulIds: string[] = [];

    for (const [propertyId, items] of groups) {
      const prop = propertyMap.get(propertyId);
      const profile = prop?.client_user_id ? profileMap.get(prop.client_user_id) : undefined;
      const email = profile?.email;
      if (!email) {
        console.warn(`[send-maintenance-reminders] skipping property ${propertyId} — no client email`);
        skipped += items.length;
        continue;
      }

      const { subject, html, text } = buildEmailBody(profile?.full_name ?? "", items);

      if (!resendApiKey) {
        console.log(`[send-maintenance-reminders] RESEND_API_KEY missing — would send to ${email}: ${subject}`);
        successfulIds.push(...items.map((i) => i.id));
        sent += items.length;
        continue;
      }

      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Adam Kilgore <adam@hometownbuildersclub.com>",
          to: [email],
          subject,
          html,
          text,
        }),
      });

      if (!resendRes.ok) {
        const errText = await resendRes.text();
        console.error(`[send-maintenance-reminders] Resend failure for ${email}:`, errText);
        skipped += items.length;
        continue;
      }

      successfulIds.push(...items.map((i) => i.id));
      sent += items.length;
    }

    if (successfulIds.length > 0) {
      const { error: updErr } = await supabase
        .from("schedule_events")
        .update({ reminder_sent: true })
        .in("id", successfulIds);
      if (updErr) console.error("[send-maintenance-reminders] reminder_sent update failed", updErr);
    }

    return jsonResponse({
      success: true,
      processed: eventList.length,
      sent,
      skipped,
      properties: groups.size,
    });
  } catch (e) {
    console.error("[send-maintenance-reminders] error", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
