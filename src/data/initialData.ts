import type {
  Profile,
  Medication,
  DoseLog,
  AIProposal,
  AuditLogItem,
  ChatMessage,
  AdeptEvent,
  VitalRecord,
  FamilyVoiceNote,
  IncidentRecord,
} from '../lib/types';

export const INITIAL_ELDERS: Profile[] = [
  {
    id: 'elder-dad',
    name: 'Arthur Davies',
    relationship: 'Dad',
    age: 78,
    role: 'elder',
    healthStatus: 'Resting Steady',
    doctorName: 'Dr. Evelyn Vance',
    doctorPhone: '(555) 234-8901',
    emergencyContactName: 'Sarah Davies (Daughter)',
    emergencyContactPhone: '(555) 345-6789',
    caretakerName: 'Sarah Davies (Daughter)',
    caretakerPhone: '(555) 345-6789',
    caretakerEmail: 'sarah.care@example.com',
    familyName: 'James Davies (Son)',
    familyEmail: 'james.family@example.com',
    conditions: ['Mild Hypertension', 'Type 2 Blood Sugar', 'Knee Joint Stiffness'],
    allergies: ['Penicillin'],
    isDevicePaired: false,
    pairedDeviceName: "Arthur's Tablet",
    language: 'en',
    wakeTime: '07:00',
    breakfastTime: '08:30',
    lunchTime: '13:00',
    dinnerTime: '19:30',
    sleepTime: '22:00',
  },
  {
    id: 'elder-mom',
    name: 'Martha Davies',
    relationship: 'Mom',
    age: 76,
    role: 'elder',
    healthStatus: 'Active & Comfortable',
    doctorName: 'Dr. Evelyn Vance',
    doctorPhone: '(555) 234-8901',
    emergencyContactName: 'Sarah Davies (Daughter)',
    emergencyContactPhone: '(555) 345-6789',
    caretakerName: 'Sarah Davies (Daughter)',
    caretakerPhone: '(555) 345-6789',
    caretakerEmail: 'sarah.care@example.com',
    familyName: 'James Davies (Son)',
    familyEmail: 'james.family@example.com',
    conditions: ['Mild Osteoporosis', 'Seasonal Allergies'],
    allergies: ['Sulfa drugs'],
    isDevicePaired: false,
    pairedDeviceName: "Martha's Tablet",
    language: 'en',
    wakeTime: '06:30',
    breakfastTime: '08:00',
    lunchTime: '12:30',
    dinnerTime: '19:00',
    sleepTime: '21:30',
  },
];

export const INITIAL_PROFILE: Profile = INITIAL_ELDERS[0];

export const INITIAL_MEDICATIONS: Medication[] = [
  {
    id: 'med-1',
    elderId: 'elder-dad',
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
    elderId: 'elder-dad',
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
    elderId: 'elder-dad',
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
    elderId: 'elder-dad',
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
  {
    id: 'med-mom-1',
    elderId: 'elder-mom',
    name: 'Calcium + Vitamin D3',
    friendlyName: 'Morning Bone Strength Tablet',
    dosage: '600 mg / 400 IU',
    instructions: '1 chewable tablet with breakfast',
    mealAnchor: 'morning_breakfast',
    stockCount: 30,
    dailyDoseUnits: 1,
    source: 'prescription_photo',
    shapeDescription: 'White round chewable tablet',
    color: '#06b6d4',
    purpose: 'Maintains bone density and calcium absorption',
    prescribedBy: 'Dr. Evelyn Vance',
    isActive: true,
    createdAt: '2026-10-01T08:00:00Z',
  },
  {
    id: 'med-mom-2',
    elderId: 'elder-mom',
    name: 'Cetirizine',
    friendlyName: 'Evening Allergy Relief Tablet',
    dosage: '10 mg',
    instructions: '1 small white tablet with dinner',
    mealAnchor: 'evening_dinner',
    stockCount: 14,
    dailyDoseUnits: 1,
    source: 'prescription_photo',
    shapeDescription: 'Small white oval tablet',
    color: '#ec4899',
    purpose: 'Prevents seasonal sneezing and allergy discomfort',
    prescribedBy: 'Dr. Evelyn Vance',
    isActive: true,
    createdAt: '2026-10-01T18:00:00Z',
  },
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'chat-1',
    channelId: 'group',
    channelName: 'Care Circle Family Chat',
    senderRole: 'family',
    senderName: 'James Davies (Son)',
    text: 'Good morning Dad and Sarah! Let me know if you need any fresh groceries brought over this weekend.',
    timestamp: 'Today, 8:10 AM',
  },
  {
    id: 'chat-2',
    channelId: 'group',
    channelName: 'Care Circle Family Chat',
    senderRole: 'caretaker',
    senderName: 'Sarah Davies (Daughter)',
    text: 'Morning James! Dad had a restful sleep last night. I will prepare his oatmeal at 8:30.',
    timestamp: 'Today, 8:15 AM',
  },
  {
    id: 'chat-3',
    channelId: 'sarah-direct',
    channelName: 'Sarah Davies',
    senderRole: 'caretaker',
    senderName: 'Sarah Davies',
    text: 'Dad, I picked up your favorite blueberry tea from the shop yesterday ❤️',
    timestamp: 'Yesterday, 4:30 PM',
  },
  {
    id: 'chat-4',
    channelId: 'james-direct',
    channelName: 'James Davies',
    senderRole: 'family',
    senderName: 'James Davies',
    text: 'Hi Dad, looking forward to watching Sunday football together on the weekend!',
    timestamp: 'Yesterday, 6:00 PM',
  },
];

// Generate past 7 days dose logs + today
const getPastDateStr = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

export const getInitialDoseLogs = (includeToday = false): DoseLog[] => {
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

    // Mom's medications (Martha Davies)
    logs.push({
      id: `log-mom-am-${i}`,
      medicationId: 'med-mom-1',
      medicationName: 'Calcium + Vitamin D3',
      mealAnchor: 'morning_breakfast',
      date: dStr,
      status: 'taken',
      loggedAt: `${dStr}T08:15:00Z`,
      loggedBy: 'elder',
      notes: 'Taken with breakfast fruit and oatmeal.',
    });
    logs.push({
      id: `log-mom-pm-${i}`,
      medicationId: 'med-mom-2',
      medicationName: 'Cetirizine',
      mealAnchor: 'evening_dinner',
      date: dStr,
      status: 'taken',
      loggedAt: `${dStr}T19:00:00Z`,
      loggedBy: 'elder',
      notes: 'Taken with dinner.',
    });
  }

  // Only show today's confirmed doses if the elder's device is actually paired or in test simulation
  const isPaired = typeof localStorage !== 'undefined' && localStorage.getItem('adept_elder_session_active') === 'true';
  if (includeToday || isPaired) {
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
  }

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

// ---------------------------------------------------------------------
// PROMPT 9: INITIAL VITALS (7 & 30-day realistic readings)
// ---------------------------------------------------------------------
export const INITIAL_VITALS: VitalRecord[] = [
  {
    id: 'vital-bp-today',
    elderId: 'elder-dad',
    type: 'bp',
    systolic: 126,
    diastolic: 82,
    pulseBpm: 72,
    context: 'resting',
    rangeFlag: 'normal',
    rangeFlagLabel: 'Normal resting range for Arthur',
    notes: 'Morning measurement before breakfast tea',
    loggedBy: 'elder',
    loggedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'vital-sugar-today',
    elderId: 'elder-dad',
    type: 'sugar',
    bloodSugar: 108,
    context: 'fasting',
    rangeFlag: 'steady',
    rangeFlagLabel: 'Steady fasting morning reading',
    notes: 'Fasting glucose reading with finger-stick meter',
    loggedBy: 'elder',
    loggedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'vital-weight-today',
    elderId: 'elder-dad',
    type: 'weight',
    weightKg: 74.2,
    context: 'resting',
    rangeFlag: 'steady',
    rangeFlagLabel: 'Steady baseline weight',
    notes: 'Weekly weigh-in on bathroom scale',
    loggedBy: 'caretaker',
    loggedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  // Past historical readings
  {
    id: 'vital-bp-1',
    elderId: 'elder-dad',
    type: 'bp',
    systolic: 124,
    diastolic: 80,
    pulseBpm: 70,
    context: 'resting',
    rangeFlag: 'normal',
    rangeFlagLabel: 'Normal resting range',
    notes: 'Recorded after morning walk',
    loggedBy: 'elder',
    loggedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'vital-sugar-1',
    elderId: 'elder-dad',
    type: 'sugar',
    bloodSugar: 112,
    context: 'fasting',
    rangeFlag: 'steady',
    rangeFlagLabel: 'Steady fasting reading',
    notes: 'Morning fasting',
    loggedBy: 'elder',
    loggedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'vital-bp-2',
    elderId: 'elder-dad',
    type: 'bp',
    systolic: 132,
    diastolic: 84,
    pulseBpm: 74,
    context: 'resting',
    rangeFlag: 'normal',
    rangeFlagLabel: 'Slightly higher after garden stairs',
    notes: 'After light gardening',
    loggedBy: 'caretaker',
    loggedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'vital-sugar-2',
    elderId: 'elder-dad',
    type: 'sugar',
    bloodSugar: 104,
    context: 'fasting',
    rangeFlag: 'steady',
    rangeFlagLabel: 'Normal fasting level',
    notes: 'Fasting glucose',
    loggedBy: 'elder',
    loggedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'vital-bp-3',
    elderId: 'elder-dad',
    type: 'bp',
    systolic: 125,
    diastolic: 81,
    pulseBpm: 68,
    context: 'resting',
    rangeFlag: 'normal',
    rangeFlagLabel: 'Comfortable resting baseline',
    notes: 'Resting in armchair',
    loggedBy: 'elder',
    loggedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'vital-sugar-3',
    elderId: 'elder-dad',
    type: 'sugar',
    bloodSugar: 110,
    context: 'fasting',
    rangeFlag: 'steady',
    rangeFlagLabel: 'Normal fasting level',
    notes: 'Morning fasting',
    loggedBy: 'elder',
    loggedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'vital-bp-4',
    elderId: 'elder-dad',
    type: 'bp',
    systolic: 128,
    diastolic: 82,
    pulseBpm: 71,
    context: 'resting',
    rangeFlag: 'normal',
    rangeFlagLabel: 'Steady baseline',
    notes: 'Morning check',
    loggedBy: 'elder',
    loggedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'vital-bp-5',
    elderId: 'elder-dad',
    type: 'bp',
    systolic: 122,
    diastolic: 79,
    pulseBpm: 69,
    context: 'resting',
    rangeFlag: 'normal',
    rangeFlagLabel: 'Calm resting reading',
    notes: 'Evening reading',
    loggedBy: 'elder',
    loggedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'vital-bp-6',
    elderId: 'elder-dad',
    type: 'bp',
    systolic: 127,
    diastolic: 83,
    pulseBpm: 73,
    context: 'resting',
    rangeFlag: 'normal',
    rangeFlagLabel: 'Normal resting baseline',
    notes: 'Morning check',
    loggedBy: 'elder',
    loggedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
];

// ---------------------------------------------------------------------
// PROMPT 14: INITIAL FAMILY VOICE NOTES
// ---------------------------------------------------------------------
export const INITIAL_FAMILY_VOICE_NOTES: FamilyVoiceNote[] = [
  {
    id: 'vn-today-1',
    circleId: 'circle-1',
    senderName: 'Sarah Davies (Daughter)',
    senderRole: 'caretaker',
    durationSeconds: 18,
    recordedAt: 'Today, 7:45 AM',
    hasBeenPlayed: false,
    lovedReply: false,
  },
];

// ---------------------------------------------------------------------
// PROMPT 12: INITIAL INCIDENTS
// ---------------------------------------------------------------------
export const INITIAL_INCIDENTS: IncidentRecord[] = [];

// ---------------------------------------------------------------------
// PROMPT 7: DATA SPINE INITIAL EVENTS (Single Source of Truth)
// ---------------------------------------------------------------------
export const getInitialEvents = (): AdeptEvent[] => {
  const events: AdeptEvent[] = [];
  const initialLogs = getInitialDoseLogs(false);

  // Convert past dose logs into canonical events
  for (const log of initialLogs) {
    events.push({
      id: `evt-${log.id}`,
      circleId: 'circle-1',
      actorRole: log.loggedBy,
      type: log.status === 'taken' ? 'dose_taken' : log.status === 'deferred' ? 'dose_skipped' : 'dose_missed',
      payload: {
        medication_id: log.medicationId,
        medication_name: log.medicationName,
        meal_anchor: log.mealAnchor,
        date: log.date,
        notes: log.notes,
      },
      source: 'elder_tap',
      createdAt: log.loggedAt || `${log.date}T08:30:00Z`,
    });
  }

  // Convert initial vitals into events
  for (const v of INITIAL_VITALS) {
    events.push({
      id: `evt-${v.id}`,
      circleId: 'circle-1',
      actorRole: v.loggedBy,
      type: 'vital_logged',
      payload: {
        vital_id: v.id,
        type: v.type,
        systolic: v.systolic,
        diastolic: v.diastolic,
        blood_sugar: v.bloodSugar,
        weight_kg: v.weightKg,
        pulse_bpm: v.pulseBpm,
        context: v.context,
        range_flag: v.rangeFlag,
      },
      source: 'number_pad',
      createdAt: v.loggedAt,
    });
  }

  // Initial checkin event
  events.push({
    id: 'evt-checkin-today',
    circleId: 'circle-1',
    actorRole: 'elder',
    type: 'checkin',
    payload: {
      wellness_score: 'steady',
      notes: 'Feeling comfortable and steady after morning tea.',
    },
    source: 'face_picker',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  });

  return events;
};
