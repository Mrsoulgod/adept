import { supabase, isSupabaseConfigured } from './supabase';
import type { Role } from './types';
import { hashPin, verifyPin, getLockoutStatus, recordFailedAttempt, resetLockout, generateElderPairingCode } from './authSecurity';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  isOwner: boolean;
  createdAt: string;
}

const LOCAL_AUTH_USER_KEY = 'adept_auth_user';
const ONBOARDING_COMPLETED_KEY = 'adept_onboarding_completed';
const ELDER_PAIRING_CODE_KEY = 'adept_elder_pairing_code';
const ELDER_SESSION_KEY = 'adept_elder_session_active';
const CARETAKER_PIN_HASH_KEY = 'adept_caretaker_pin_hash';

/**
 * Checks if elder tablet/device session is active.
 * The elder enters the pairing code once and stays logged in indefinitely.
 */
export function isElderDevicePaired(): boolean {
  try {
    return localStorage.getItem(ELDER_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Pairs elder device with the household pairing code.
 */
export function pairElderDeviceWithCode(code: string): boolean {
  const cleanCode = code.trim().toUpperCase();
  const storedCode = getElderPairingCode();

  // Accept the stored pairing code or any valid ADEPT-XXXX format
  if (cleanCode === storedCode || cleanCode.startsWith('ADEPT-')) {
    localStorage.setItem(ELDER_SESSION_KEY, 'true');
    localStorage.setItem(ELDER_PAIRING_CODE_KEY, cleanCode);
    return true;
  }
  return false;
}

/**
 * Unpairs the elder device.
 */
export function unpairElderDevice(): void {
  try {
    localStorage.removeItem(ELDER_SESSION_KEY);
  } catch {
    // ignore
  }
}

/**
 * Returns the active elder pairing code (e.g. "ADEPT-7890").
 */
export function getElderPairingCode(): string {
  try {
    const existing = localStorage.getItem(ELDER_PAIRING_CODE_KEY);
    if (existing) return existing;
    const generated = generateElderPairingCode();
    localStorage.setItem(ELDER_PAIRING_CODE_KEY, generated);
    return generated;
  } catch {
    return 'ADEPT-7890';
  }
}

/**
 * Checks if initial household onboarding has been completed by Family Owner.
 */
export function isOnboardingCompleted(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setOnboardingCompleted(completed: boolean): void {
  try {
    if (completed) {
      localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    } else {
      localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
    }
  } catch {
    // ignore
  }
}

/**
 * Retrieves the current authenticated user (Family Owner or Caretaker).
 */
export function getCurrentAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(LOCAL_AUTH_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Real Supabase Sign Up.
 * First user = Family owner.
 */
export async function signUpUser(
  email: string,
  password: string,
  name: string
): Promise<{ user: AuthUser | null; error: string | null }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim() || 'Family Member';

    // 1. Live Supabase Auth if configured
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            role: 'family',
            is_family_owner: true,
          },
        },
      });

      if (error) {
        return { user: null, error: error.message };
      }

      const authUser: AuthUser = {
        id: data.user?.id || `usr-${Date.now()}`,
        email: cleanEmail,
        name: cleanName,
        role: 'family',
        isOwner: true,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify(authUser));
      return { user: authUser, error: null };
    }

    // 2. Offline / Resilient Local Auth Fallback
    const authUser: AuthUser = {
      id: `usr-${Date.now()}`,
      email: cleanEmail,
      name: cleanName,
      role: 'family',
      isOwner: true,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify(authUser));
    return { user: authUser, error: null };
  } catch (err: any) {
    return { user: null, error: err?.message || 'Failed to sign up.' };
  }
}

/**
 * Real Supabase Sign In.
 */
export async function signInUser(
  email: string,
  password: string
): Promise<{ user: AuthUser | null; error: string | null }> {
  try {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Live Supabase Auth if configured
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        return { user: null, error: error.message };
      }

      const authUser: AuthUser = {
        id: data.user?.id || `usr-${Date.now()}`,
        email: cleanEmail,
        name: (data.user?.user_metadata?.full_name as string) || 'Family Coordinator',
        role: 'family',
        isOwner: true,
        createdAt: data.user?.created_at || new Date().toISOString(),
      };
      localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify(authUser));
      return { user: authUser, error: null };
    }

    // 2. Offline / Demo fallback
    if (!password || password.length < 4) {
      return { user: null, error: 'Password must be at least 4 characters.' };
    }

    const authUser: AuthUser = {
      id: `usr-${Date.now()}`,
      email: cleanEmail,
      name: cleanEmail.includes('sarah') ? 'Sarah Davies' : 'James Davies',
      role: cleanEmail.includes('sarah') ? 'caretaker' : 'family',
      isOwner: true,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify(authUser));
    return { user: authUser, error: null };
  } catch (err: any) {
    return { user: null, error: err?.message || 'Sign in failed.' };
  }
}

/**
 * Sign out user.
 */
export async function signOutUser(): Promise<void> {
  try {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(LOCAL_AUTH_USER_KEY);
  } catch {
    localStorage.removeItem(LOCAL_AUTH_USER_KEY);
  }
}

/**
 * Store Caretaker hashed PIN in persistent security state.
 */
export async function setCaretakerHashedPin(pin: string): Promise<string> {
  const hash = await hashPin(pin);
  localStorage.setItem(CARETAKER_PIN_HASH_KEY, hash);
  return hash;
}

export function getCaretakerHashedPin(): string | null {
  try {
    return localStorage.getItem(CARETAKER_PIN_HASH_KEY);
  } catch {
    return null;
  }
}

/**
 * Validates Caretaker 6-digit PIN with 5-attempt lockout defense.
 */
export async function authenticateCaretakerPin(pin: string): Promise<{
  success: boolean;
  isLocked: boolean;
  remainingAttempts: number;
  minutesRemaining?: number;
  error?: string;
}> {
  const lockout = getLockoutStatus('caretaker');
  if (lockout.isLocked) {
    return {
      success: false,
      isLocked: true,
      remainingAttempts: 0,
      minutesRemaining: lockout.minutesRemaining,
      error: `Security Lockout: 5 failed attempts. Please wait ${lockout.minutesRemaining} minutes before trying again.`,
    };
  }

  const storedHash = getCaretakerHashedPin();
  let isValid = false;

  if (storedHash) {
    isValid = await verifyPin(pin, storedHash);
  } else {
    // Default fallback demo pins
    isValid = pin === '2222' || pin === '246810' || pin === '9999';
  }

  if (isValid) {
    resetLockout('caretaker');
    return {
      success: true,
      isLocked: false,
      remainingAttempts: 5,
    };
  }

  const updatedLockout = recordFailedAttempt('caretaker');
  if (updatedLockout.isLocked) {
    return {
      success: false,
      isLocked: true,
      remainingAttempts: 0,
      minutesRemaining: updatedLockout.minutesRemaining,
      error: `Account locked for 15 minutes due to 5 incorrect attempts.`,
    };
  }

  return {
    success: false,
    isLocked: false,
    remainingAttempts: updatedLockout.remainingAttempts,
    error: `Incorrect PIN. ${updatedLockout.remainingAttempts} attempts remaining before a 15-minute lockout.`,
  };
}
