/**
 * send-notification-verification
 * Sends a 6-digit verification code via email (Resend).
 * Replaces the old Twilio SMS flow — no SMS provider needed.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { phone: emailOrPhone, userId, email } = await req.json();
    // Accept either field name — frontend may pass phone or email
    const recipient = email || emailOrPhone;
    if (!recipient || !userId) throw new Error("Missing recipient or userId");

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // Upsert subscription record
    const { data: existing } = await sb
      .from("sms_subscriptions")
      .select("id")
      .eq("user_id", userId)
      .limit(1);

    if (existing && existing.length > 0) {
      await sb.from("sms_subscriptions").update({
        phone_number: recipient,
        verification_code: code,
        is_verified: false,
      }).eq("id", existing[0].id);
    } else {
      await sb.from("sms_subscriptions").insert({
        user_id: userId,
        phone_number: recipient,
        verification_code: code,
        is_verified: false,
      });
    }

    // Send via Resend
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Home Clarity Hub <noreply@hometownbuildersclub.com>",
        to: [recipient],
        subject: "Your verification code",
        html: `
          <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #f8f6f2;">
            <div style="background: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
              <p style="font-family: Georgia, serif; font-size: 22px; color: #1b2b4d; margin: 0 0 8px;">Your verification code</p>
              <p style="font-size: 14px; color: #8a8e99; margin: 0 0 32px;">Enter this code in your Home Clarity Hub portal to verify your contact details.</p>
              <div style="background: #f2efeb; border-radius: 8px; padding: 24px; text-align: center; letter-spacing: 0.4em; font-size: 32px; font-weight: 700; color: #1b2b4d; font-family: 'Courier New', monospace;">
                ${code}
              </div>
              <p style="font-size: 12px; color: #8a8e99; margin: 24px 0 0; text-align: center;">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
            </div>
          </div>
        `,
      }),
    });

    if (!emailRes.ok) {
      const err = await emailRes.text();
      console.error("Resend error:", emailRes.status, err);
      throw new Error("Failed to send verification email");
    }

    return new Response(JSON.stringify({ sent: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e: any) {
    console.error("Verification error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
