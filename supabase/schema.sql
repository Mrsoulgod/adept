-- =====================================================================
-- ADEPT: Elderly Care & Medication Platform
-- Production PostgreSQL Database Schema + Row-Level Security (RLS)
-- Auth Flow: Persistent Elder Login + Passcode-Gated Caretaker/Family Edits
-- =====================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clean previous definitions if needed
DROP TABLE IF EXISTS public.audit_log CASCADE;
DROP TABLE IF EXISTS public.symptom_checkins CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.dose_logs CASCADE;
DROP TABLE IF EXISTS public.medications CASCADE;
DROP TABLE IF EXISTS public.members CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ---------------------------------------------------------------------
-- 1. PROFILES (Household / Care Circle / Elder Anchor)
-- ---------------------------------------------------------------------
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    age INT NOT NULL,
    photo_url TEXT,
    language TEXT DEFAULT 'en' CHECK (language IN ('en', 'hi')),
    wake_time TIME DEFAULT '07:00',
    breakfast_time TIME DEFAULT '08:30',
    lunch_time TIME DEFAULT '13:00',
    dinner_time TIME DEFAULT '19:30',
    sleep_time TIME DEFAULT '22:00',
    doctor_name TEXT NOT NULL,
    doctor_phone TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    household_passcode_hash TEXT NOT NULL DEFAULT 'default_hash', -- Used for legacy passcode
    conditions TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 2. MEMBERS (Roles: elder, caretaker, family)
-- ---------------------------------------------------------------------
CREATE TABLE public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    role TEXT NOT NULL CHECK (role IN ('elder', 'caretaker', 'family')),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    passcode_hash TEXT NOT NULL DEFAULT 'default_hash', -- PIN (hashed SHA-256 for caretaker)
    permission TEXT DEFAULT 'can_edit' CHECK (permission IN ('view_only', 'can_edit')),
    is_primary BOOLEAN DEFAULT FALSE,
    tour_completed BOOLEAN DEFAULT FALSE,
    failed_pin_attempts INT DEFAULT 0,
    pin_locked_until TIMESTAMPTZ,
    invite_token TEXT UNIQUE,
    invite_status TEXT DEFAULT 'accepted' CHECK (invite_status IN ('pending', 'accepted')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 2b. ELDER PAIRING CODES (6-digit numeric, 15-min expiry, anonymous claim)
-- ---------------------------------------------------------------------
CREATE TABLE public.elder_pairing_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
    claimed_by_anon_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    claimed_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    device_name TEXT DEFAULT 'Elder Device',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 3. MEDICATIONS (Windows, meal anchors, stock, and source)
-- ---------------------------------------------------------------------
CREATE TABLE public.medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    dose TEXT NOT NULL,
    meal_anchor TEXT NOT NULL CHECK (meal_anchor IN ('morning_breakfast', 'after_lunch', 'evening_dinner', 'before_bedtime')),
    window_start TIME NOT NULL,
    window_end TIME NOT NULL,
    stock_count INT NOT NULL DEFAULT 30,
    source TEXT NOT NULL CHECK (source IN ('doctor_rx_ocr', 'caretaker_manual', 'ai_proposal')),
    friendly_name TEXT,            -- Plain English for Elder (e.g., 'Morning Blood Pressure Pill')
    instructions TEXT,             -- e.g., '1 tablet with breakfast toast'
    shape_description TEXT,        -- e.g., 'Small round white tablet'
    color_hex TEXT DEFAULT '#244937',
    purpose TEXT,                  -- Reassuring reason
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 4. DOSE LOGS (One-tap confirmations, meal anchors, comfort notes)
-- ---------------------------------------------------------------------
CREATE TABLE public.dose_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('taken', 'deferred', 'skipped_comfortably')),
    meal_anchor TEXT NOT NULL,
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    logged_by_member_id UUID REFERENCES public.members(id),
    notes TEXT,
    comfort_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 5. APPOINTMENTS (Doctor visits, locations, and pre-visit briefs)
-- ---------------------------------------------------------------------
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    doctor_name TEXT NOT NULL,
    doctor_phone TEXT,
    location TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    notes TEXT,
    pre_visit_brief_json JSONB,    -- 30-day compliance summary generated by Gemini
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'rescheduled', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 6. SYMPTOM CHECKINS (Gentle elder comfort scoring)
-- ---------------------------------------------------------------------
CREATE TABLE public.symptom_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    wellness_score TEXT NOT NULL CHECK (wellness_score IN ('great', 'steady', 'tired', 'discomfort')),
    meal_anchor TEXT NOT NULL,
    notes TEXT,
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 7. AUDIT LOG WITH ELDER VETO (Transparency and ultimate elder control)
-- ---------------------------------------------------------------------
CREATE TABLE public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_member_id UUID REFERENCES public.members(id),
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    description TEXT NOT NULL,
    can_elder_veto BOOLEAN DEFAULT TRUE,
    is_vetoed BOOLEAN DEFAULT FALSE,
    vetoed_at TIMESTAMPTZ,
    reverted_payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Rule: The Elder logs in ONCE and stays logged in.
--       Passcode verification is strictly required for Caretaker / Family edits.
-- =====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dose_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptom_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- 1. READ ACCESS: Permitted for household profile (Elder never gets locked out)
CREATE POLICY "Household read access on profiles"
    ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Household read access on members"
    ON public.members FOR SELECT USING (true);

CREATE POLICY "Household read access on medications"
    ON public.medications FOR SELECT USING (true);

CREATE POLICY "Household read access on dose_logs"
    ON public.dose_logs FOR SELECT USING (true);

CREATE POLICY "Household read access on appointments"
    ON public.appointments FOR SELECT USING (true);

CREATE POLICY "Household read access on symptom_checkins"
    ON public.symptom_checkins FOR SELECT USING (true);

CREATE POLICY "Household read access on audit_log"
    ON public.audit_log FOR SELECT USING (true);

-- 2. ELDER WRITE ACCESS (Zero Passcode Friction):
-- The elder can confirm doses, log comfort notes, and exercise veto at any time
CREATE POLICY "Elder one-tap dose logging"
    ON public.dose_logs FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Elder one-tap symptom logging"
    ON public.symptom_checkins FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Elder veto update on audit_log"
    ON public.audit_log FOR UPDATE
    USING (can_elder_veto = true)
    WITH CHECK (is_vetoed = true);

-- 3. CARETAKER / FAMILY EDITS:
-- Secured via Postgres functions that verify the member's passcode hash

-- =====================================================================
-- STORED PROCEDURES & AUTH FLOW FUNCTIONS
-- =====================================================================

-- A. Verify Member Passcode & 10-Minute Lockout Defense
CREATE OR REPLACE FUNCTION public.verify_member_passcode(
    p_profile_id UUID,
    p_role TEXT,
    p_passcode TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_match BOOLEAN;
    v_locked_until TIMESTAMPTZ;
    v_failed_attempts INT;
BEGIN
    SELECT pin_locked_until, failed_pin_attempts,
           (passcode_hash = crypt(p_passcode, passcode_hash) OR passcode_hash = p_passcode)
    INTO v_locked_until, v_failed_attempts, v_match
    FROM public.members
    WHERE profile_id = p_profile_id
      AND role = p_role
    LIMIT 1;

    -- Check if locked out
    IF v_locked_until IS NOT NULL AND v_locked_until > NOW() THEN
        RAISE EXCEPTION 'Security Lockout: Account locked for 10 minutes due to 5 failed attempts.';
    END IF;

    IF v_match = TRUE THEN
        -- Reset failed attempts on success
        UPDATE public.members
        SET failed_pin_attempts = 0, pin_locked_until = NULL
        WHERE profile_id = p_profile_id AND role = p_role;
        RETURN TRUE;
    ELSE
        -- Increment failure count, trigger 10-min lockout after 5 fails
        UPDATE public.members
        SET failed_pin_attempts = COALESCE(failed_pin_attempts, 0) + 1,
            pin_locked_until = CASE WHEN COALESCE(failed_pin_attempts, 0) + 1 >= 5 THEN NOW() + INTERVAL '10 minutes' ELSE NULL END
        WHERE profile_id = p_profile_id AND role = p_role;
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- A2. Claim Elder Device using 6-Digit Pairing Code (Anonymous Supabase Auth)
CREATE OR REPLACE FUNCTION public.claim_elder_device(
    p_code TEXT,
    p_device_name TEXT DEFAULT 'Elder Device'
)
RETURNS JSONB AS $$
DECLARE
    v_code_rec RECORD;
    v_elder_member RECORD;
BEGIN
    -- Verify code exists, not expired, not revoked
    SELECT * INTO v_code_rec
    FROM public.elder_pairing_codes
    WHERE code = p_code
      AND expires_at > NOW()
      AND revoked_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_code_rec.id IS NULL THEN
        RAISE EXCEPTION 'Invalid or expired pairing code. Please generate a new code from Family settings.';
    END IF;

    -- Claim for current anonymous auth user
    UPDATE public.elder_pairing_codes
    SET claimed_by_anon_user_id = auth.uid(),
        claimed_at = NOW(),
        device_name = COALESCE(p_device_name, 'Elder Tablet')
    WHERE id = v_code_rec.id;

    -- Retrieve elder member record
    SELECT * INTO v_elder_member
    FROM public.members
    WHERE profile_id = v_code_rec.profile_id
      AND role = 'elder'
    LIMIT 1;

    RETURN jsonb_build_object(
        'success', true,
        'profile_id', v_code_rec.profile_id,
        'elder_member_id', v_elder_member.id,
        'elder_name', v_elder_member.name,
        'device_name', v_code_rec.device_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- A3. Revoke Elder Device (Family can revoke devices from Settings)
CREATE OR REPLACE FUNCTION public.revoke_elder_device(
    p_device_id UUID
)
RETURNS JSONB AS $$
BEGIN
    UPDATE public.elder_pairing_codes
    SET revoked_at = NOW()
    WHERE id = p_device_id;

    RETURN jsonb_build_object('success', true, 'revoked_id', p_device_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B. Caretaker Safe Add/Edit Medication (Gated by Caretaker PIN)
CREATE OR REPLACE FUNCTION public.caretaker_save_medication(
    p_profile_id UUID,
    p_passcode TEXT,
    p_medication JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_authorized BOOLEAN;
    v_med_id UUID;
BEGIN
    -- Verify caretaker passcode
    v_authorized := public.verify_member_passcode(p_profile_id, 'caretaker', p_passcode);
    IF NOT v_authorized THEN
        RAISE EXCEPTION 'Unauthorized: Invalid caretaker passcode.';
    END IF;

    -- Upsert medication
    IF (p_medication->>'id') IS NOT NULL AND (p_medication->>'id') <> '' THEN
        UPDATE public.medications
        SET name = p_medication->>'name',
            dose = p_medication->>'dose',
            meal_anchor = p_medication->>'meal_anchor',
            window_start = (p_medication->>'window_start')::TIME,
            window_end = (p_medication->>'window_end')::TIME,
            stock_count = COALESCE((p_medication->>'stock_count')::INT, stock_count),
            source = p_medication->>'source',
            friendly_name = p_medication->>'friendly_name',
            instructions = p_medication->>'instructions',
            shape_description = p_medication->>'shape_description',
            purpose = p_medication->>'purpose',
            updated_at = NOW()
        WHERE id = (p_medication->>'id')::UUID AND profile_id = p_profile_id
        RETURNING id INTO v_med_id;

        -- Record Audit Log with Elder Veto capability
        INSERT INTO public.audit_log (profile_id, actor_role, action, description, can_elder_veto, reverted_payload)
        VALUES (
            p_profile_id,
            'caretaker',
            'Updated Medication: ' || (p_medication->>'friendly_name'),
            'Caretaker updated dosage/window for ' || (p_medication->>'name') || ' (' || (p_medication->>'dose') || ').',
            TRUE,
            p_medication
        );
    ELSE
        INSERT INTO public.medications (
            profile_id, name, dose, meal_anchor, window_start, window_end, stock_count, source,
            friendly_name, instructions, shape_description, purpose
        ) VALUES (
            p_profile_id,
            p_medication->>'name',
            p_medication->>'dose',
            p_medication->>'meal_anchor',
            (p_medication->>'window_start')::TIME,
            (p_medication->>'window_end')::TIME,
            COALESCE((p_medication->>'stock_count')::INT, 30),
            p_medication->>'source',
            p_medication->>'friendly_name',
            p_medication->>'instructions',
            p_medication->>'shape_description',
            p_medication->>'purpose'
        )
        RETURNING id INTO v_med_id;

        -- Record Audit Log with Elder Veto capability
        INSERT INTO public.audit_log (profile_id, actor_role, action, description, can_elder_veto, reverted_payload)
        VALUES (
            p_profile_id,
            'caretaker',
            'Added Medication: ' || (p_medication->>'friendly_name'),
            'New schedule added for ' || (p_medication->>'name') || ' (' || (p_medication->>'dose') || ') anchored to ' || (p_medication->>'meal_anchor') || '.',
            TRUE,
            jsonb_build_object('medication_id', v_med_id)
        );
    END IF;

    RETURN jsonb_build_object('success', true, 'medication_id', v_med_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- C. Elder Veto Execution (Reverts an action immediately without passwords)
CREATE OR REPLACE FUNCTION public.elder_exercise_veto(
    p_profile_id UUID,
    p_audit_log_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_log RECORD;
BEGIN
    SELECT * INTO v_log
    FROM public.audit_log
    WHERE id = p_audit_log_id AND profile_id = p_profile_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Audit log entry not found.';
    END IF;

    IF v_log.is_vetoed THEN
        RETURN jsonb_build_object('success', false, 'message', 'Action has already been vetoed.');
    END IF;

    -- Mark log as vetoed
    UPDATE public.audit_log
    SET is_vetoed = TRUE,
        vetoed_at = NOW()
    WHERE id = p_audit_log_id;

    -- Revert medication if applicable
    IF (v_log.reverted_payload->>'medication_id') IS NOT NULL THEN
        UPDATE public.medications
        SET is_active = FALSE
        WHERE id = (v_log.reverted_payload->>'medication_id')::UUID;
    END IF;

    -- Log veto declaration
    INSERT INTO public.audit_log (profile_id, actor_role, action, description, can_elder_veto, is_vetoed)
    VALUES (
        p_profile_id,
        'elder',
        'VETOED: ' || v_log.action,
        'Arthur exercised his Elder Veto authority on: ' || v_log.action || '. Action reverted.',
        FALSE,
        FALSE
    );

    RETURN jsonb_build_object('success', true, 'reverted_action', v_log.action);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- SEED DATA: Arthur Davies Household Profile
-- =====================================================================
DO $$
DECLARE
    v_profile_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID;
    v_med1_id UUID;
    v_med2_id UUID;
    v_med3_id UUID;
    v_med4_id UUID;
BEGIN
    -- 1. Insert Profile
    INSERT INTO public.profiles (
        id, name, age, doctor_name, doctor_phone, household_passcode_hash, conditions
    ) VALUES (
        v_profile_id,
        'Arthur Davies',
        78,
        'Dr. Evelyn Vance',
        '(555) 234-8901',
        crypt('1111', gen_salt('bf')),
        ARRAY['Mild Hypertension', 'Type 2 Blood Sugar', 'Knee Joint Stiffness']
    ) ON CONFLICT (id) DO NOTHING;

    -- 2. Insert Members (Elder '1111', Caretaker '2222', Family '3333')
    INSERT INTO public.members (profile_id, role, name, email, phone, passcode_hash, is_primary)
    VALUES
        (v_profile_id, 'elder', 'Arthur Davies', 'arthur@adeptcare.app', '(555) 123-4567', crypt('1111', gen_salt('bf')), TRUE),
        (v_profile_id, 'caretaker', 'Sarah Davies (Daughter)', 'sarah.care@example.com', '(555) 345-6789', crypt('2222', gen_salt('bf')), TRUE),
        (v_profile_id, 'family', 'James Davies (Son)', 'james.family@example.com', '(555) 789-0123', crypt('3333', gen_salt('bf')), FALSE)
    ON CONFLICT DO NOTHING;

    -- 3. Insert Medications anchored to meals and windows
    INSERT INTO public.medications (
        profile_id, name, dose, meal_anchor, window_start, window_end, stock_count, source,
        friendly_name, instructions, shape_description, color_hex, purpose
    ) VALUES
        (v_profile_id, 'Amlodipine', '5 mg', 'morning_breakfast', '07:00'::TIME, '10:00'::TIME, 28, 'doctor_rx_ocr',
         'Morning Blood Pressure Pill', '1 tablet with breakfast and warm water', 'Small round white tablet', '#244937', 'Keeps your blood pressure steady'),
        (v_profile_id, 'Metformin', '500 mg', 'morning_breakfast', '07:00'::TIME, '10:00'::TIME, 34, 'doctor_rx_ocr',
         'Morning Sugar Balance Tablet', '1 tablet with breakfast toast', 'White oval tablet with scored line', '#10b981', 'Helps keep morning blood sugar balanced smoothly'),
        (v_profile_id, 'Glucosamine Complex', '1000 mg', 'after_lunch', '12:00'::TIME, '14:30'::TIME, 22, 'caretaker_manual',
         'Midday Joint Comfort Capsule', '1 amber capsule after midday meal', 'Amber gel capsule', '#92631E', 'Supports comfortable walking and knee ease'),
        (v_profile_id, 'Atorvastatin', '20 mg', 'evening_dinner', '18:00'::TIME, '20:30'::TIME, 30, 'doctor_rx_ocr',
         'Evening Heart Shield Tablet', '1 pale yellow round tablet with dinner', 'Pale yellow round tablet', '#8b5cf6', 'Protects heart and circulation while you rest')
    RETURNING id INTO v_med1_id;

    -- 4. Insert Audit Log with Elder Veto
    INSERT INTO public.audit_log (profile_id, actor_role, action, description, can_elder_veto, is_vetoed)
    VALUES
        (v_profile_id, 'caretaker', 'Scanned Dr. Vance Prescription (Gemini OCR)', 'Processed paper prescription for Vitamin D3 (1,000 IU). Created AI proposal for Arthur to approve.', TRUE, FALSE),
        (v_profile_id, 'elder', 'Confirmed Morning Routine', 'Arthur confirmed taking morning blood pressure and sugar balance tablets with breakfast.', FALSE, FALSE),
        (v_profile_id, 'caretaker', 'Relaxed Dinner Window to 6:00 – 8:30 PM', 'Extended evening dinner window by 30 minutes for comfortable unhurried meals.', TRUE, FALSE);

    -- 5. Insert Doctor Appointment
    INSERT INTO public.appointments (profile_id, doctor_name, doctor_phone, location, scheduled_at, notes, status)
    VALUES (
        v_profile_id,
        'Dr. Evelyn Vance',
        '(555) 234-8901',
        'St. Jude Geriatric Clinic, Suite 400',
        NOW() + INTERVAL '7 days',
        'Routine quarterly wellness visit and blood pressure review. Pre-visit brief prepared.',
        'scheduled'
    );
END $$;

-- =====================================================================
-- SUPABASE CRON: Scheduled Reminders via Resend
-- =====================================================================
-- Enable pg_cron and pg_net extensions in Supabase
-- CREATE EXTENSION IF NOT EXISTS "pg_cron";
-- CREATE EXTENSION IF NOT EXISTS "pg_net";

-- 1. Morning Breakfast Dose Reminder (7:30 AM Daily)
-- SELECT cron.schedule(
--     'adept-morning-breakfast-dose',
--     '30 7 * * *',
--     $$
--     SELECT net.http_post(
--         url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/schedule-reminders',
--         headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
--         body:='{"type": "upcoming_dose", "mealAnchor": "Morning with breakfast (7:00 – 10:00 AM)"}'::jsonb
--     );
--     $$
-- );

-- 2. Lunch Dose Reminder (12:30 PM Daily)
-- SELECT cron.schedule(
--     'adept-lunch-dose',
--     '30 12 * * *',
--     $$
--     SELECT net.http_post(
--         url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/schedule-reminders',
--         headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
--         body:='{"type": "upcoming_dose", "mealAnchor": "Midday after lunch (12:00 – 2:30 PM)"}'::jsonb
--     );
--     $$
-- );

-- 3. Evening Dinner Dose Reminder (6:30 PM Daily)
-- SELECT cron.schedule(
--     'adept-evening-dinner-dose',
--     '30 18 * * *',
--     $$
--     SELECT net.http_post(
--         url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/schedule-reminders',
--         headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
--         body:='{"type": "upcoming_dose", "mealAnchor": "Evening with dinner (6:00 – 8:30 PM)"}'::jsonb
--     );
--     $$
-- );

-- 4. Gentle Missed-Window Baseline Check (Warm Amber, 10:45 AM & 3:00 PM Daily)
-- SELECT cron.schedule(
--     'adept-missed-window-check',
--     '45 10 * * *',
--     $$
--     SELECT net.http_post(
--         url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/schedule-reminders',
--         headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
--         body:='{"type": "missed_dose", "mealAnchor": "Morning with breakfast"}'::jsonb
--     );
--     $$
-- );

-- 5. Upcoming Doctor Appointment Notice (8:00 AM Daily)
-- SELECT cron.schedule(
--     'adept-appointment-reminder',
--     '0 8 * * *',
--     $$
--     SELECT net.http_post(
--         url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/schedule-reminders',
--         headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
--         body:='{"type": "appointment"}'::jsonb
--     );
--     $$
-- );
