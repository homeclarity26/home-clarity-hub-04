import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireRole, corsHeaders, json } from "../_shared/auth.ts";

const DEFAULT_FROM = "Adam Kilgore <adam@hometownbuildersclub.com>";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireRole(req, ["creator"]);
  if ("error" in auth) return auth.error;

  try {
    const { to, subject, body, from } = await req.json();
    if (!to || !subject || !body) {
      return json(
        { error: "to, subject, and body are required" },
        { status: 400 },
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.warn("[send-email] RESEND_API_KEY not set — logging only");
      console.log(`[send-email] from=${from || DEFAULT_FROM} to=${to} subject="${subject}"`);
      return json({ success: true, sent: false, reason: "RESEND_API_KEY missing" });
    }

    const html = body
      .split(/\r?\n\r?\n/)
      .map((p: string) => `<p style="margin:0 0 12px;color:#1B2B4D;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.6;">${
        p.replace(/\r?\n/g, "<br>")
      }</p>`)
      .join("");

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: from || DEFAULT_FROM,
        to: Array.isArray(to) ? to : [to],
        subject,
        html: `<div style="background:#E8DCC4;padding:32px 0;"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;">${html}</div></div>`,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      console.error("[send-email] Resend error:", errText);
      return json({ error: "Failed to send email", details: errText }, { status: 502 });
    }

    const resendData = await resendRes.json();
    console.log(`[send-email] sent to=${to} id=${resendData.id}`);
    return json({ success: true, sent: true, emailId: resendData.id, recipient: to, subject });
  } catch (e) {
    console.error("[send-email] error:", e);
    return json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
});
