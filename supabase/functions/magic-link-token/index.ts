// Supabase Edge Function: Magic Link Token Generator & Authenticator
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  try {
    const { profileId, role, action, email } = await req.json();
    
    // Generate a secure one-tap token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    
    // In production, save to a magic_tokens table with Supabase client
    const appBaseUrl = Deno.env.get("APP_BASE_URL") || "https://adept-care.app";
    const magicUrl = `${appBaseUrl}?token=${token}&profile=${profileId}&role=${role}&action=${action || 'view'}`;

    return new Response(JSON.stringify({
      success: true,
      token,
      expiresAt,
      magicUrl,
      role,
      recipient: email
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});

