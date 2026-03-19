import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.text();
    let event: any;

    // If webhook secret is configured, verify signature
    if (STRIPE_WEBHOOK_SECRET) {
      const signature = req.headers.get("stripe-signature");
      if (!signature) return new Response("Missing signature", { status: 400 });

      // Simple HMAC verification for Deno
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(STRIPE_WEBHOOK_SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );

      // Parse signature header
      const parts = signature.split(",").reduce((acc: Record<string, string>, part: string) => {
        const [k, v] = part.split("=");
        acc[k] = v;
        return acc;
      }, {});

      const timestamp = parts["t"];
      const signedPayload = `${timestamp}.${body}`;
      const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
      const expectedSig = Array.from(new Uint8Array(mac))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      if (expectedSig !== parts["v1"]) {
        return new Response("Invalid signature", { status: 400 });
      }
    }

    event = JSON.parse(body);
    const eventType = event.type;
    const obj = event.data.object;

    // Helper to find client_id from Stripe customer
    const findClientId = async (customerId: string): Promise<string | null> => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .single();
      return data?.user_id || null;
    };

    switch (eventType) {
      case "invoice.payment_succeeded": {
        const clientId = await findClientId(obj.customer);
        if (!clientId) break;

        // Record subscription event
        await supabase.from("subscription_events").insert({
          client_id: clientId,
          event_type: "payment_succeeded",
          stripe_event_id: event.id,
          amount_cents: obj.amount_paid,
          currency: obj.currency,
          period_start: obj.period_start ? new Date(obj.period_start * 1000).toISOString() : null,
          period_end: obj.period_end ? new Date(obj.period_end * 1000).toISOString() : null,
          invoice_url: obj.hosted_invoice_url,
        });

        // Create HBC invoice marked as paid
        if (obj.subscription) {
          const { data: property } = await supabase
            .from("properties")
            .select("id")
            .eq("client_user_id", clientId)
            .limit(1)
            .single();

          if (property) {
            await supabase.from("invoices").insert({
              property_id: property.id,
              description: `Membership payment — ${obj.lines?.data?.[0]?.description || "Subscription"}`,
              amount: obj.amount_paid / 100,
              status: "paid",
              due_date: new Date(obj.period_end * 1000).toISOString(),
              paid_date: new Date().toISOString(),
            });
          }
        }

        // Update profile status
        await supabase
          .from("profiles")
          .update({ subscription_status: "active" })
          .eq("user_id", clientId);

        break;
      }

      case "invoice.payment_failed": {
        const clientId = await findClientId(obj.customer);
        if (!clientId) break;

        await supabase
          .from("profiles")
          .update({ subscription_status: "past_due" })
          .eq("user_id", clientId);

        await supabase.from("subscription_events").insert({
          client_id: clientId,
          event_type: "payment_failed",
          stripe_event_id: event.id,
          amount_cents: obj.amount_due,
          currency: obj.currency,
        });

        // Create admin alert via activity log
        await supabase.from("activity_log").insert({
          user_id: clientId,
          action_type: "payment_failed",
          message: `Subscription payment failed — $${(obj.amount_due / 100).toFixed(2)}`,
          metadata: { stripe_event_id: event.id, invoice_url: obj.hosted_invoice_url },
        });

        break;
      }

      case "customer.subscription.deleted": {
        const clientId = await findClientId(obj.customer);
        if (!clientId) break;

        await supabase
          .from("profiles")
          .update({
            subscription_status: "canceled",
            stripe_subscription_id: null,
            subscription_plan_id: null,
          })
          .eq("user_id", clientId);

        await supabase
          .from("client_memberships")
          .update({ status: "canceled", cancelled_at: new Date().toISOString() })
          .eq("client_id", clientId)
          .neq("status", "canceled");

        await supabase.from("subscription_events").insert({
          client_id: clientId,
          event_type: "subscription_deleted",
          stripe_event_id: event.id,
        });

        break;
      }

      case "customer.subscription.updated": {
        const clientId = await findClientId(obj.customer);
        if (!clientId) break;

        const status = obj.cancel_at_period_end ? "active" : obj.status;

        await supabase
          .from("profiles")
          .update({
            subscription_status: status,
            subscription_current_period_end: new Date(obj.current_period_end * 1000).toISOString(),
            subscription_plan_id: obj.items?.data?.[0]?.price?.id || null,
          })
          .eq("user_id", clientId);

        await supabase
          .from("client_memberships")
          .update({
            status,
            current_period_start: new Date(obj.current_period_start * 1000).toISOString(),
            current_period_end: new Date(obj.current_period_end * 1000).toISOString(),
          })
          .eq("client_id", clientId)
          .neq("status", "canceled");

        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
