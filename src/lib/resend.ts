// Resend Integration & One-Tap Magic-Link Email Templates

export interface EmailDispatchResult {
  success: boolean;
  mode: 'live_resend' | 'demo_simulated';
  id?: string;
  recipient: string;
  subject: string;
  htmlContent: string;
  magicUrl?: string;
  timestamp: string;
}

export async function sendEmailViaResend(options: {
  to: string;
  subject: string;
  html: string;
  apiKey?: string;
  magicUrl?: string;
}): Promise<EmailDispatchResult> {
  const { to, subject, html, apiKey, magicUrl } = options;

  if (apiKey && apiKey.startsWith('re_')) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Adept Platform <onboarding@resend.dev>',
          to: [to],
          subject,
          html,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.warn('Resend API live send failed, using simulated response:', errorText);
      } else {
        const data = await res.json();
        return {
          success: true,
          mode: 'live_resend',
          id: data.id,
          recipient: to,
          subject,
          htmlContent: html,
          magicUrl,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (e) {
      console.warn('Resend fetch error, fallback to simulated demo mode:', e);
    }
  }

  // Zero-cost Hackathon Simulated Dispatch
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    success: true,
    mode: 'demo_simulated',
    id: `resend_sim_${Math.random().toString(36).substring(2, 9)}`,
    recipient: to,
    subject,
    htmlContent: html,
    magicUrl,
    timestamp: new Date().toISOString(),
  };
}

export function buildCaregiverDigestHtml(params: {
  elderName: string;
  dateStr: string;
  adherenceRate: number;
  morningStatus: string;
  lunchStatus: string;
  dinnerStatus: string;
  notes: string;
  magicLink: string;
}): string {
  const { elderName, dateStr, adherenceRate, morningStatus, lunchStatus, dinnerStatus, notes, magicLink } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Adept Caregiver Digest</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table width="560" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner (Calm Forest Green) -->
          <tr>
            <td style="background-color: #064e3b; padding: 28px 24px; text-align: center;">
              <span style="display: inline-block; background-color: rgba(255,255,255,0.2); color: #ffffff; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
                Adept Daily Digest
              </span>
              <h1 style="color: #ffffff; font-size: 24px; margin: 12px 0 4px 0; font-weight: 700;">${elderName}’s Routine</h1>
              <p style="color: #a7f3d0; margin: 0; font-size: 15px;">${dateStr} • Calm & Steady</p>
            </td>
          </tr>

          <!-- Adherence Score -->
          <tr>
            <td style="padding: 24px;">
              <table width="100%" style="background-color: #ecfdf5; border-radius: 12px; border: 1px solid #a7f3d0; padding: 16px;">
                <tr>
                  <td width="70">
                    <div style="width: 56px; height: 56px; background-color: #047857; color: #ffffff; border-radius: 50%; text-align: center; line-height: 56px; font-size: 20px; font-weight: bold;">
                      ${adherenceRate}%
                    </div>
                  </td>
                  <td>
                    <h3 style="margin: 0; color: #065f46; font-size: 16px;">Calm Baseline Maintained</h3>
                    <p style="margin: 4px 0 0; color: #047857; font-size: 14px;">Arthur is on track with scheduled meal-anchor medication windows today.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Meal Anchors Breakdown -->
          <tr>
            <td style="padding: 0 24px 16px 24px;">
              <h4 style="margin: 0 0 12px 0; color: #334155; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Daily Anchor Status</h4>
              <table width="100%" border="0" cellspacing="0" cellpadding="8" style="font-size: 14px;">
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="color: #1e293b; font-weight: 500;">🌅 Morning (Breakfast 7-10 AM)</td>
                  <td align="right" style="color: #059669; font-weight: 600;">${morningStatus}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="color: #1e293b; font-weight: 500;">☀️ Midday (Lunch 12-2:30 PM)</td>
                  <td align="right" style="color: #0284c7; font-weight: 600;">${lunchStatus}</td>
                </tr>
                <tr>
                  <td style="color: #1e293b; font-weight: 500;">🌙 Evening (Dinner 6-8:30 PM)</td>
                  <td align="right" style="color: #64748b; font-weight: 600;">${dinnerStatus}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Comfort Notes -->
          ${notes ? `
          <tr>
            <td style="padding: 0 24px 20px 24px;">
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 14px; border-left: 3px solid #cbd5e1;">
                <strong style="color: #475569; font-size: 13px; text-transform: uppercase;">Arthur's Daily Note:</strong>
                <p style="margin: 6px 0 0; color: #334155; font-size: 14px;">"${notes}"</p>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- One-Tap Magic Button -->
          <tr>
            <td style="padding: 10px 24px 32px 24px; text-align: center;">
              <a href="${magicLink}" 
                 style="display: inline-block; background-color: #064e3b; color: #ffffff; text-decoration: none; padding: 16px 32px; font-size: 16px; font-weight: 600; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(6, 78, 59, 0.2);">
                1-Tap View Caregiver Portal →
              </a>
              <p style="margin: 12px 0 0; color: #94a3b8; font-size: 12px;">Instant secure access • No password needed</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

export function buildDeviationAlertHtml(params: {
  elderName: string;
  mealAnchorLabel: string;
  windowLabel: string;
  delayedByStr: string;
  comfortNote?: string;
  magicLink: string;
}): string {
  const { elderName, mealAnchorLabel, windowLabel, delayedByStr, comfortNote, magicLink } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Adept Gentle Deviation Notice</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #fffbeb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table width="560" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(217, 119, 6, 0.1); border: 2px solid #fef3c7;">
          
          <!-- Amber Header (Respectful, Warm, No Panic) -->
          <tr>
            <td style="background-color: #d97706; padding: 24px; text-align: center;">
              <span style="display: inline-block; background-color: rgba(255,255,255,0.25); color: #ffffff; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600;">
                Gentle Routine Notice • Warm Amber
              </span>
              <h1 style="color: #ffffff; font-size: 22px; margin: 10px 0 4px 0; font-weight: 700;">Routine Check for ${elderName}</h1>
              <p style="color: #fef3c7; margin: 0; font-size: 14px;">Meal window elapsed • No shame, just checking in</p>
            </td>
          </tr>

          <!-- Deviation Details -->
          <tr>
            <td style="padding: 24px;">
              <div style="background-color: #fffbeb; border-radius: 10px; padding: 18px; border: 1px solid #fde68a;">
                <h3 style="margin: 0; color: #92400e; font-size: 16px; font-weight: 600;">
                  ${mealAnchorLabel} window passed ${delayedByStr}
                </h3>
                <p style="margin: 8px 0 0; color: #78350f; font-size: 14px; line-height: 1.5;">
                  The standard window for ${mealAnchorLabel} is <strong>${windowLabel}</strong>. Arthur has not checked this off yet.
                </p>
                ${comfortNote ? `
                  <div style="margin-top: 10px; padding: 10px; background-color: #fef3c7; border-radius: 6px; font-size: 13px; color: #92400e;">
                    <strong>Arthur’s earlier note:</strong> "${comfortNote}"
                  </div>
                ` : ''}
              </div>
            </td>
          </tr>

          <!-- Reassurance Guidance -->
          <tr>
            <td style="padding: 0 24px 16px 24px;">
              <h4 style="margin: 0 0 8px 0; color: #475569; font-size: 14px;">How to check in calmly:</h4>
              <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.6;">
                <li>Give Arthur a relaxed phone call or ask if he’s enjoying breakfast.</li>
                <li>Avoid urgency or alarming words — elders often take meals at shifted hours.</li>
                <li>Tap the button below to prompt a single warm question on his tablet screen.</li>
              </ul>
            </td>
          </tr>

          <!-- One-Tap Action -->
          <tr>
            <td style="padding: 10px 24px 32px 24px; text-align: center;">
              <a href="${magicLink}" 
                 style="display: inline-block; background-color: #d97706; color: #ffffff; text-decoration: none; padding: 16px 32px; font-size: 16px; font-weight: 600; border-radius: 10px;">
                1-Tap Send Gentle Reminder Screen →
              </a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

