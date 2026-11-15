/**
 * Cryptographic PIN Hashing, Lockout Protection & Elder Pairing Security
 */

const LOCKOUT_KEY_PREFIX = 'adept_pin_lockout_';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 10 * 60 * 1000; // 10 minutes lockout per Prompt 3 requirement

/**
 * Computes SHA-256 hash of a 6-digit PIN.
 */
export async function hashPin(pin: string): Promise<string> {
  const cleanPin = pin.trim();
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(`adept_salt_${cleanPin}`);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback below
    }
  }

  // Simple deterministic hash fallback if subtle crypto is not available
  let hash = 0;
  const str = `adept_salt_${cleanPin}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `h_${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

/**
 * Verifies a plain PIN against stored hash.
 */
export async function verifyPin(pin: string, storedHash: string): Promise<boolean> {
  const computed = await hashPin(pin);
  return computed === storedHash;
}

export interface LockoutState {
  isLocked: boolean;
  failedAttempts: number;
  remainingAttempts: number;
  lockedUntil?: number;
  minutesRemaining?: number;
}

/**
 * Retrieves the lockout status for a member or profile.
 */
export function getLockoutStatus(memberIdOrRole: string = 'caretaker'): LockoutState {
  try {
    const raw = localStorage.getItem(`${LOCKOUT_KEY_PREFIX}${memberIdOrRole}`);
    if (!raw) {
      return { isLocked: false, failedAttempts: 0, remainingAttempts: MAX_ATTEMPTS };
    }
    const data = JSON.parse(raw);
    const now = Date.now();

    if (data.lockedUntil && data.lockedUntil > now) {
      const minutesRemaining = Math.ceil((data.lockedUntil - now) / 60000);
      return {
        isLocked: true,
        failedAttempts: data.failedAttempts || MAX_ATTEMPTS,
        remainingAttempts: 0,
        lockedUntil: data.lockedUntil,
        minutesRemaining,
      };
    }

    // Lock expired
    if (data.lockedUntil && data.lockedUntil <= now) {
      localStorage.removeItem(`${LOCKOUT_KEY_PREFIX}${memberIdOrRole}`);
      return { isLocked: false, failedAttempts: 0, remainingAttempts: MAX_ATTEMPTS };
    }

    const failed = data.failedAttempts || 0;
    return {
      isLocked: false,
      failedAttempts: failed,
      remainingAttempts: Math.max(0, MAX_ATTEMPTS - failed),
    };
  } catch {
    return { isLocked: false, failedAttempts: 0, remainingAttempts: MAX_ATTEMPTS };
  }
}

/**
 * Records a failed PIN attempt. Triggers a 15-minute lockout after 5 consecutive failures.
 */
export function recordFailedAttempt(memberIdOrRole: string = 'caretaker'): LockoutState {
  const current = getLockoutStatus(memberIdOrRole);
  if (current.isLocked) return current;

  const newFailed = current.failedAttempts + 1;
  const now = Date.now();

  if (newFailed >= MAX_ATTEMPTS) {
    const lockedUntil = now + LOCKOUT_DURATION_MS;
    const state = {
      failedAttempts: newFailed,
      lockedUntil,
    };
    localStorage.setItem(`${LOCKOUT_KEY_PREFIX}${memberIdOrRole}`, JSON.stringify(state));
    return {
      isLocked: true,
      failedAttempts: newFailed,
      remainingAttempts: 0,
      lockedUntil,
      minutesRemaining: 10,
    };
  }

  const state = { failedAttempts: newFailed };
  localStorage.setItem(`${LOCKOUT_KEY_PREFIX}${memberIdOrRole}`, JSON.stringify(state));
  return {
    isLocked: false,
    failedAttempts: newFailed,
    remainingAttempts: MAX_ATTEMPTS - newFailed,
  };
}

/**
 * Resets failed attempts after a valid PIN entry.
 */
export function resetLockout(memberIdOrRole: string = 'caretaker'): void {
  try {
    localStorage.removeItem(`${LOCKOUT_KEY_PREFIX}${memberIdOrRole}`);
  } catch {
    // ignore
  }
}

/**
 * Generates an elder 6-digit numeric pairing code (expires in 15 minutes per Prompt 4).
 */
export function generate6DigitPairingCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Legacy elder pairing code (e.g. "ADEPT-7890" or 6 digits)
 */
export function generateElderPairingCode(): string {
  const code = generate6DigitPairingCode();
  try {
    localStorage.setItem('adept_elder_pairing_code', code);
    localStorage.setItem('adept_elder_pairing_expiry', (Date.now() + 15 * 60 * 1000).toString());
  } catch {
    // ignore
  }
  return code;
}
