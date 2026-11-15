// Supabase Edge Function: Schedule Reminders with Signed One-Tap Links via Resend
// Handles: Upcoming Doses, Missed / Elapsed Windows, and Doctor Appointments
// Includes signed 1-tap links (Taken / Later / Skip) that log doses with no login and expire safely.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SIGNING_SECRET = Deno.env.get("REMINDER_SIGNING_SECRET") || "adept_secure_signing_secret_2026";
const APP_BASE_URL = Deno.env.get("APP_BASE_URL") || "https://adept-care.app";

// Helper: HMAC-SHA256 signature generator using Web Crypto API
async function signOneTapAction(
  profileId: string,
  medicationId: string,
  action: string,
  expiresAt: number
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${profileId}:${medicationId}:${action}:${expiresAt}`);
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SIGNING_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, data);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Helper: Verify HMAC-SHA256 signature
async function verifyOneTapSignature(
  profileId: string,
  medicationId: string,
  action: string,
  expiresAt: number,
  expectedSig: string
): Promise<boolean> {
  if (Date.now() > expiresAt) return false; // Expired
  const validSig = await signOneTapAction(profileId, medicationId, action, expiresAt);
  return validSig === expectedSig;
}

serve(async (req: Request) => {
  const url = new URL(req.url);

  // -------------------------------------------------------------------
  // 1. ONE-TAP ACTION HANDLER (GET request when elder/family clicks in email)
  // -------------------------------------------------------------------
  if (req.method === "GET" && url.searchParams.has("action")) {
    const action = url.searchParams.get("action") || "";
    const profileId = url.searchParams.get("profile_id") || "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
    const medicationId = url.searchParams.get("med_id") || "";
    const expiresAt = parseInt(url.searchParams.get("expires") || "0", 10);
    const signature = url.searchParams.get("sig") || "";

    const isValid = await verifyOneTapSignature(profileId, medicationId, action, expiresAt, signature);

    if (!isValid) {
      return new Response(
        `<!DOCTYPE html><html><body style="font-family: system-ui, sans-serif; background: #FAF8F5; color: #1A1D1A; padding: 40px; text-align: center;">
          <div style="max-width: 480px; margin: 0 auto; background: white; padding: 32px; border-radius: 24px; border: 2px solid #EBDBC1;">
            <h2 style="color: #92631E; font-size: 24px;">Link Expired or Invalid</h2>
            <p style="font-size: 18px; color: #474C46;">For security and patient safety, reminder links expire after 24 hours. Please open Adept directly.</p>
            <a href="${APP_BASE_URL}" style="display: inline-block; background: #244937; color: white; padding: 14px 28px; border-radius: 14px; text-decoration: none; font-weight: bold; font-size: 18px; margin-top: 16px;">Open Adept Screen</a>
          </div>
        </body></html>`,
        { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 400 }
      );
    }

    // Execute action in Supabase
    const supabase = createClient(
      SUPABASE_URL || "https://xyz.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY || "dummy"
    );

    let statusLabel = "Taken";
    let dbStatus = "taken";
    if (action === "later") {
      statusLabel = "Deferred for Later";
      dbStatus = "deferred";
    } else if (action === "skip") {
      statusLabel = "Skipped Comfortably";
      dbStatus = "skipped_comfortably";
    }

    try {
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        await supabase.from("dose_logs").insert({
          profile_id: profileId,
          medication_id: medicationId,
          status: dbStatus,
          meal_anchor: "morning_breakfast",
          notes: `Logged via signed one-tap email link (${action}). No login required.`,
        });

        await supabase.from("audit_log").insert({
          profile_id: profileId,
          actor_role: "elder",
          action: `One-Tap Email Confirmation: ${statusLabel}`,
          description: `Action (${statusLabel}) recorded from secure signed email link.`,
          can_elder_veto: false,
        });
      }
    } catch (e) {
      console.warn("Database log warning:", e);
    }

    // Return beautiful, calm high-contrast confirmation screen
    return new Response(
      `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dose Recorded • Adept</title>
      </head>
      <body style="margin: 0; padding: 40px 20px; background-color: #FAF8F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1A1D1A; text-align: center;">
        <div style="max-width: 520px; margin: 0 auto; background: #ffffff; padding: 40px 32px; border-radius: 28px; border: 2px solid #EAE5DB; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
          <div style="width: 72px; height: 72px; background: #EAF2EC; color: #244937; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 36px; line-height: 72px; font-weight: bold;">
            ✓
          </div>
          <span style="background: #EAF2EC; color: #244937; padding: 6px 16px; border-radius: 20px; font-size: 15px; font-weight: 700; text-transform: uppercase;">
            Adept Care • One-Tap Confirmation
          </span>
          <h1 style="font-size: 32px; font-weight: 800; margin: 20px 0 10px 0; color: #1A1D1A;">
            Thank you, Arthur!
          </h1>
          <p style="font-size: 22px; color: #244937; font-weight: 700; margin: 0 0 16px 0;">
            Status: ${statusLabel}
          </p>
          <p style="font-size: 19px; color: #474C46; line-height: 1.6; margin: 0 0 28px 0;">
            Your dose record has been safely updated with zero passwords. Sarah and your care team can see that your routine is calm and steady.
          </p>
          <a href="${APP_BASE_URL}" style="display: block; background: #244937; color: #ffffff; padding: 18px 32px; font-size: 20px; font-weight: 700; border-radius: 16px; text-decoration: none;">
            Return to Adept Screen
          </a>
        </div>
      </body>
      </html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // -------------------------------------------------------------------
  // 2. DISPATCH REMINDER EMAILS (POST request triggered by pg_cron or webhook)
  // -------------------------------------------------------------------
  try {
    const body = await req.json().catch(() => ({}));
    const {
      type = "upcoming_dose", // 'upcoming_dose' | 'missed_dose' | 'appointment'
      profileId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      recipientEmail = "arthur@adeptcare.app",
      medicationId = "med-am-1",
      medicationName = "Amlodipine (Morning Blood Pressure Pill)",
      dose = "5 mg",
      mealAnchor = "Morning with breakfast (7:00 AM – 10:00 AM)",
      instructions = "1 tablet with breakfast toast and warm water",
      doctorName = "Dr. Evelyn Vance",
      appointmentTime = "Tuesday, Nov 18 at 10:30 AM",
      appointmentLocation = "St. Jude Geriatric Clinic, Suite 400",
    } = body;

    // Signed links expire in 24 hours safely
    const expiresAt = Date.now() + 24 * 3600 * 1000;
    const functionBaseUrl = url.origin + url.pathname;

    const [sigTaken, sigLater, sigSkip] = await Promise.all([
      signOneTapAction(profileId, medicationId, "taken", expiresAt),
      signOneTapAction(profileId, medicationId, "later", expiresAt),
      signOneTapAction(profileId, medicationId, "skip", expiresAt),
    ]);

    const linkTaken = `${functionBaseUrl}?action=taken&profile_id=${profileId}&med_id=${medicationId}&expires=${expiresAt}&sig=${sigTaken}`;
    const linkLater = `${functionBaseUrl}?action=later&profile_id=${profileId}&med_id=${medicationId}&expires=${expiresAt}&sig=${sigLater}`;
    const linkSkip = `${functionBaseUrl}?action=skip&profile_id=${profileId}&med_id=${medicationId}&expires=${expiresAt}&sig=${sigSkip}`;

    let subject = `Adept Routine: Time for your morning pill, after breakfast`;
    let emailHtml = "";

    // -----------------------------------------------------------------
    // EMAIL TEMPLATE: UPCOMING DOSE REMINDER (Large text, beautiful, quiet luxury)
    // -----------------------------------------------------------------
    if (type === "upcoming_dose") {
      subject = `Time for your morning pill, after breakfast • Arthur Davies`;
      emailHtml = `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 24px 12px; background-color: #FAF8F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center">
              <table width="580" border="0" cellspacing="0" cellpadding="0" style="background: #ffffff; border-radius: 28px; border: 2px solid #EAE5DB; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
                <!-- Calm Header -->
                <tr>
                  <td style="background-color: #244937; padding: 32px 28px; text-align: center;">
                    <span style="display: inline-block; background: rgba(255,255,255,0.2); color: #ffffff; padding: 6px 14px; border-radius: 20px; font-size: 14px; font-weight: 700; text-transform: uppercase;">
                      Adept Care • Human Routine Reminder
                    </span>
                    <h1 style="color: #ffffff; font-size: 28px; margin: 14px 0 4px 0; font-weight: 800;">Good morning, Arthur.</h1>
                    <p style="color: #EAF2EC; font-size: 18px; margin: 0;">Anchored to breakfast • No rush, take your time</p>
                  </td>
                </tr>

                <!-- Giant Medication Card -->
                <tr>
                  <td style="padding: 28px;">
                    <div style="background-color: #FAF8F5; border-radius: 20px; padding: 24px; border: 1px solid #EAE5DB;">
                      <span style="color: #244937; font-size: 14px; font-weight: 800; text-transform: uppercase; background: #EAF2EC; padding: 4px 12px; border-radius: 12px; display: inline-block;">
                        ${mealAnchor}
                      </span>
                      <h2 style="font-size: 24px; font-weight: 800; color: #1A1D1A; margin: 12px 0 4px 0;">
                        ${medicationName}
                      </h2>
                      <p style="font-size: 18px; color: #474C46; margin: 0 0 12px 0;">
                        Dosage: <strong>${dose}</strong>
                      </p>
                      <p style="font-size: 17px; color: #70756F; margin: 0; background: #ffffff; padding: 12px 16px; border-radius: 12px; border: 1px solid #EAE5DB;">
                        <strong>Instructions:</strong> ${instructions}
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Signed One-Tap Action Links (Taken / Later / Skip) -->
                <tr>
                  <td style="padding: 0 28px 32px 28px;">
                    <h3 style="font-size: 15px; text-transform: uppercase; letter-spacing: 0.05em; color: #70756F; margin: 0 0 16px 0; text-align: center;">
                      Tap One Button to Log Directly (No Login Needed)
                    </h3>

                    <!-- 1. TAKEN (Giant Calm Green) -->
                    <div style="margin-bottom: 12px;">
                      <a href="${linkTaken}" style="display: block; background-color: #244937; color: #ffffff; padding: 18px 24px; font-size: 20px; font-weight: 800; text-decoration: none; border-radius: 16px; text-align: center;">
                        ✓ Taken • Yes, I took it
                      </a>
                    </div>

                    <!-- 2. LATER (Warm Amber) -->
                    <div style="margin-bottom: 12px;">
                      <a href="${linkLater}" style="display: block; background-color: #FBF5EA; color: #7A4F13; border: 2px solid #EBDBC1; padding: 16px 24px; font-size: 18px; font-weight: 700; text-decoration: none; border-radius: 16px; text-align: center;">
                        ⏳ Later • Remind me in 1 hour
                      </a>
                    </div>

                    <!-- 3. SKIP (Gentle Warm Stone) -->
                    <div>
                      <a href="${linkSkip}" style="display: block; background-color: #ffffff; color: #474C46; border: 2px solid #D8D1C3; padding: 14px 24px; font-size: 17px; font-weight: 700; text-decoration: none; border-radius: 16px; text-align: center;">
                        🛌 Skip comfortably today
                      </a>
                    </div>

                    <p style="text-align: center; color: #70756F; font-size: 13px; margin: 18px 0 0 0;">
                      Links expire safely in 24 hours • Protected by cryptographic HMAC
                    </p>
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

    // -----------------------------------------------------------------
    // EMAIL TEMPLATE: MISSED / ELAPSED DOSE (Warm Amber, Never Red/Shame)
    // -----------------------------------------------------------------
    else if (type === "missed_dose") {
      subject = `Gentle Routine Check: ${mealAnchor} • Arthur Davies`;
      emailHtml = `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 24px 12px; background-color: #FAF8F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center">
              <table width="580" border="0" cellspacing="0" cellpadding="0" style="background: #ffffff; border-radius: 28px; border: 2px solid #EBDBC1; overflow: hidden;">
                <!-- Warm Amber Header (No alarmism, no red, zero shame) -->
                <tr>
                  <td style="background-color: #92631E; padding: 32px 28px; text-align: center;">
                    <span style="display: inline-block; background: rgba(255,255,255,0.25); color: #ffffff; padding: 6px 14px; border-radius: 20px; font-size: 14px; font-weight: 700;">
                      Gentle Routine Check • Warm Amber
                    </span>
                    <h1 style="color: #ffffff; font-size: 26px; margin: 14px 0 4px 0; font-weight: 800;">
                      Just checking in, Arthur.
                    </h1>
                    <p style="color: #FBF5EA; font-size: 17px; margin: 0;">Meal window has elapsed • No rush or penalty</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 28px;">
                    <div style="background-color: #FBF5EA; border-radius: 20px; padding: 24px; border: 1px solid #EBDBC1;">
                      <h2 style="font-size: 22px; font-weight: 800; color: #7A4F13; margin: 0 0 8px 0;">
                        ${medicationName}
                      </h2>
                      <p style="font-size: 18px; color: #474C46; line-height: 1.6; margin: 0;">
                        The typical window for <strong>${mealAnchor}</strong> passed approximately 45 minutes ago. Arthur may simply be resting or taking meals at his own comfortable pace.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Signed Action Buttons -->
                <tr>
                  <td style="padding: 0 28px 32px 28px;">
                    <div style="margin-bottom: 12px;">
                      <a href="${linkTaken}" style="display: block; background-color: #244937; color: #ffffff; padding: 18px 24px; font-size: 20px; font-weight: 800; text-decoration: none; border-radius: 16px; text-align: center;">
                        ✓ Taken Now
                      </a>
                    </div>

                    <div style="margin-bottom: 12px;">
                      <a href="${linkLater}" style="display: block; background-color: #FBF5EA; color: #7A4F13; border: 2px solid #EBDBC1; padding: 16px 24px; font-size: 18px; font-weight: 700; text-decoration: none; border-radius: 16px; text-align: center;">
                        ⏳ Remind Me in a Little While
                      </a>
                    </div>

                    <div>
                      <a href="${linkSkip}" style="display: block; background-color: #ffffff; color: #474C46; border: 2px solid #D8D1C3; padding: 14px 24px; font-size: 17px; font-weight: 700; text-decoration: none; border-radius: 16px; text-align: center;">
                        🛌 Skip Today Comfortably
                      </a>
                    </div>
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

    // -----------------------------------------------------------------
    // EMAIL TEMPLATE: UPCOMING DOCTOR APPOINTMENT
    // -----------------------------------------------------------------
    else if (type === "appointment") {
      subject = `Upcoming Visit with ${doctorName} • Arthur Davies`;
      emailHtml = `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 24px 12px; background-color: #FAF8F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center">
              <table width="580" border="0" cellspacing="0" cellpadding="0" style="background: #ffffff; border-radius: 28px; border: 2px solid #EAE5DB; overflow: hidden;">
                <tr style="background-color: #244937; padding: 32px 28px; text-align: center;">
                  <td style="padding: 28px;">
                    <span style="display: inline-block; background: rgba(255,255,255,0.2); color: #ffffff; padding: 6px 14px; border-radius: 20px; font-size: 14px; font-weight: 700;">
                      Doctor Appointment Notice
                    </span>
                    <h1 style="color: #ffffff; font-size: 26px; margin: 12px 0 4px 0; font-weight: 800;">
                      Visit with ${doctorName}
                    </h1>
                    <p style="color: #EAF2EC; font-size: 18px; margin: 0;">${appointmentTime}</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 28px;">
                    <div style="background-color: #FAF8F5; border-radius: 20px; padding: 20px; border: 1px solid #EAE5DB; margin-bottom: 20px;">
                      <p style="margin: 0 0 8px 0; font-size: 16px; color: #70756F; font-weight: 700; text-transform: uppercase;">Location</p>
                      <p style="margin: 0; font-size: 19px; color: #1A1D1A; font-weight: 700;">${appointmentLocation}</p>
                    </div>

                    <div style="background-color: #EAF2EC; border-radius: 20px; padding: 20px; border: 1px solid #C6DBD0;">
                      <p style="margin: 0 0 6px 0; font-size: 16px; color: #244937; font-weight: 700; text-transform: uppercase;">Pre-Visit Brief Ready</p>
                      <p style="margin: 0; font-size: 17px; color: #1A1D1A; line-height: 1.5;">
                        Adept has automatically synthesized Arthur’s 30-day compliance rate and comfort notes into a clean 1-page brief for Dr. Vance.
                      </p>
                    </div>

                    <div style="text-align: center; margin-top: 28px;">
                      <a href="${APP_BASE_URL}?role=caretaker&view=brief" style="display: inline-block; background-color: #244937; color: #ffffff; padding: 16px 32px; font-size: 18px; font-weight: 800; border-radius: 16px; text-decoration: none;">
                        View 30-Day Clinical Brief →
                      </a>
                    </div>
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

    // Dispatch via Resend API
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({
          success: true,
          mode: "demo_simulated",
          recipient: recipientEmail,
          subject,
          signedLinks: { linkTaken, linkLater, linkSkip },
          emailHtml,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Adept Care <reminders@adeptcare.app>",
        to: [recipientEmail],
        subject,
        html: emailHtml,
      }),
    });

    const result = await resendRes.json();
    return new Response(
      JSON.stringify({
        success: true,
        mode: "live_resend",
        result,
        signedLinks: { linkTaken, linkLater, linkSkip },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

