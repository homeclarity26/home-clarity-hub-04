export function getClientInviteEmailHtml({
  clientName,
  portalUrl,
  advisorName,
}: {
  clientName: string;
  portalUrl: string;
  advisorName: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Home Clarity Hub</title>
</head>
<body style="margin:0;padding:0;background-color:#E8DCC4;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#E8DCC4;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background-color:#1B2B4D;padding:32px 40px;border-radius:12px 12px 0 0;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:0.5px;">
                Home Clarity Hub
              </h1>
              <p style="margin:6px 0 0;color:#C5A55A;font-size:11px;text-transform:uppercase;letter-spacing:3px;">
                Your Home Stewardship Portal
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:40px;">
              <h2 style="margin:0 0 16px;color:#1B2B4D;font-size:22px;font-weight:600;">
                Welcome, ${clientName}!
              </h2>
              <p style="margin:0 0 20px;color:#4a5568;font-size:15px;line-height:1.7;">
                Your personal Home Clarity Report is ready. This comprehensive document is your
                guide to understanding, maintaining, and improving your home — organized by every
                major system and space.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background-color:#f7f5f0;border-radius:8px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 12px;color:#1B2B4D;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">
                      What's Inside Your Report
                    </p>
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr><td style="padding:4px 0;color:#4a5568;font-size:14px;">✓ Detailed condition assessment of every home system</td></tr>
                      <tr><td style="padding:4px 0;color:#4a5568;font-size:14px;">✓ Prioritized maintenance & improvement recommendations</td></tr>
                      <tr><td style="padding:4px 0;color:#4a5568;font-size:14px;">✓ Good / Better / Best pricing tiers for each item</td></tr>
                      <tr><td style="padding:4px 0;color:#4a5568;font-size:14px;">✓ Equipment registry with service tracking</td></tr>
                      <tr><td style="padding:4px 0;color:#4a5568;font-size:14px;">✓ Financial roadmap & strategic plan</td></tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${portalUrl}" target="_blank" style="display:inline-block;padding:14px 40px;background-color:#B7410E;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:8px;letter-spacing:0.5px;">
                      View My Report
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;color:#4a5568;font-size:14px;line-height:1.6;">
                Your portal is available 24/7, and you can reach out to me anytime through the
                built-in messaging system.
              </p>
              <p style="margin:16px 0 0;color:#1B2B4D;font-size:14px;font-weight:500;">
                — ${advisorName}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#1B2B4D;padding:24px 40px;border-radius:0 0 12px 12px;text-align:center;">
              <p style="margin:0;color:#ffffff80;font-size:11px;letter-spacing:1px;text-transform:uppercase;">
                Home Clarity Hub · Hometown Builders Club
              </p>
              <p style="margin:8px 0 0;color:#ffffff50;font-size:11px;">
                This email was sent because your advisor created a home stewardship account for you.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
