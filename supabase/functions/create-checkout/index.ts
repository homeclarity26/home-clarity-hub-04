import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not configured");

    const { invoice_id, amount, title, success_url, cancel_url, customer_email } = await req.json();

    if (!invoice_id || !amount) {
      return new Response(JSON.stringify({ error: "Missing invoice_id or amount", missing: [!invoice_id && "invoice_id", !amount && "amount"].filter(Boolean) }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create a Stripe Checkout Session for a one-time payment
    const params = new URLSearchParams({
      "payment_method_types[0]": "card",
      mode: "payment",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(Math.round(amount * 100)),
      "line_items[0][price_data][product_data][name]": title || `Invoice ${invoice_id}`,
      "line_items[0][quantity]": "1",
      success_url: success_url || "https://example.com/payment-success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: cancel_url || "https://example.com/payment-cancelled",
      "metadata[invoice_id]": invoice_id,
    });

    if (customer_email) {
      params.set("customer_email", customer_email);
    }

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || "Stripe error");
    }

    const session = await res.json();

    return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Create checkout error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
