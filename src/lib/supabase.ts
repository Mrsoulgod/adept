import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables or fallback local storage
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// Local storage keys for persistent elder login & zero-cost resilience
const LOCAL_STORAGE_KEY = 'adept_platform_data_v1';
const ELDER_SESSION_KEY = 'adept_elder_session_active';

export interface AdeptStoredState {
  profile: any;
  members?: any[];
  medications: any[];
  doseLogs: any[];
  aiProposals: any[];
  auditLogs: any[];
  appointments?: any[];
  symptomCheckins?: any[];
  settings: {
    geminiApiKey?: string;
    resendApiKey?: string;
    supabaseUrl?: string;
    supabaseKey?: string;
  };
}

/**
 * AUTH FLOW GUARANTEE:
 * 1. The elder logs in ONCE and stays logged in indefinitely.
 * 2. Passcode verification is only challenged when performing Caretaker/Family edits.
 */
export const isElderSessionActive = (): boolean => {
  return localStorage.getItem(ELDER_SESSION_KEY) === 'true';
};

export const setElderSessionActive = (active: boolean) => {
  if (active) {
    localStorage.setItem(ELDER_SESSION_KEY, 'true');
  } else {
    localStorage.removeItem(ELDER_SESSION_KEY);
  }
};

/**
 * Verify Caretaker / Family PIN before permitting modifications
 */
export const verifyCaretakerPasscode = async (
  profileId: string,
  passcode: string
): Promise<boolean> => {
  // If connected to live Supabase, execute stored procedure
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('verify_member_passcode', {
        p_profile_id: profileId,
        p_role: 'caretaker',
        p_passcode: passcode,
      });
      if (!error && data === true) return true;
    } catch (err) {
      console.warn('Supabase RPC check error, falling back to local PIN check:', err);
    }
  }

  // Local fallback: Sarah's PIN is 2222, Master demo is 9999
  return passcode === '2222' || passcode === '9999';
};

export const loadStoredState = (defaults: {
  profile: any;
  medications: any[];
  doseLogs: any[];
  aiProposals: any[];
  auditLogs: any[];
}): AdeptStoredState => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        profile: parsed.profile || defaults.profile,
        medications: parsed.medications || defaults.medications,
        doseLogs: parsed.doseLogs || defaults.doseLogs,
        aiProposals: parsed.aiProposals || defaults.aiProposals,
        auditLogs: parsed.auditLogs || defaults.auditLogs,
        appointments: parsed.appointments || [],
        symptomCheckins: parsed.symptomCheckins || [],
        settings: parsed.settings || {},
      };
    }
  } catch (e) {
    console.warn('Failed to load local state, using defaults', e);
  }
  return {
    ...defaults,
    settings: {
      geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
      resendApiKey: import.meta.env.VITE_RESEND_API_KEY || '',
    },
  };
};

export const saveStoredState = (state: AdeptStoredState) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save local state', e);
  }
};
