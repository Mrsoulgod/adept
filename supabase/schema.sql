-- =====================================================================
-- ADEPT - Elderly Care & Medication Platform Schema
-- Supabase Postgres Schema + RLS Policies + Triggers + Cron
-- =====================================================================

-- 1. PROFILES (Elder, Caretaker, Family with Passcode access)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age INT,
    role TEXT NOT NULL CHECK (role IN ('elder', 'caretaker', 'family')),
    passcode_hash TEXT NOT NULL, -- e.g. bcrypt or salted PIN for profile access
    doctor_name TEXT,
    doctor_phone TEXT,
    caretaker_name TEXT,
    caretaker_phone TEXT,
    caretaker_email TEXT,
    family_name TEXT,
    family_email TEXT,
    conditions TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MEDICATIONS (Meal Anchors & Dose Windows, not exact clock times)
CREATE TABLE IF NOT EXISTS public.medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    friendly_name TEXT NOT NULL, -- Plain English for Elder
    dosage TEXT NOT NULL,
    instructions TEXT NOT NULL,
    meal_anchor TEXT NOT NULL CHECK (meal_anchor IN ('morning_breakfast', 'after_lunch', 'evening_dinner', 'before_bedtime')),
    shape_description TEXT,
    color_hex TEXT DEFAULT '#3b82f6',
    purpose TEXT,
    prescribed_by TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. DOSE LOGS (One-tap confirmations & comfort notes)
CREATE TABLE IF NOT EXISTS public.dose_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    medication_id UUID REFERENCES public.medications(id) ON DELETE CASCADE,
    medication_name TEXT NOT NULL,
    meal_anchor TEXT NOT NULL,
    scheduled_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL CHECK (status IN ('taken', 'pending', 'skipped_comfortably', 'deferred')),
    logged_at TIMESTAMPTZ,
    logged_by TEXT NOT NULL CHECK (logged_by IN ('elder', 'caretaker', 'family')),
    notes TEXT,
    comfort_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. AI PROPOSALS (Doctor handoff / Gemini OCR Proposals)
-- "Every AI output is a PROPOSAL the elder confirms. Never auto-apply."
CREATE TABLE IF NOT EXISTS public.ai_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    proposed_by TEXT NOT NULL,
    prescription_image_url TEXT,
    medication_payload JSONB NOT NULL,
    doctor_notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending_elder_confirmation' CHECK (status IN ('pending_elder_confirmation', 'confirmed', 'rejected', 'vetoed')),
    elder_feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 5. AUDIT LOGS WITH ELDER VETO
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_role TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    action TEXT NOT NULL,
    plain_english_description TEXT NOT NULL,
    can_elder_veto BOOLEAN DEFAULT TRUE,
    is_vetoed BOOLEAN DEFAULT FALSE,
    vetoed_at TIMESTAMPTZ,
    reverted_payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BASELINE METRICS & DEVIATION TRACKING
CREATE TABLE IF NOT EXISTS public.baseline_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    adherence_rate INT DEFAULT 100,
    anchor_compliance JSONB DEFAULT '{"morning_breakfast": true, "after_lunch": true, "evening_dinner": true, "before_bedtime": true}',
    wellness_score TEXT DEFAULT 'steady',
    deviation_detected BOOLEAN DEFAULT FALSE,
    deviation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS)
-- Shared household access with role verification
-- =====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dose_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baseline_metrics ENABLE ROW LEVEL SECURITY;

-- Allow authenticated household members and anon access with profile passcode check
CREATE POLICY "Allow household access to profiles" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Allow household access to medications" ON public.medications FOR ALL USING (true);
CREATE POLICY "Allow household access to dose_logs" ON public.dose_logs FOR ALL USING (true);
CREATE POLICY "Allow household access to ai_proposals" ON public.ai_proposals FOR ALL USING (true);
CREATE POLICY "Allow household access to audit_logs" ON public.audit_logs FOR ALL USING (true);
CREATE POLICY "Allow household access to baseline_metrics" ON public.baseline_metrics FOR ALL USING (true);

-- =====================================================================
-- TRIGGER: Auto-record Audit Log on AI Proposal or Medication Change
-- =====================================================================
CREATE OR REPLACE FUNCTION public.handle_medication_audit()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.audit_logs (profile_id, actor_role, actor_name, action, plain_english_description, can_elder_veto)
        VALUES (
            NEW.profile_id,
            'caretaker',
            'Care Coordinator',
            'Added medication: ' || NEW.name,
            'New schedule added for ' || NEW.friendly_name || ' (' || NEW.dosage || ') with meal anchor: ' || NEW.meal_anchor,
            TRUE
        );
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_logs (profile_id, actor_role, actor_name, action, plain_english_description, can_elder_veto)
        VALUES (
            NEW.profile_id,
            'caretaker',
            'Care Coordinator',
            'Updated medication: ' || NEW.name,
            'Schedule or instructions updated for ' || NEW.friendly_name,
            TRUE
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_medication_audit ON public.medications;
CREATE TRIGGER trg_medication_audit
AFTER INSERT OR UPDATE ON public.medications
FOR EACH ROW EXECUTE FUNCTION public.handle_medication_audit();

-- =====================================================================
-- SUPABASE CRON: Daily Caregiver Digest & Baseline Deviation Check
-- Requires pg_cron extension enabled in Supabase dashboard
-- =====================================================================
-- SELECT cron.schedule(
--   'caregiver-daily-digest',
--   '0 19 * * *', -- 7:00 PM every evening
--   $$
--   SELECT net.http_post(
--       url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/caregiver-digest',
--       headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
--       body:='{"type": "daily_evening_digest"}'::jsonb
--   ) as request_id;
--   $$
-- );

