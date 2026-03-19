import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { client_id, email, name, tier_id, billing_cycle, trial_days } = await req.json();

    if (!client_id || !email || !tier_id || !billing_cycle) {
      throw new Error("Missing required fields: client_id, email, tier_id, billing_cycle");
    }

    // Get tier to find Stripe price ID
    const { data: tier } = await supabase
      .from("membership_tiers")
      .select("*")
      .eq("id", tier_id)
      .single();

    if (!tier) throw new Error("Tier not found");

    const priceId = billing_cycle === "monthly" ? tier.stripe_price_monthly : tier.stripe_price_annual;
    if (!priceId) throw new Error(`No Stripe price ID configured for ${billing_cycle} billing on tier "${tier.name}"`);

    // Check if client already has a Stripe customer
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("user_id", client_id)
      .single();

    let customerId = profile?.stripe_customer_id;

    // Create Stripe customer if needed
    if (!customerId) {
      const customerRes = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email,
          name: name || email,
          "metadata[client_id]": client_id,
        }),
      });
      const customer = await customerRes.json();
      if (customer.error) throw new Error(customer.error.message);
      customerId = customer.id;

      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("user_id", client_id);
    }

    // Build subscription params
    const subParams: Record<string, string> = {
      customer: customerId!,
      "items[0][price]": priceId,
      payment_behavior: "default_incomplete",
      "payment_settings[save_default_payment_method]": "on_subscription",
      "expand[0]": "latest_invoice.payment_intent",
      "metadata[client_id]": client_id,
      "metadata[tier_id]": tier_id,
    };

    if (trial_days && trial_days > 0) {
      const trialEnd = Math.floor(Date.now() / 1000) + trial_days * 86400;
      subParams.trial_end = String(trialEnd);
    }

    const subRes = await fetch("https://api.stripe.com/v1/subscriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(subParams),
    });
    const subscription = await subRes.json();
    if (subscription.error) throw new Error(subscription.error.message);

    // Update profile with subscription info
    const status = subscription.status === "trialing" ? "trialing" : subscription.status;
    await supabase
      .from("profiles")
      .update({
        stripe_subscription_id: subscription.id,
        subscription_status: status,
        subscription_plan_id: priceId,
        subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      })
      .eq("user_id", client_id);

    // Update client_memberships
    await supabase.from("client_memberships").upsert({
      client_id,
      tier_id,
      billing_cycle,
      status,
      stripe_subscription_id: subscription.id,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    }, { onConflict: "client_id" });

    // Get client_secret for payment setup
    const clientSecret = subscription.latest_invoice?.payment_intent?.client_secret || null;

    return new Response(
      JSON.stringify({
        subscription_id: subscription.id,
        client_secret: clientSecret,
        status: subscription.status,
        next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
