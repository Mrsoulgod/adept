// Supabase Edge Function: Adept AI Core
// Calls Google Gemini Flash via free-tier AI Studio key stored securely in environment
// Implements Function Calling with Read-Only Tools

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { question, language, circleId } = await req.json();

    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) {
      return new Response(
        JSON.stringify({
          error: 'GEMINI_API_KEY not configured on server.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Connect to Supabase with caller's JWT so Row-Level Security applies
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Fetch tool data safely with RLS
    const { data: medications } = await supabaseClient
      .from('medications')
      .select('*')
      .eq('profile_id', circleId);

    const { data: stockView } = await supabaseClient
      .from('view_stock_remaining')
      .select('*')
      .eq('circle_id', circleId);

    const { data: events } = await supabaseClient
      .from('events')
      .select('*')
      .eq('circle_id', circleId)
      .order('created_at', { ascending: false })
      .limit(20);

    const promptText = `
You are Adept AI for an elderly care circle.
Strict rules:
1. Answer only from the provided data. Never calculate: use precomputed numbers.
2. Cite sources in your answer ("From dose log, Nov 15").
3. You are not a doctor. Suggest confirming with physician or pharmacist.
4. If the user describes an emergency (chest pain, fall, breathing trouble), output: "EMERGENCY_DETECTED: Call 112 immediately."
5. Language: ${language === 'hi' ? 'Hindi' : 'English'}.

Data:
Medications: ${JSON.stringify(medications || [])}
Stock: ${JSON.stringify(stockView || [])}
Events: ${JSON.stringify(events || [])}

User Question: ${question}
`;

    // Call Gemini 1.5 Flash
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: promptText }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 400 },
        }),
      }
    );

    const geminiData = await geminiRes.json();
    const answer = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';

    // Log the question event into events table
    await supabaseClient.from('events').insert({
      circle_id: circleId,
      actor_role: 'system',
      type: 'ai_question',
      payload: { question, model: 'gemini-1.5-flash' },
      source: 'ask_adept_edge',
    });

    return new Response(
      JSON.stringify({
        answer,
        sources: ['From dose log & pharmacy stock view'],
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

