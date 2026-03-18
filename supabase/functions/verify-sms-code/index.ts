import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { phone, code, userId } = await req.json();
    if (!phone || !code || !userId) throw new Error("Missing required fields");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    const { data } = await sb.from("sms_subscriptions")
      .select("id, verification_code")
      .eq("user_id", userId)
      .eq("phone_number", phone)
      .limit(1);

    if (!data || data.length === 0) {
      return new Response(JSON.stringify({ verified: false, error: "No subscription found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (data[0].verification_code !== code) {
      return new Response(JSON.stringify({ verified: false, error: "Invalid code" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await sb.from("sms_subscriptions").update({
      is_verified: true,
      verification_code: null,
    }).eq("id", data[0].id);

    return new Response(JSON.stringify({ verified: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Verify SMS code error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
