import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { referral_code, redirect_url } = await req.json();

    if (!referral_code) {
      return new Response(JSON.stringify({ error: "referral_code required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the referral code exists
    const { data: link } = await supabase
      .from("referral_links")
      .select("id, property_id")
      .eq("referral_code", referral_code)
      .single();

    if (!link) {
      return new Response(JSON.stringify({ error: "Invalid referral code" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Record a "clicked" event
    await supabase.from("referral_events").insert({
      referral_code,
      referrer_property_id: link.property_id,
      status: "clicked",
    });

    // Update total_referrals count
    await supabase
      .from("referral_links")
      .update({ total_referrals: (await supabase.from("referral_events").select("id", { count: "exact" }).eq("referral_code", referral_code)).count || 0 })
      .eq("referral_code", referral_code);

    return new Response(
      JSON.stringify({
        success: true,
        referral_code,
        redirect: redirect_url || "/login?referred=true",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
