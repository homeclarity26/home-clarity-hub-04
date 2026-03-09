import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is a creator using anon client with their token
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user: caller },
    } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check creator role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleCheck } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "creator")
      .single();

    if (!roleCheck) {
      return new Response(JSON.stringify({ error: "Only creators can invite clients" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, fullName, propertyId } = await req.json();

    if (!email || !propertyId) {
      return new Response(
        JSON.stringify({ error: "email and propertyId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    let clientUserId: string;

    if (existingUser) {
      clientUserId = existingUser.id;
    } else {
      // Generate a temporary password
      const tempPassword =
        "Hbc!" +
        Array.from(crypto.getRandomValues(new Uint8Array(12)))
          .map((b) => b.toString(36))
          .join("")
          .slice(0, 12);

      // Create the client user account
      const { data: newUser, error: createErr } =
        await adminClient.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { full_name: fullName || email },
        });

      if (createErr) {
        return new Response(
          JSON.stringify({ error: createErr.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      clientUserId = newUser.user.id;

      // The handle_new_user trigger auto-creates profile + client role,
      // but let's also update profile email
      await adminClient
        .from("profiles")
        .update({ email, full_name: fullName || email })
        .eq("user_id", clientUserId);
    }

    // Reassign the property to the real client user
    const { error: propErr } = await adminClient
      .from("properties")
      .update({ client_user_id: clientUserId })
      .eq("id", propertyId);

    if (propErr) {
      return new Response(
        JSON.stringify({ error: "Failed to assign property: " + propErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a magic link for the client to sign in
    const { data: magicLink, error: linkErr } =
      await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo: `${req.headers.get("origin") || supabaseUrl}/portal/${propertyId}` },
      });

    // Log activity
    await adminClient.from("activity_log").insert({
      user_id: caller.id,
      property_id: propertyId,
      action_type: "publish",
      message: `Client account created and invite sent to ${email}`,
      metadata: { client_user_id: clientUserId },
    });

    return new Response(
      JSON.stringify({
        success: true,
        clientUserId,
        isExisting: !!existingUser,
        portalUrl: `/portal/${propertyId}`,
        magicLinkSent: !linkErr,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("create-client-account error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
