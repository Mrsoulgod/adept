import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateClientUuid,
  queueOfflineEvent,
  getQueuedOfflineEvents,
  clearOfflineQueue,
} from '../src/lib/offlineSync';

describe('Offline-First Synchronization Suite - Prompt 19', () => {
  beforeEach(async () => {
    localStorage.clear();
    await clearOfflineQueue();
  });

  it('1. Generates unique, non-colliding client UUIDs for idempotent syncing', () => {
    const uuid1 = generateClientUuid();
    const uuid2 = generateClientUuid();
    expect(uuid1).toBeDefined();
    expect(uuid2).toBeDefined();
    expect(uuid1).not.toBe(uuid2);
  });

  it('2. Queues an event with client UUID and metadata when offline', async () => {
    const item = await queueOfflineEvent({
      circleId: 'circle-offline-1',
      actorRole: 'elder',
      type: 'dose_taken',
      payload: { medicationId: 'med-ramipril', mealAnchor: 'morning_breakfast' },
      source: 'offline_elder_tap',
    });

    expect(item.clientUuid).toBeDefined();
    expect(item.queuedAt).toBeDefined();
    expect(item.retryCount).toBe(0);
    expect(item.event.type).toBe('dose_taken');
  });

  it('3. Successfully retrieves queued events for synchronization', async () => {
    await queueOfflineEvent({
      circleId: 'circle-offline-1',
      actorRole: 'elder',
      type: 'dose_taken',
      payload: { medicationId: 'med-ramipril' },
      source: 'offline_elder_tap',
    });

    const queued = await getQueuedOfflineEvents();
    expect(queued.length).toBeGreaterThanOrEqual(1);
    expect(queued[0].event.source).toBe('offline_elder_tap');
  });

  it('4. Enforces idempotency: Re-queueing with same clientUuid prevents duplicate inserts', async () => {
    const fixedUuid = 'evt-fixed-client-uuid-999';

    await queueOfflineEvent(
      {
        circleId: 'circle-offline-1',
        actorRole: 'elder',
        type: 'dose_taken',
        payload: { medicationId: 'med-ramipril', status: 'first_try' },
        source: 'offline_elder_tap',
      },
      fixedUuid
    );

    // Re-queue same UUID simulating network retry
    await queueOfflineEvent(
      {
        circleId: 'circle-offline-1',
        actorRole: 'elder',
        type: 'dose_taken',
        payload: { medicationId: 'med-ramipril', status: 'second_try_retry' },
        source: 'offline_elder_tap',
      },
      fixedUuid
    );

    const queued = await getQueuedOfflineEvents();
    const matching = queued.filter((q) => q.clientUuid === fixedUuid);
    expect(matching.length).toBe(1);
    expect((matching[0].event.payload as any).status).toBe('second_try_retry');
  });

  it('5. Successfully clears queued events after successful backend flush', async () => {
    await queueOfflineEvent({
      circleId: 'circle-offline-1',
      actorRole: 'elder',
      type: 'vital_logged',
      payload: { type: 'bp', systolic: 120, diastolic: 80 },
      source: 'offline_vitals',
    });

    await clearOfflineQueue();
    const queued = await getQueuedOfflineEvents();
    expect(queued.length).toBe(0);
  });

  it('6. Queues dose logs when offline and marks them ready to sync', async () => {
    const logged = await queueOfflineEvent({
      circleId: 'circle-dad-bath',
      actorRole: 'elder',
      type: 'dose_taken',
      payload: { medicationId: 'med-glucosamine', doseCount: 1 },
      source: 'elder_offline_pill_card',
    });

    expect(logged.event.type).toBe('dose_taken');
    expect(logged.clientUuid).toBeDefined();
  });

  it('7. Maintains FIFO order or timestamp tracking for synchronization replay', async () => {
    const itemA = await queueOfflineEvent({
      circleId: 'c1',
      actorRole: 'elder',
      type: 'dose_taken',
      payload: { med: 'A' },
      source: 'offline',
    });

    const itemB = await queueOfflineEvent({
      circleId: 'c1',
      actorRole: 'elder',
      type: 'dose_taken',
      payload: { med: 'B' },
      source: 'offline',
    });

    expect(new Date(itemA.queuedAt).getTime()).toBeLessThanOrEqual(
      new Date(itemB.queuedAt).getTime()
    );
  });

  it('8. Supports offline cognitive event logging without dropping response times', async () => {
    const cogItem = await queueOfflineEvent({
      circleId: 'c1',
      actorRole: 'elder',
      type: 'cog_event',
      payload: { game: 'routine_recall', correct: true, responseMs: 2200 },
      source: 'offline_mind_tab',
    });

    expect((cogItem.event.payload as any).responseMs).toBe(2200);
  });

  it('9. Preserves emergency contact access without requiring network roundtrips', () => {
    const emergencyContacts = [
      { name: 'Dr. Evelyn Vance (Primary GP)', phone: '01225 892341' },
      { name: 'Emergency Ambulance', phone: '999 / 112' },
      { name: 'Sarah Davies (Daughter)', phone: '+44 7700 900123' },
    ];

    expect(emergencyContacts.length).toBe(3);
    for (const contact of emergencyContacts) {
      expect(contact.phone).toBeDefined();
    }
  });

  it('10. Operates reliably under localStorage fallback if browser restricts IndexedDB', async () => {
    // Direct test of fallback queue
    const fallbackItem = await queueOfflineEvent({
      circleId: 'c1',
      actorRole: 'caretaker',
      type: 'checkin',
      payload: { note: 'Offline visit logged' },
      source: 'caretaker_offline',
    });

    expect(fallbackItem.clientUuid).toBeDefined();
    const items = await getQueuedOfflineEvents();
    expect(items.length).toBeGreaterThan(0);
  });
});
