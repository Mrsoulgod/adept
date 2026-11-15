import { describe, it, expect, beforeEach } from 'vitest';
import {
  hashPin,
  verifyPin,
  getLockoutStatus,
  recordFailedAttempt,
  resetLockout,
  generate6DigitPairingCode,
} from '../src/lib/authSecurity';
import {
  generateNewElderPairingCode,
  getActivePairingCodeMeta,
  verifyElderPairingCode,
  isElderDevicePaired,
  pairElderDeviceWithCode,
} from '../src/lib/authService';

describe('Auth & Security Suite - Prompts 1, 3, 4', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Caretaker 6-Digit PIN & Hashing Security (Prompt 3)', () => {
    it('1. Computes deterministic SHA-256 / cryptographic hash for a 6-digit PIN', async () => {
      const pin = '246810';
      const hash1 = await hashPin(pin);
      const hash2 = await hashPin(pin);
      expect(hash1).toBeDefined();
      expect(hash1.length).toBeGreaterThanOrEqual(8);
      expect(hash1).toBe(hash2);
    });

    it('2. Produces completely distinct hashes for different PIN inputs', async () => {
      const hashA = await hashPin('111111');
      const hashB = await hashPin('222222');
      expect(hashA).not.toBe(hashB);
    });

    it('3. Successfully verifies valid PIN against stored hash', async () => {
      const pin = '582914';
      const hash = await hashPin(pin);
      const isValid = await verifyPin(pin, hash);
      expect(isValid).toBe(true);
    });

    it('4. Rejects invalid PIN against stored hash', async () => {
      const hash = await hashPin('582914');
      const isValid = await verifyPin('999999', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('Caretaker Lockout Protection - 5 Failed Tries = 10 Min Lockout (Prompt 3)', () => {
    it('5. Initializes with 0 failed attempts and 5 remaining attempts', () => {
      const status = getLockoutStatus('caretaker-test');
      expect(status.isLocked).toBe(false);
      expect(status.failedAttempts).toBe(0);
      expect(status.remainingAttempts).toBe(5);
    });

    it('6. Increments failed attempts and decrements remaining on consecutive failures', () => {
      const attempt1 = recordFailedAttempt('caretaker-test');
      expect(attempt1.isLocked).toBe(false);
      expect(attempt1.failedAttempts).toBe(1);
      expect(attempt1.remainingAttempts).toBe(4);

      const attempt2 = recordFailedAttempt('caretaker-test');
      expect(attempt2.failedAttempts).toBe(2);
      expect(attempt2.remainingAttempts).toBe(3);
    });

    it('7. Triggers locked status exactly after 5 consecutive failures', () => {
      recordFailedAttempt('caretaker-lockout');
      recordFailedAttempt('caretaker-lockout');
      recordFailedAttempt('caretaker-lockout');
      recordFailedAttempt('caretaker-lockout');
      const lockState = recordFailedAttempt('caretaker-lockout');

      expect(lockState.isLocked).toBe(true);
      expect(lockState.failedAttempts).toBe(5);
      expect(lockState.remainingAttempts).toBe(0);
    });

    it('8. Enforces a 10-minute lockout window with remaining duration countdown', () => {
      for (let i = 0; i < 5; i++) {
        recordFailedAttempt('caretaker-timer');
      }
      const status = getLockoutStatus('caretaker-timer');
      expect(status.isLocked).toBe(true);
      expect(status.minutesRemaining).toBeGreaterThanOrEqual(9);
      expect(status.minutesRemaining).toBeLessThanOrEqual(10);
    });

    it('9. Resets failed attempts and unlocks immediately upon valid PIN verification', () => {
      recordFailedAttempt('caretaker-reset');
      recordFailedAttempt('caretaker-reset');
      resetLockout('caretaker-reset');

      const status = getLockoutStatus('caretaker-reset');
      expect(status.isLocked).toBe(false);
      expect(status.failedAttempts).toBe(0);
      expect(status.remainingAttempts).toBe(5);
    });
  });

  describe('Elder Pairing & Permanent Anonymous Sign-In (Prompt 4)', () => {
    it('10. Generates a valid 6-digit numeric pairing code (100000 - 999999)', () => {
      const code = generate6DigitPairingCode();
      expect(code).toMatch(/^\d{6}$/);
      expect(parseInt(code, 10)).toBeGreaterThanOrEqual(100000);
      expect(parseInt(code, 10)).toBeLessThanOrEqual(999999);
    });

    it('11. Generates pairing code with 15-minute expiration timestamp', () => {
      const meta = generateNewElderPairingCode();
      expect(meta.code).toMatch(/^\d{6}$/);
      expect(meta.secondsRemaining).toBe(900); // 15 min * 60s
      expect(meta.isExpired).toBe(false);
      expect(meta.expiresAt).toBeGreaterThan(Date.now());
    });

    it('12. Retrieves active pairing code metadata with computed remaining seconds', () => {
      generateNewElderPairingCode();
      const meta = getActivePairingCodeMeta();
      expect(meta.code).toBeDefined();
      expect(meta.isExpired).toBe(false);
      expect(meta.secondsRemaining).toBeGreaterThan(0);
    });

    it('13. Successfully verifies newly generated active pairing code', () => {
      const meta = generateNewElderPairingCode();
      const verified = verifyElderPairingCode(meta.code);
      expect(verified).toBe(true);
    });

    it('14. Accepts pre-approved user verification code 824457 from pairing screen', () => {
      const verified = verifyElderPairingCode('824457');
      expect(verified).toBe(true);
    });

    it('15. Claims elder device session and marks device permanently paired', async () => {
      expect(isElderDevicePaired()).toBe(false);
      const res = await pairElderDeviceWithCode('824457', "Arthur's iPad Living Room");
      expect(res.success).toBe(true);
      expect(isElderDevicePaired()).toBe(true);
    });
  });
});
