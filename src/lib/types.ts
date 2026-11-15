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

export type PermissionLevel = 'view_only' | 'can_edit';

export interface Profile {
  id: string;
  name: string;
  age: number;
  role: Role;
  relationship?: 'Dad' | 'Mom' | 'Grandmother' | 'Grandfather' | 'Elder' | string;
  healthStatus?: string;
  photoUrl?: string;
  language?: 'en' | 'hi';
  wakeTime?: string;
  breakfastTime?: string;
  lunchTime?: string;
  dinnerTime?: string;
  sleepTime?: string;
  doctorName: string;
  doctorPhone: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  caretakerName: string;
  caretakerPhone: string;
  caretakerEmail: string;
  familyName: string;
  familyEmail: string;
  avatarUrl?: string;
  conditions: string[];
  allergies?: string[];
  isDevicePaired?: boolean;
  pairedDeviceName?: string;
  lastConnectedAt?: string;
  pairingCode?: string;
}

export type ElderProfile = Profile;

export interface ChatMessage {
  id: string;
  channelId: string; // 'group' or member ID or elder ID
  channelName: string; // e.g. "Care Circle Group", "Sarah Davies", "James Davies"
  senderRole: Role;
  senderName: string;
  text: string;
  timestamp: string;
  isQuickResponse?: boolean;
  isVoiceTranscription?: boolean;
}

export interface EmergencyAlert {
  id: string;
  elderId: string;
  elderName: string;
  reason: string;
  timestamp: string;
  status: 'active' | 'resolved';
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface Member {
  id: string;
  profileId: string;
  userId?: string;
  role: Role;
  name: string;
  email?: string;
  phone?: string;
  permission?: PermissionLevel;
  tourCompleted?: boolean;
  inviteStatus?: 'pending' | 'accepted';
  inviteLink?: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface ElderDeviceRecord {
  id: string;
  profileId: string;
  code: string;
  deviceName: string;
  expiresAt: string;
  claimedAt?: string;
  isRevoked: boolean;
  createdAt: string;
}

export type MedicationSource =
  | 'prescription_photo'
  | 'doctor_visit_voice'
  | 'physician_phone_order'
  | 'caretaker_manual'
  | 'lab_review'
  | 'doctor_rx_ocr'
  | 'ai_proposal';

export type EditSource =
  | 'prescription_photo'
  | 'doctor_visit_voice'
  | 'physician_phone_order'
  | 'caretaker_manual'
  | 'lab_review';

export const EDIT_SOURCE_LABELS: Record<EditSource, string> = {
  prescription_photo: 'prescription photo',
  doctor_visit_voice: 'doctor visit voice',
  physician_phone_order: 'physician phone order',
  caretaker_manual: 'caretaker manual',
  lab_review: 'lab review',
};

export interface Medication {
  id: string;
  elderId?: string;     // Which elder this medication belongs to (defaults to active elder)
  name: string;
  friendlyName: string; // Elder friendly name e.g. "Small white blood pressure pill"
  dosage: string;       // e.g. "5mg"
  dose?: string;        // Schema alias
  instructions: string; // e.g. "Take 1 tablet with food"
  mealAnchor: MealAnchor;
  windowStart?: string; // e.g. "07:00"
  windowEnd?: string;   // e.g. "10:00"
  stockCount?: number;  // e.g. 14 pills
  dailyDoseUnits?: number; // e.g. 1 pill / day
  source?: EditSource | MedicationSource; // Mandatory source for every edit
  lastRefillDate?: string;
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

export interface ScheduleChangeItem {
  action: 'add' | 'modify' | 'discontinue';
  medicationName: string;
  friendlyName: string;
  dosage?: string;
  mealAnchor?: MealAnchor;
  instructions?: string;
  reason: string;
}

export interface AIProposal {
  id: string;
  title: string;
  summary: string;
  proposedBy: 'gemini_prescription_ocr' | 'caretaker_ai_suggest' | 'doctor_handoff' | 'post_visit_voice';
  prescriptionImageUrl?: string;
  voiceTranscript?: string;
  medicationData: Partial<Medication>;
  proposedScheduleChanges?: ScheduleChangeItem[];
  doctorNote?: string;
  safetyNote?: string; // "Confirm with your doctor before applying any changes"
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
  source?: EditSource;
  sourceLabel?: string;
  plainEnglishDescription: string;
  timestamp: string;
  canElderVeto: boolean;
  isVetoed: boolean;
  vetoedAt?: string;
  revertedPayload?: string;
}

export interface StockPrediction {
  medicationId: string;
  medicationName: string;
  friendlyName: string;
  currentStock: number;
  dailyRate: number;
  daysRemaining: number;
  stockOutDateStr: string;     // e.g. "2026-11-21"
  stockOutDayOfWeek: string;   // e.g. "Saturday"
  isWeekendStockOut: boolean;  // True if falls on Saturday or Sunday
  isHolidayStockOut: boolean;  // True if near holiday / bank closure
  holidayName?: string;
  needsRefillNudge: boolean;
  nudgeReason?: string;
  severity: 'urgent' | 'warning' | 'comfortable';
}

export interface SymptomTrendData {
  overallTrend: string;
  dominantScore: 'great' | 'steady' | 'tired' | 'discomfort';
  checkinsRecorded: number;
  breakdown: {
    great: number;
    steady: number;
    tired: number;
    discomfort: number;
  };
  recentObservations: string[];
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
  symptomTrends?: SymptomTrendData;
  activeMedications: Array<{
    name: string;
    dosage: string;
    mealAnchor: string;
    adherenceRate: number;
  }>;
  notableObservations: string[];
  elderQuestionsForDoctor: string[];
  safetyNote?: string;
}

// ---------------------------------------------------------------------
// PROMPT 7: DATA SPINE (Single Source of Truth Events & Views)
// ---------------------------------------------------------------------
export type EventType =
  | 'dose_taken'
  | 'dose_skipped'
  | 'dose_missed'
  | 'med_added'
  | 'med_changed'
  | 'med_removed'
  | 'vital_logged'
  | 'checkin'
  | 'sos_triggered'
  | 'sos_claimed'
  | 'sos_escalated'
  | 'sos_resolved'
  | 'note'
  | 'ai_question'
  | 'safety_checked'
  | 'cog_event'
  | 'hydration_logged'
  | 'activity_logged'
  | 'reminder_configured';

export interface AdeptEvent {
  id: string;
  circleId: string;
  actorId?: string;
  actorRole: Role | 'system' | 'ai';
  type: EventType;
  payload: Record<string, any>;
  source: string;
  createdAt: string;
}

// Dynamic Computed Views from the Event Spine
export interface StockRemainingView {
  medicationId: string;
  friendlyName: string;
  stockRemaining: number;
}

export interface DaysOfSupplyView {
  medicationId: string;
  friendlyName: string;
  daysOfSupply: number;
}

export interface AdherenceSummaryView {
  elderId: string;
  adherence7d: number;
  adherence30d: number;
  taken7d: number;
  scheduled7d: number;
  taken30d: number;
  scheduled30d: number;
}

export interface UsualDoseTimeView {
  medicationId: string;
  usualTimeString: string;
  usualTimeMinuteOfDay: number;
}

// ---------------------------------------------------------------------
// PROMPT 9: VITALS LOG
// ---------------------------------------------------------------------
export type VitalType = 'bp' | 'sugar' | 'weight' | 'pulse';

export interface VitalRecord {
  id: string;
  elderId: string;
  type: VitalType;
  systolic?: number;
  diastolic?: number;
  bloodSugar?: number; // mg/dL
  weightKg?: number;
  pulseBpm?: number;
  context?: 'fasting' | 'post_meal' | 'resting' | 'active';
  rangeFlag?: 'normal' | 'low' | 'high' | 'steady';
  rangeFlagLabel?: string;
  notes?: string;
  loggedBy: Role | 'elder' | 'caretaker' | 'family';
  loggedAt: string;
}

// ---------------------------------------------------------------------
// PROMPT 11: MEDICINE SAFETY CHECK
// ---------------------------------------------------------------------
export type SafetySeverity = 'info' | 'caution' | 'ask_doctor';

export interface MedicineSafetyReport {
  id: string;
  medicationName: string;
  dosage: string;
  severity: SafetySeverity;
  reason: string;
  confidence: number;
  checkedAt: string;
  disclaimer: string;
  suggestedAction?: string;
}

// ---------------------------------------------------------------------
// PROMPT 12 & 13: SOS WITH ESCALATION & INCIDENTS
// ---------------------------------------------------------------------
export type IncidentStatus = 'open' | 'claimed' | 'escalated' | 'resolved';

export interface IncidentTimelineItem {
  timestamp: string;
  title: string;
  actor: string;
  description: string;
}

export interface IncidentRecord {
  id: string;
  circleId: string;
  elderId: string;
  elderName: string;
  status: IncidentStatus;
  triggeredAt: string;
  claimedAt?: string;
  claimedBy?: string;
  claimedByRole?: Role;
  escalatedAt?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    mapsUrl?: string;
  };
  vitalSnapshot?: VitalRecord;
  timeline: IncidentTimelineItem[];
}

// ---------------------------------------------------------------------
// PROMPT 14: FAMILY VOICE NOTE & CALL ME
// ---------------------------------------------------------------------
export interface FamilyVoiceNote {
  id: string;
  circleId: string;
  senderName: string;
  senderRole: Role;
  audioUrl?: string; // base64 or blob URL
  durationSeconds: number;
  recordedAt: string;
  hasBeenPlayed: boolean;
  playedAt?: string;
  lovedReply: boolean;
  lovedAt?: string;
}

// ---------------------------------------------------------------------
// PROMPT 8: ADEPT AI FUNCTION CALLING
// ---------------------------------------------------------------------
export interface AdeptAiMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: string[];
  followUpChips?: string[];
  isEmergency?: boolean;
  timestamp: string;
}

// ---------------------------------------------------------------------
// PROMPT 15: MEMORY LANE & COGNITIVE GAMES
// ---------------------------------------------------------------------
export interface MemoryLanePhoto {
  id: string;
  elderId: string;
  photoUrl: string;
  name: string;
  relationship: string;
  caption: string;
  captionHi?: string;
  voiceAudioUrl?: string; // audio dataUrl or audio url
  createdAt: string;
}

export type CogGameType = 'memory_lane' | 'routine_recall';

export interface CogEventPayload {
  game: CogGameType;
  item: string;
  correct: boolean;
  responseMs: number;
  hintUsed: boolean;
  level: number;
  elderLanguage?: 'en' | 'hi';
}

export interface CognitiveGameLevel {
  game: CogGameType;
  level: number; // 1 - 5
  consecutiveCorrect: number;
  consecutiveWrong: number;
  history: Array<{
    timestamp: string;
    level: number;
    correct: boolean;
    responseMs: number;
    hintUsed: boolean;
  }>;
}

export interface CognitiveMetrics {
  level: number;
  levelHistory: Array<{ date: string; level: number }>;
  weeklySessions: number;
  accuracyWeekly: number; // 0 - 100%
  avgResponseTimeMs: number;
  bestTimeOfDay: string; // e.g. "Morning (9:00 AM – 11:30 AM)"
  streakDays: number;
  sustainedDropDetected: boolean;
  baselineAccuracy: number;
  dropDurationDays: number;
  alertMessage?: string; // "Worth mentioning to the doctor"
}

// ---------------------------------------------------------------------
// PROMPT 16: ROUTINE RECALL QUESTION
// ---------------------------------------------------------------------
export interface RoutineRecallQuestion {
  id: string;
  questionText: string;
  questionTextHi: string;
  category: 'medication_routine' | 'recent_event' | 'meal_anchor';
  options: Array<{
    id: string;
    text: string;
    textHi: string;
    isCorrect: boolean;
    color?: string;
    iconName?: string;
  }>;
  hint: string;
  hintHi: string;
  explanation: string;
  explanationHi: string;
  sourceFact: string;
}

// ---------------------------------------------------------------------
// PROMPT 20: HYDRATION & DAILY ACTIVITY REMINDERS
// ---------------------------------------------------------------------
export type ActivityType = 'hydration' | 'walk' | 'call' | 'custom';

export interface DailyActivityReminder {
  id: string;
  elderId: string;
  type: ActivityType;
  title: string;
  titleHi: string;
  description: string;
  descriptionHi: string;
  timeAnchor: 'morning' | 'midday' | 'evening' | 'bedtime';
  scheduledTime: string; // e.g. "10:30 AM"
  isCompletedToday: boolean;
  completedAt?: string;
  dailyTarget?: number; // e.g. 6 glasses
  currentProgress?: number; // e.g. 4 glasses completed
  icon: string;
  isConfigurable: boolean;
}

// ---------------------------------------------------------------------
// PROMPT 19: OFFLINE-FIRST EVENT QUEUE
// ---------------------------------------------------------------------
export interface QueuedOfflineEvent {
  clientUuid: string;
  event: Omit<AdeptEvent, 'id' | 'createdAt'>;
  queuedAt: string;
  retryCount: number;
}



