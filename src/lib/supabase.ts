import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables or fallback local storage
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Local storage key for offline / zero-cost resilience
const LOCAL_STORAGE_KEY = 'adept_platform_data_v1';

export interface AdeptStoredState {
  profile: any;
  medications: any[];
  doseLogs: any[];
  aiProposals: any[];
  auditLogs: any[];
  settings: {
    geminiApiKey?: string;
    resendApiKey?: string;
    supabaseUrl?: string;
    supabaseKey?: string;
  };
}

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

