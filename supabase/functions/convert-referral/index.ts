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
    const { referral_code, referred_property_id, referred_name, referred_email } = await req.json();

    if (!referral_code) {
      return new Response(JSON.stringify({ error: "referral_code required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Look up the referral link
    const { data: link } = await supabase
      .from("referral_links")
      .select("*")
      .eq("referral_code", referral_code)
      .single();

    if (!link) {
      return new Response(JSON.stringify({ error: "Invalid referral code" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default credit amount: 5000 cents = $50
    const creditAmountCents = 5000;

    // Check if already converted for this email
    const { data: existing } = await supabase
      .from("referral_events")
      .select("id")
      .eq("referral_code", referral_code)
      .eq("referred_email", referred_email)
      .eq("status", "converted")
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: "Already converted", already_converted: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update or create the referral event
    const { data: existingEvent } = await supabase
      .from("referral_events")
      .select("id")
      .eq("referral_code", referral_code)
      .eq("referred_email", referred_email)
      .neq("status", "converted")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingEvent) {
      await supabase
        .from("referral_events")
        .update({
          status: "converted",
          referred_property_id,
          referred_name,
          credit_amount_cents: creditAmountCents,
          credit_applied_at: new Date().toISOString(),
        })
        .eq("id", existingEvent.id);
    } else {
      await supabase.from("referral_events").insert({
        referral_code,
        referrer_property_id: link.property_id,
        referred_email,
        referred_name,
        referred_property_id,
        status: "converted",
        credit_amount_cents: creditAmountCents,
        credit_applied_at: new Date().toISOString(),
      });
    }

    // Create a credit for the referrer
    const { data: credit } = await supabase
      .from("referral_credits")
      .insert({
        property_id: link.property_id,
        amount_cents: creditAmountCents,
        reason: `Referral: ${referred_name || referred_email} joined HBC`,
        status: "available",
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select("id")
      .single();

    // Update link totals
    const { count: totalConverted } = await supabase
      .from("referral_events")
      .select("id", { count: "exact" })
      .eq("referral_code", referral_code)
      .eq("status", "converted");

    const { data: creditSum } = await supabase
      .from("referral_credits")
      .select("amount_cents")
      .eq("property_id", link.property_id)
      .in("status", ["available", "applied"]);

    const totalCredits = (creditSum || []).reduce((s: number, c: any) => s + c.amount_cents, 0);

    await supabase
      .from("referral_links")
      .update({
        total_converted: totalConverted || 0,
        total_credits_earned_cents: totalCredits,
      })
      .eq("id", link.id);

    // Send push notification to admin (fire-and-forget)
    try {
      const { data: admins } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "creator");

      if (admins && admins.length > 0) {
        for (const admin of admins) {
          await supabase.functions.invoke("send-push-notification", {
            body: {
              user_id: admin.user_id,
              title: "🎉 Referral converted!",
              body: `${referred_name || referred_email} joined via referral. $${(creditAmountCents / 100).toFixed(0)} credit issued.`,
              url: "/admin/referrals",
            },
          });
        }
      }
    } catch (e) {
      console.error("Failed to send notification:", e);
    }

    return new Response(
      JSON.stringify({
        success: true,
        credit_id: credit?.id,
        credit_amount_cents: creditAmountCents,
        total_converted: totalConverted,
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
