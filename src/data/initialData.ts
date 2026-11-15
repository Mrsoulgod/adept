import type { Profile, Medication, DoseLog, AIProposal, AuditLogItem } from '../lib/types';

export const INITIAL_PROFILE: Profile = {
  id: 'arthur-davies-78',
  name: 'Arthur Davies',
  age: 78,
  role: 'elder',
  doctorName: 'Dr. Evelyn Vance',
  doctorPhone: '(555) 234-8901',
  caretakerName: 'Sarah Davies (Daughter)',
  caretakerPhone: '(555) 345-6789',
  caretakerEmail: 'sarah.care@example.com',
  familyName: 'James Davies (Son)',
  familyEmail: 'james.family@example.com',
  conditions: ['Mild Hypertension', 'Type 2 Blood Sugar', 'Knee Joint Stiffness'],
};

export const INITIAL_MEDICATIONS: Medication[] = [
  {
    id: 'med-1',
    name: 'Amlodipine',
    friendlyName: 'Morning Blood Pressure Tablet',
    dosage: '5 mg',
    instructions: '1 small white round tablet with breakfast & warm water',
    mealAnchor: 'morning_breakfast',
    stockCount: 18,
    dailyDoseUnits: 1,
    source: 'prescription_photo',
    shapeDescription: 'Small white round tablet',
    color: '#3b82f6',
    purpose: 'Keeps your blood pressure steady throughout the day',
    prescribedBy: 'Dr. Evelyn Vance',
    isActive: true,
    createdAt: '2026-10-01T08:00:00Z',
  },
  {
    id: 'med-2',
    name: 'Metformin',
    friendlyName: 'Morning Sugar Balance Tablet',
    dosage: '500 mg',
    instructions: '1 white oval tablet with breakfast toast or oats',
    mealAnchor: 'morning_breakfast',
    stockCount: 22,
    dailyDoseUnits: 1,
    source: 'prescription_photo',
    shapeDescription: 'White oval tablet with scored line',
    color: '#10b981',
    purpose: 'Helps keep morning blood sugar balanced smoothly',
    prescribedBy: 'Dr. Evelyn Vance',
    isActive: true,
    createdAt: '2026-10-01T08:00:00Z',
  },
  {
    id: 'med-3',
    name: 'Glucosamine Complex',
    friendlyName: 'Midday Joint Comfort Capsule',
    dosage: '1000 mg',
    instructions: '1 amber capsule after midday lunch',
    mealAnchor: 'after_lunch',
    stockCount: 4, // Low stock: runs out in 4 days (weekend stock-out danger!)
    dailyDoseUnits: 1,
    source: 'doctor_visit_voice',
    shapeDescription: 'Amber gel capsule',
    color: '#f59e0b',
    purpose: 'Supports comfortable walking and knee ease',
    prescribedBy: 'Dr. Evelyn Vance',
    isActive: true,
    createdAt: '2026-10-15T12:00:00Z',
  },
  {
    id: 'med-4',
    name: 'Atorvastatin',
    friendlyName: 'Evening Heart Shield Tablet',
    dosage: '20 mg',
    instructions: '1 pale yellow round tablet with dinner',
    mealAnchor: 'evening_dinner',
    stockCount: 5, // Low stock: runs out in 5 days (weekend stock-out danger!)
    dailyDoseUnits: 1,
    source: 'doctor_visit_voice',
    shapeDescription: 'Pale yellow round tablet',
    color: '#8b5cf6',
    purpose: 'Protects heart and circulation while you rest',
    prescribedBy: 'Dr. Evelyn Vance',
    isActive: true,
    createdAt: '2026-10-01T18:00:00Z',
  },
];

// Generate past 7 days dose logs + today
const getPastDateStr = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

export const getInitialDoseLogs = (): DoseLog[] => {
  const logs: DoseLog[] = [];
  const todayStr = getPastDateStr(0);

  // Past 6 days (mostly 100% compliant, one mild deviation 2 days ago)
  for (let i = 6; i >= 1; i--) {
    const dStr = getPastDateStr(i);
    // Morning meds taken
    logs.push({
      id: `log-am-${i}-1`,
      medicationId: 'med-1',
      medicationName: 'Amlodipine (Morning BP)',
      mealAnchor: 'morning_breakfast',
      date: dStr,
      status: 'taken',
      loggedAt: `${dStr}T08:25:00Z`,
      loggedBy: 'elder',
      notes: 'Taken with morning porridge and tea.',
    });
    logs.push({
      id: `log-am-${i}-2`,
      medicationId: 'med-2',
      medicationName: 'Metformin (Sugar Balance)',
      mealAnchor: 'morning_breakfast',
      date: dStr,
      status: 'taken',
      loggedAt: `${dStr}T08:26:00Z`,
      loggedBy: 'elder',
      notes: 'Taken with breakfast.',
    });

    // Lunch med
    if (i === 2) {
      // 2 days ago: comfortable delay after visit with grandchildren
      logs.push({
        id: `log-lunch-${i}`,
        medicationId: 'med-3',
        medicationName: 'Glucosamine Complex',
        mealAnchor: 'after_lunch',
        date: dStr,
        status: 'taken',
        loggedAt: `${dStr}T14:15:00Z`,
        loggedBy: 'elder',
        notes: 'Grandchildren visited, took after late lunch soup.',
        comfortNote: 'Knees felt a bit tired after garden walk.',
      });
    } else {
      logs.push({
        id: `log-lunch-${i}`,
        medicationId: 'med-3',
        medicationName: 'Glucosamine Complex',
        mealAnchor: 'after_lunch',
        date: dStr,
        status: 'taken',
        loggedAt: `${dStr}T12:45:00Z`,
        loggedBy: 'elder',
        notes: 'Taken after sandwich.',
      });
    }

    // Evening med
    logs.push({
      id: `log-pm-${i}`,
      medicationId: 'med-4',
      medicationName: 'Atorvastatin (Evening Heart)',
      mealAnchor: 'evening_dinner',
      date: dStr,
      status: 'taken',
      loggedAt: `${dStr}T18:50:00Z`,
      loggedBy: 'elder',
      notes: 'Taken with dinner.',
    });
  }

  // Today's logs: Morning doses already comfortably taken!
  logs.push({
    id: `log-am-today-1`,
    medicationId: 'med-1',
    medicationName: 'Amlodipine (Morning BP)',
    mealAnchor: 'morning_breakfast',
    date: todayStr,
    status: 'taken',
    loggedAt: `${todayStr}T08:15:00Z`,
    loggedBy: 'elder',
    notes: 'Taken with toast and Earl Grey tea.',
  });
  logs.push({
    id: `log-am-today-2`,
    medicationId: 'med-2',
    medicationName: 'Metformin (Sugar Balance)',
    mealAnchor: 'morning_breakfast',
    date: todayStr,
    status: 'taken',
    loggedAt: `${todayStr}T08:16:00Z`,
    loggedBy: 'elder',
    notes: 'Taken with breakfast.',
  });

  return logs;
};

export const INITIAL_AI_PROPOSALS: AIProposal[] = [
  {
    id: 'prop-101',
    title: 'Vitamin D3 Bone Support',
    summary: 'Dr. Evelyn Vance recommended adding 1000 IU Vitamin D3 daily after lunch to support winter bone and muscle strength.',
    proposedBy: 'gemini_prescription_ocr',
    medicationData: {
      name: 'Vitamin D3 (Cholecalciferol)',
      friendlyName: 'Midday Sunshine Vitamin D3',
      dosage: '1,000 IU',
      instructions: '1 softgel after lunch with a glass of water',
      mealAnchor: 'after_lunch',
      shapeDescription: 'Small golden translucent softgel',
      color: '#f59e0b',
      purpose: 'Supports bone strength and winter energy',
      prescribedBy: 'Dr. Evelyn Vance',
      isActive: true,
    },
    doctorNote: 'Prescribed during check-up on Nov 12. Safe to take alongside Amlodipine and Metformin.',
    status: 'pending_elder_confirmation',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(), // 3 hours ago
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'audit-001',
    actorRole: 'caretaker',
    actorName: 'Rahul (Caretaker)',
    action: 'Changed dose of Morning Blood Pressure Tablet',
    source: 'prescription_photo',
    sourceLabel: 'prescription photo',
    plainEnglishDescription: 'Rahul changed dose to 5mg, source: prescription photo. Dr. Vance increased dose for blood pressure stability.',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    canElderVeto: true,
    isVetoed: false,
    revertedPayload: 'med-1',
  },
  {
    id: 'audit-002',
    actorRole: 'caretaker',
    actorName: 'Sarah Davies (Caretaker)',
    action: 'Updated evening statin routine to dinner',
    source: 'doctor_visit_voice',
    sourceLabel: 'doctor visit voice',
    plainEnglishDescription: 'Sarah updated Evening Heart Shield timing to dinner, source: doctor visit voice.',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    canElderVeto: true,
    isVetoed: false,
    revertedPayload: 'med-4',
  },
  {
    id: 'audit-003',
    actorRole: 'elder',
    actorName: 'Arthur Davies (Self)',
    action: 'Confirmed Morning Breakfast Routine',
    plainEnglishDescription: 'Arthur confirmed taking morning blood pressure and sugar tablets with breakfast toast.',
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
    canElderVeto: false,
    isVetoed: false,
  },
  {
    id: 'audit-004',
    actorRole: 'caretaker',
    actorName: 'Rahul (Caretaker)',
    action: 'Added stock refill log for Metformin (+30 tablets)',
    source: 'physician_phone_order',
    sourceLabel: 'physician phone order',
    plainEnglishDescription: 'Rahul logged 30-day refill delivery from St. Jude Pharmacy, source: physician phone order.',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    canElderVeto: true,
    isVetoed: false,
  },
  {
    id: 'audit-005',
    actorRole: 'elder',
    actorName: 'Arthur Davies (ELDER VETO)',
    action: 'Vetoed: Shifted evening dinner window',
    plainEnglishDescription: 'Arthur exercised his Elder Veto to restore his customary 6:30 PM dinner window. Change immediately rolled back.',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    canElderVeto: false,
    isVetoed: true,
    vetoedAt: new Date(Date.now() - 86400000 * 2 + 1800000).toISOString(),
  },
];
