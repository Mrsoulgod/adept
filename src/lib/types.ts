// Adept Data Types - Elderly Care & Medication Platform

export type Role = 'elder' | 'caretaker' | 'family';

export type MealAnchor = 
  | 'morning_breakfast'  // Morning with breakfast
  | 'after_lunch'        // After lunch
  | 'evening_dinner'     // Evening with dinner
  | 'before_bedtime';    // Before bedtime

export interface MealAnchorConfig {
  id: MealAnchor;
  label: string;
  windowLabel: string;
  defaultWindowStart: string; // e.g. "07:00"
  defaultWindowEnd: string;   // e.g. "10:00"
  iconName: string;
  calmDescription: string;
}

export const MEAL_ANCHORS: Record<MealAnchor, MealAnchorConfig> = {
  morning_breakfast: {
    id: 'morning_breakfast',
    label: 'Morning with breakfast',
    windowLabel: '7:00 AM – 10:00 AM',
    defaultWindowStart: '07:00',
    defaultWindowEnd: '10:00',
    iconName: 'Sunrise',
    calmDescription: 'Take with toast, tea, or your usual breakfast.',
  },
  after_lunch: {
    id: 'after_lunch',
    label: 'After lunch',
    windowLabel: '12:00 PM – 2:30 PM',
    defaultWindowStart: '12:00',
    defaultWindowEnd: '14:30',
    iconName: 'Sun',
    calmDescription: 'Take after your midday meal with a glass of water.',
  },
  evening_dinner: {
    id: 'evening_dinner',
    label: 'Evening with dinner',
    windowLabel: '6:00 PM – 8:30 PM',
    defaultWindowStart: '18:00',
    defaultWindowEnd: '20:30',
    iconName: 'Sunset',
    calmDescription: 'Take with your evening dinner.',
  },
  before_bedtime: {
    id: 'before_bedtime',
    label: 'Before bedtime',
    windowLabel: '9:00 PM – 11:30 PM',
    defaultWindowStart: '21:00',
    defaultWindowEnd: '23:30',
    iconName: 'Moon',
    calmDescription: 'Take quietly before settling in for sleep.',
  },
};

export interface Profile {
  id: string;
  name: string;
  age: number;
  role: Role;
  doctorName: string;
  doctorPhone: string;
  caretakerName: string;
  caretakerPhone: string;
  caretakerEmail: string;
  familyName: string;
  familyEmail: string;
  avatarUrl?: string;
  conditions: string[];
}

export interface Member {
  id: string;
  profileId: string;
  role: Role;
  name: string;
  email?: string;
  phone?: string;
  isPrimary: boolean;
  createdAt: string;
}

export type MedicationSource = 'doctor_rx_ocr' | 'caretaker_manual' | 'ai_proposal';

export interface Medication {
  id: string;
  name: string;
  friendlyName: string; // Elder friendly name e.g. "Small white blood pressure pill"
  dosage: string;       // e.g. "5mg"
  dose?: string;        // Schema alias
  instructions: string; // e.g. "Take 1 tablet with food"
  mealAnchor: MealAnchor;
  windowStart?: string; // e.g. "07:00"
  windowEnd?: string;   // e.g. "10:00"
  stockCount?: number;  // e.g. 30
  source?: MedicationSource;
  shapeDescription: string; // e.g. "Round white pill with line"
  color: string;        // e.g. "#3b82f6"
  purpose: string;      // e.g. "Keeps your blood pressure steady"
  prescribedBy: string; // e.g. "Dr. Evelyn Vance"
  isActive: boolean;
  createdAt: string;
}

export interface Appointment {
  id: string;
  profileId: string;
  doctorName: string;
  doctorPhone?: string;
  location?: string;
  scheduledAt: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'rescheduled' | 'cancelled';
  preVisitBriefJson?: any;
  createdAt: string;
}

export interface SymptomCheckin {
  id: string;
  profileId: string;
  wellnessScore: 'great' | 'steady' | 'tired' | 'discomfort';
  mealAnchor: MealAnchor;
  notes?: string;
  loggedAt: string;
  createdAt: string;
}

export type DoseStatus = 'taken' | 'pending' | 'skipped_comfortably' | 'deferred';

export interface DoseLog {
  id: string;
  medicationId: string;
  medicationName: string;
  mealAnchor: MealAnchor;
  date: string;         // YYYY-MM-DD
  status: DoseStatus;
  loggedAt?: string;    // ISO timestamp
  loggedBy: Role;
  notes?: string;
  comfortNote?: string;
}

export type ProposalStatus = 'pending_elder_confirmation' | 'confirmed' | 'rejected' | 'vetoed';

export interface AIProposal {
  id: string;
  title: string;
  summary: string;
  proposedBy: 'gemini_prescription_ocr' | 'caretaker_ai_suggest' | 'doctor_handoff';
  prescriptionImageUrl?: string;
  medicationData: Partial<Medication>;
  doctorNote?: string;
  status: ProposalStatus;
  createdAt: string;
  resolvedAt?: string;
  elderResponse?: 'accepted' | 'declined' | 'vetoed';
}

export interface BaselineMetric {
  date: string;
  adherenceRate: number; // 0 to 100
  anchorCompliance: Record<MealAnchor, boolean>;
  wellnessScore: 'great' | 'steady' | 'tired' | 'discomfort';
  deviationDetected: boolean;
  deviationReason?: string;
}

export interface AuditLogItem {
  id: string;
  actorRole: Role;
  actorName: string;
  action: string;
  plainEnglishDescription: string;
  timestamp: string;
  canElderVeto: boolean;
  isVetoed: boolean;
  vetoedAt?: string;
  revertedPayload?: string;
}

export interface DoctorBrief {
  generatedAt: string;
  elderName: string;
  age: number;
  periodDays: number;
  adherencePercentage: number;
  totalDosesTaken: number;
  totalDosesScheduled: number;
  deviationsRecorded: number;
  reportedWellnessSummary: string;
  activeMedications: Array<{
    name: string;
    dosage: string;
    mealAnchor: string;
    adherenceRate: number;
  }>;
  notableObservations: string[];
  elderQuestionsForDoctor: string[];
}

