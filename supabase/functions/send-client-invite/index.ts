import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify caller is a creator
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
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
      return new Response(JSON.stringify({ error: "Only creators can send invites" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, fullName, portalUrl, tempPassword, propertyName, creatorName } = await req.json();

    if (!email || !portalUrl) {
      return new Response(
        JSON.stringify({ error: "email and portalUrl are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const clientFirstName = (fullName || email.split("@")[0]).split(" ")[0];
    const advisorName = creatorName || "Your Home Clarity Advisor";
    const homeName = propertyName || "your home";

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8f7f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e8e5de;">
    <!-- Header -->
    <div style="background:#1a1a1a;padding:32px 40px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:600;letter-spacing:0.5px;">Home Clarity Hub</h1>
      <p style="margin:6px 0 0;color:#c8a97e;font-size:10px;letter-spacing:3px;text-transform:uppercase;">Your Home Operating System</p>
    </div>

    <!-- Body -->
    <div style="padding:40px;">
      <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:22px;font-weight:600;">Welcome, ${clientFirstName}!</h2>
      <p style="margin:0 0 24px;color:#6b6560;font-size:15px;line-height:1.6;">
        Your personalized Home Clarity Portal for <strong style="color:#1a1a1a;">${homeName}</strong> is ready. 
        This is your central hub for everything about your home — your report, projects, equipment registry, and direct communication with your advisor.
      </p>

      <!-- Credentials Box -->
      <div style="background:#f8f7f4;border:1px solid #e8e5de;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
        <p style="margin:0 0 4px;color:#6b6560;font-size:10px;letter-spacing:2px;text-transform:uppercase;">Your Login Credentials</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#6b6560;font-size:13px;width:80px;">Email</td>
            <td style="padding:8px 0;color:#1a1a1a;font-size:14px;font-weight:500;">${email}</td>
          </tr>
          ${tempPassword ? `
          <tr>
            <td style="padding:8px 0;color:#6b6560;font-size:13px;">Password</td>
            <td style="padding:8px 0;color:#1a1a1a;font-size:14px;font-weight:500;font-family:monospace;">${tempPassword}</td>
          </tr>
          ` : ""}
        </table>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;margin:32px 0;">
        <a href="${portalUrl}" style="display:inline-block;background:#c8a97e;color:#fff;text-decoration:none;padding:14px 40px;border-radius:6px;font-size:14px;font-weight:600;letter-spacing:0.5px;">
          Open Your Portal →
        </a>
      </div>

      <p style="margin:0 0 8px;color:#6b6560;font-size:13px;line-height:1.6;">
        Once logged in, you can:
      </p>
      <ul style="margin:0 0 24px;padding-left:20px;color:#6b6560;font-size:13px;line-height:2;">
        <li>Review your complete Home Clarity Report</li>
        <li>Track home projects and improvements</li>
        <li>View your equipment registry and service schedule</li>
        <li>Message your advisor directly</li>
        <li>Ask the AI assistant questions about your home</li>
      </ul>

      ${tempPassword ? `
      <div style="background:#fef3cd;border:1px solid #ffc107;border-radius:6px;padding:12px 16px;margin-bottom:24px;">
        <p style="margin:0;color:#856404;font-size:12px;line-height:1.5;">
          <strong>Security note:</strong> Please change your temporary password after your first login by going to your profile settings.
        </p>
      </div>
      ` : ""}

      <p style="margin:0;color:#6b6560;font-size:14px;">
        Best regards,<br>
        <strong style="color:#1a1a1a;">${advisorName}</strong>
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f8f7f4;padding:20px 40px;border-top:1px solid #e8e5de;text-align:center;">
      <p style="margin:0;color:#a09a92;font-size:11px;">
        Home Clarity Hub — Your Home Operating System
      </p>
    </div>
  </div>
</body>
</html>`;

    // Send via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Home Clarity Hub <onboarding@resend.dev>",
        to: [email],
        subject: `Your Home Clarity Portal is Ready — ${homeName}`,
        html: htmlBody,
      }),
    });

    if (!resendResponse.ok) {
      const errBody = await resendResponse.text();
      console.error("Resend error:", errBody);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: errBody }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendData = await resendResponse.json();

    return new Response(
      JSON.stringify({ success: true, emailId: resendData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-client-invite error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
