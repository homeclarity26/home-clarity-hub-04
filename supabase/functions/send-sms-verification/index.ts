import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAI, parseJSON } from "../_shared/ai-client.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { phone, userId } = await req.json();
    if (!phone || !userId) throw new Error("Missing phone or userId");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // Upsert SMS subscription with verification code
    const { data: existing } = await sb.from("sms_subscriptions")
      .select("id")
      .eq("user_id", userId)
      .limit(1);

    if (existing && existing.length > 0) {
      await sb.from("sms_subscriptions").update({
        phone_number: phone,
        verification_code: code,
        is_verified: false,
      }).eq("id", existing[0].id);
    } else {
      await sb.from("sms_subscriptions").insert({
        user_id: userId,
        phone_number: phone,
        verification_code: code,
        is_verified: false,
      });
    }

    // Try to send via Twilio if configured
    const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");

    if (TWILIO_API_KEY) {
      // Direct Twilio REST API (no gateway)
      const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID") || TWILIO_API_KEY;
      const twilioResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(TWILIO_ACCOUNT_SID + ":" + TWILIO_API_KEY)}`,
          "X-Connection-Api-Key": TWILIO_API_KEY,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: phone,
          From: Deno.env.get("TWILIO_FROM_NUMBER") || "+15005550006",
          Body: `Your Home Clarity Hub verification code is: ${code}`,
        }),
      });

      if (!twilioResponse.ok) {
        console.error("Twilio send failed:", await twilioResponse.text());
      }
    } else {
      console.log(`[DEV] SMS verification code for ${phone}: ${code}`);
    }

    return new Response(JSON.stringify({ sent: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("SMS verification error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
