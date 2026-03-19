import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Web Push crypto utilities for VAPID
async function generateVapidAuth(
  endpoint: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  sub: string
) {
  const audience = new URL(endpoint).origin;

  // Create JWT header and payload
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud: audience, exp: now + 12 * 3600, sub };

  const enc = new TextEncoder();

  function base64url(buf: ArrayBuffer | Uint8Array): string {
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    let s = "";
    for (const b of bytes) s += String.fromCharCode(b);
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function base64urlDecode(s: string): Uint8Array {
    s = s.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    const bin = atob(s);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  // Import the private key
  const rawPrivateKey = base64urlDecode(vapidPrivateKey);
  const rawPublicKey = base64urlDecode(vapidPublicKey);

  // Build the JWK from raw keys
  const jwk = {
    kty: "EC",
    crv: "P-256",
    x: base64url(rawPublicKey.slice(1, 33)),
    y: base64url(rawPublicKey.slice(33, 65)),
    d: base64url(rawPrivateKey),
  };

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const headerB64 = base64url(enc.encode(JSON.stringify(header)));
  const payloadB64 = base64url(enc.encode(JSON.stringify(payload)));
  const signingInput = enc.encode(`${headerB64}.${payloadB64}`);

  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    signingInput
  );

  // Convert DER signature to raw r||s format
  const sigBytes = new Uint8Array(sig);
  let r: Uint8Array, s: Uint8Array;

  if (sigBytes.length === 64) {
    r = sigBytes.slice(0, 32);
    s = sigBytes.slice(32, 64);
  } else {
    // DER format
    let offset = 2;
    const rLen = sigBytes[offset + 1];
    offset += 2;
    r = sigBytes.slice(offset, offset + rLen);
    offset += rLen;
    const sLen = sigBytes[offset + 1];
    offset += 2;
    s = sigBytes.slice(offset, offset + sLen);

    // Pad to 32 bytes
    if (r.length > 32) r = r.slice(r.length - 32);
    if (s.length > 32) s = s.slice(s.length - 32);
    if (r.length < 32) { const p = new Uint8Array(32); p.set(r, 32 - r.length); r = p; }
    if (s.length < 32) { const p = new Uint8Array(32); p.set(s, 32 - s.length); s = p; }
  }

  const rawSig = new Uint8Array(64);
  rawSig.set(r, 0);
  rawSig.set(s, 32);

  const token = `${headerB64}.${payloadB64}.${base64url(rawSig)}`;
  const publicKeyB64 = base64url(rawPublicKey);

  return { token, publicKey: publicKeyB64 };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, title, body, url, icon } = await req.json();

    if (!user_id || !title) {
      return new Response(
        JSON.stringify({ error: "user_id and title required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(
        JSON.stringify({ error: "VAPID keys not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all subscriptions for this user
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("*")
      .or(`user_id.eq.${user_id},admin_id.eq.${user_id},client_id.eq.${user_id}`);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, message: "No subscriptions found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the notification
    const { data: logEntry } = await supabase
      .from("push_notification_log")
      .insert({ user_id, title, body: body || "", url: url || null })
      .select("id")
      .single();

    let sent = 0;
    const expired: string[] = [];

    for (const sub of subscriptions) {
      try {
        const { token, publicKey } = await generateVapidAuth(
          sub.endpoint,
          vapidPublicKey,
          vapidPrivateKey,
          "mailto:notifications@hometownbuildersclub.com"
        );

        const payload = JSON.stringify({
          title,
          body: body || "",
          icon: icon || "/favicon.ico",
          data: {
            url: url || "/",
            log_id: logEntry?.id,
          },
        });

        const pushResponse = await fetch(sub.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            Authorization: `vapid t=${token}, k=${publicKey}`,
            TTL: "86400",
          },
          body: new TextEncoder().encode(payload),
        });

        if (pushResponse.status === 201 || pushResponse.status === 200) {
          sent++;
          // Update last_used_at
          await supabase
            .from("push_subscriptions")
            .update({ last_used_at: new Date().toISOString() })
            .eq("id", sub.id);
        } else if (pushResponse.status === 410 || pushResponse.status === 404) {
          // Subscription expired — remove
          expired.push(sub.id);
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      } catch (e) {
        console.error(`Push failed for sub ${sub.id}:`, e);
      }
    }

    return new Response(
      JSON.stringify({ sent, expired: expired.length, total: subscriptions.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("send-push-notification error:", e);
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
