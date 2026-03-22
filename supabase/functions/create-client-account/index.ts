import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sendInviteEmail(
  email: string,
  fullName: string,
  portalUrl: string,
  tempPassword: string | null,
  isExisting: boolean,
  propertyAddress: string | null,
) {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — skipping invitation email");
    return;
  }

  const displayName = fullName || email;
  const firstName = displayName.split(" ")[0];

  const credentialsBlock = !isExisting && tempPassword
    ? `
      <div style="background:#F5F0E8;border-radius:8px;padding:20px;margin:24px 0;">
        <p style="font-family:Arial,sans-serif;font-size:13px;color:#1B2B4D;margin:0 0 8px;font-weight:600;">Your Login Credentials</p>
        <p style="font-family:monospace;font-size:14px;color:#1B2B4D;margin:0 0 4px;">Email: <strong>${email}</strong></p>
        <p style="font-family:monospace;font-size:14px;color:#1B2B4D;margin:0;">Temporary Password: <strong>${tempPassword}</strong></p>
        <p style="font-family:Arial,sans-serif;font-size:11px;color:#6B7280;margin:8px 0 0;">We recommend changing your password after your first login.</p>
      </div>`
    : `
      <div style="background:#F5F0E8;border-radius:8px;padding:20px;margin:24px 0;">
        <p style="font-family:Arial,sans-serif;font-size:13px;color:#1B2B4D;margin:0;">
          Use your existing account credentials to log in.
        </p>
      </div>`;

  const propertyLine = propertyAddress
    ? `<p style="font-family:Arial,sans-serif;font-size:14px;color:#6B7280;margin:0 0 20px;">Property: <strong style="color:#1B2B4D">${propertyAddress}</strong></p>`
    : "";

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F9F7F4;font-family:Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F9F7F4;padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr>
          <td style="background:#1B2B4D;padding:32px 40px;text-align:center;">
            <h1 style="font-family:Georgia,serif;font-size:24px;color:#C9A84C;margin:0;">Home Clarity Hub</h1>
            <p style="font-family:Arial,sans-serif;font-size:12px;color:#E8DCC4;margin:6px 0 0;letter-spacing:1px;text-transform:uppercase;">Your Home Stewardship Portal</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h2 style="font-family:Georgia,serif;font-size:22px;color:#1B2B4D;margin:0 0 16px;">Welcome, ${firstName}!</h2>
            <p style="font-family:Arial,sans-serif;font-size:15px;color:#374151;line-height:1.6;margin:0 0 8px;">
              Your personalized Home Clarity Report is ready. Your portal gives you a comprehensive view of your home's condition, recommended projects, and a roadmap for maintaining and improving your property.
            </p>
            ${propertyLine}
            ${credentialsBlock}
            <div style="text-align:center;margin:32px 0;">
              <a href="${portalUrl}" style="display:inline-block;background:#C9A84C;color:#1B2B4D;font-family:Arial,sans-serif;font-size:15px;font-weight:600;text-decoration:none;padding:14px 40px;border-radius:8px;">
                View Your Portal
              </a>
            </div>
            <p style="font-family:Arial,sans-serif;font-size:13px;color:#6B7280;line-height:1.5;margin:0;">
              If you have questions, simply reply to this email or use the Messages tab in your portal to reach your advisor directly.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#F5F0E8;padding:20px 40px;text-align:center;">
            <p style="font-family:Arial,sans-serif;font-size:11px;color:#9CA3AF;margin:0;">
              © ${new Date().getFullYear()} Home Clarity Hub · Professional Home Stewardship
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Home Clarity Hub <onboarding@resend.dev>",
        to: [email],
        subject: "Your Home Clarity Portal Is Ready",
        html: htmlBody,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Resend error:", res.status, errBody);
    } else {
      console.log("Invitation email sent to", email);
    }
  } catch (e) {
    console.error("Failed to send invite email:", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    let tempPassword: string | null = null;

    if (existingUser) {
      clientUserId = existingUser.id;
    } else {
      // Generate a temporary password
      tempPassword =
        "Hbc!" +
        Array.from(crypto.getRandomValues(new Uint8Array(12)))
          .map((b) => b.toString(36))
          .join("")
          .slice(0, 12);

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

      // Assign client role
      await adminClient.from("user_roles").upsert(
        { user_id: clientUserId, role: "client" },
        { onConflict: "user_id,role" }
      );

      // Update profile with email
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

    // Fetch property address for the email
    const { data: propData } = await adminClient
      .from("properties")
      .select("property_name, address")
      .eq("id", propertyId)
      .single();

    const propertyAddress = propData?.address || propData?.property_name || null;

    // Log activity
    await adminClient.from("activity_log").insert({
      user_id: caller.id,
      property_id: propertyId,
      action_type: "publish",
      message: `Client account created for ${email}`,
      metadata: { client_user_id: clientUserId },
    });

    // Build portal URL
    const origin = req.headers.get("origin") || supabaseUrl;
    const portalUrl = `${origin}/portal/${propertyId}`;

    // Send branded invitation email (non-blocking)
    sendInviteEmail(
      email,
      fullName || email,
      portalUrl,
      tempPassword,
      !!existingUser,
      propertyAddress,
    );

    return new Response(
      JSON.stringify({
        success: true,
        clientUserId,
        isExisting: !!existingUser,
        portalUrl,
        tempPassword: tempPassword,
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
