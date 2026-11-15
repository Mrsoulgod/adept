// Supabase Edge Function: Baseline Deviation Alert
// Sends a respectful, warm-amber deviation alert to Caregiver/Family via Resend
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      elderName = "Arthur Davies",
      mealAnchor = "Morning with breakfast",
      windowTime = "7:00 AM – 10:00 AM",
      currentTime = "10:45 AM",
      recipientEmail = "sarah.care@example.com",
      comfortNote = "Arthur reported minor knee soreness during wake-up.",
      magicLink = "https://adept-care.app/profile/arthur-davies-78?role=caretaker&action=checkin"
    } = body;

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1e293b; background: #ffffff; border-radius: 12px; border: 1px solid #fef3c7;">
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="display: inline-block; padding: 6px 14px; background: #fef3c7; color: #b45309; font-weight: 600; border-radius: 9999px; font-size: 14px;">
            Adept Gentle Baseline Check • Warm Amber
          </span>
          <h1 style="color: #92400e; margin-top: 12px; font-size: 22px;">Notice: Routine Window Deviation</h1>
          <p style="color: #78350f; font-size: 14px; margin: 0;">Arthur Davies • ${mealAnchor}</p>
        </div>

        <div style="background: #fffbeb; border-radius: 8px; padding: 18px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; font-size: 16px; font-weight: 600; color: #92400e;">Arthur hasn't recorded his morning dose yet</p>
          <p style="margin: 8px 0 0; color: #78350f; font-size: 14px; line-height: 1.5;">
            The typical window for <strong>${mealAnchor}</strong> (${windowTime}) passed approximately 45 minutes ago without confirmation.
          </p>
          ${comfortNote ? `<p style="margin: 8px 0 0; color: #92400e; font-size: 13px; font-style: italic; background: #fef3c7; padding: 8px 12px; border-radius: 6px;">Note from earlier check-in: "${comfortNote}"</p>` : ''}
        </div>

        <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <h3 style="font-size: 14px; color: #475569; margin: 0 0 8px 0;">Recommended Next Steps:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.6;">
            <li>Check in with Arthur casually (ask how breakfast was or if he'd like a fresh cup of tea).</li>
            <li>No urgency or alarm needed — Arthur may simply be resting or taking breakfast later today.</li>
            <li>Use the one-tap button below to send Arthur a gentle reminder prompt on his screen.</li>
          </ul>
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <a href="${magicLink}" 
             style="display: inline-block; background: #d97706; color: #ffffff; padding: 14px 28px; font-weight: 600; text-decoration: none; border-radius: 8px; font-size: 16px;">
            1-Tap Caregiver Check-In
          </a>
        </div>
      </div>
    `;

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ success: true, mode: "demo_mock", emailHtml }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Adept Care <alerts@adeptcare.app>",
        to: [recipientEmail],
        subject: `Arthur's Routine Check: ${mealAnchor} window update`,
        html: emailHtml
      })
    });

    const result = await resendRes.json();
    return new Response(JSON.stringify({ success: true, result }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});

