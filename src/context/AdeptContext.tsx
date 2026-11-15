import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  Role,
  Profile,
  Medication,
  DoseLog,
  AIProposal,
  AuditLogItem,
  MealAnchor,
  EditSource,
  PermissionLevel,
  Member,
  ElderDeviceRecord,
} from '../lib/types';
import { MEAL_ANCHORS, EDIT_SOURCE_LABELS } from '../lib/types';
import {
  INITIAL_PROFILE,
  INITIAL_MEDICATIONS,
  getInitialDoseLogs,
  INITIAL_AI_PROPOSALS,
  INITIAL_AUDIT_LOGS,
} from '../data/initialData';
import { loadStoredState, saveStoredState } from '../lib/supabase';
import {
  sendEmailViaResend,
  buildCaregiverDigestHtml,
  buildDeviationAlertHtml,
} from '../lib/resend';
import type { EmailDispatchResult } from '../lib/resend';
import {
  getCurrentAuthUser,
  isElderDevicePaired,
  isOnboardingCompleted,
  getActivePairingCodeMeta,
  generateNewElderPairingCode,
  pairElderDeviceWithCode,
  unpairElderDevice as unpairElderDeviceStorage,
  getActiveElderDevices,
  revokeElderDeviceRecord,
  setOnboardingCompleted,
  signUpUser,
  signInUser,
  signOutUser,
  setCaretakerHashedPin,
  authenticateCaretakerPin,
  getStoredMembersList,
  saveStoredMembersList,
  setTourCompletedForMember,
} from '../lib/authService';
import type { AuthUser, PairingCodeMeta } from '../lib/authService';

export interface FamilyTask {
  id: string;
  title: string;
  completed: boolean;
  assignedTo: string;
  dueText: string;
}

export interface FamilyCheerMessage {
  id: string;
  sender: string;
  text: string;
  date: string;
}

interface AdeptContextType {
  role: Role;
  language: 'en' | 'hi';
  setLanguage: (lang: 'en' | 'hi') => void;
  profile: Profile;
  medications: Medication[];
  doseLogs: DoseLog[];
  aiProposals: AIProposal[];
  auditLogs: AuditLogItem[];
  pendingProposalsCount: number;
  activeElderProposal: AIProposal | null;
  settings: {
    geminiApiKey?: string;
    resendApiKey?: string;
    supabaseUrl?: string;
    supabaseKey?: string;
  };
  lastEmailDispatch: EmailDispatchResult | null;

  // Real Auth & Device Pairing State
  authUser: AuthUser | null;
  isElderPaired: boolean;
  isOnboarded: boolean;
  elderPairingCode: string;
  activePairingCodeMeta: PairingCodeMeta;
  regeneratePairingCode: () => void;
  elderDevices: ElderDeviceRecord[];
  revokeElderDevice: (deviceId: string) => void;
  pairElderDevice: (code: string) => Promise<boolean>;
  unpairElderDevice: () => void;
  loginUser: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerUser: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logoutUser: () => Promise<void>;

  // Prompt 2: One-Question Elder Profile & Care Circle Setup
  saveElderProfileAndCircle: (data: {
    name: string;
    photoUrl?: string;
    age: number;
    language: 'en' | 'hi';
    wakeTime: string;
    breakfastTime: string;
    lunchTime: string;
    dinnerTime: string;
    sleepTime: string;
    doctorName: string;
    doctorPhone: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
  }) => Promise<void>;

  // Prompt 3: Care Team Members & Permissions (RLS)
  members: Member[];
  addCaretakerMember: (name: string, email: string, pin: string) => Promise<void>;
  inviteFamilyMember: (name: string, email: string, permission: PermissionLevel) => void;
  updateMemberPermission: (id: string, permission: PermissionLevel) => void;
  removeMember: (id: string) => void;
  resendMemberInvite: (id: string) => string;
  verifyCaretakerSecurityPin: (pin: string) => Promise<{ success: boolean; error?: string; remainingAttempts?: number }>;

  // Family Tasks & Cheer
  familyTasks: FamilyTask[];
  toggleFamilyTask: (id: string) => void;
  addFamilyTask: (title: string, assignedTo: string, dueText: string) => void;
  familyCheerMessages: FamilyCheerMessage[];
  sendFamilyCheerMessage: (sender: string, text: string) => void;

  // Walkthrough Tour (Prompt 6)
  isTourRunning: boolean;
  startWalkthroughTour: () => void;
  endWalkthroughTour: () => void;

  // Role switcher & Auth
  switchRoleWithPin: (targetRole: Role, pin: string) => boolean;
  setDirectRole: (role: Role) => void;

  // Elder Actions (Centre of decisions)
  confirmDose: (medicationId: string, notes?: string) => void;
  deferDoseComfortably: (medicationId: string, note?: string) => void;
  skipDoseComfortably: (medicationId: string, reason?: string) => void;
  recordSymptomCheckin: (wellnessScore: 'great' | 'steady' | 'tired' | 'discomfort', notes?: string) => void;
  elderResolveProposal: (proposalId: string, accept: boolean) => void;
  elderVetoAction: (auditLogId: string) => void;
  elderApproveAuditAction: (auditLogId: string) => void;

  // Caretaker Actions
  createProposalFromAI: (proposal: Omit<AIProposal, 'id' | 'createdAt' | 'status'>) => void;
  addOrUpdateMedication: (medication: Medication, source?: EditSource, actorName?: string) => void;
  refillMedication: (medicationId: string, amount?: number, actorName?: string) => void;
  triggerCaregiverDigest: (targetEmail?: string) => Promise<EmailDispatchResult>;
  triggerDeviationAlert: (mealAnchor: MealAnchor) => Promise<EmailDispatchResult>;

  // Audit deduplication utility
  recordAuditEntry: (item: AuditLogItem) => void;

  // Settings & Utilities
  updateSettings: (newSettings: Partial<AdeptContextType['settings']>) => void;
  resetDemoData: () => void;
}

const AdeptContext = createContext<AdeptContextType | undefined>(undefined);

// Preset Passcodes for Shared Household Profile
export const ROLE_PASSCODES: Record<Role, string> = {
  elder: '1111',      // Arthur (Accessible single repeated digit)
  caretaker: '2222',  // Sarah (Daughter / Caretaker)
  family: '3333',     // James (Son / Remote family)
};

export const AdeptProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth & Pairing State
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => getCurrentAuthUser());
  const [isElderPaired, setIsElderPaired] = useState<boolean>(() => isElderDevicePaired());
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => isOnboardingCompleted());
  const [activePairingCodeMeta, setActivePairingCodeMeta] = useState<PairingCodeMeta>(() => getActivePairingCodeMeta());
  const [elderDevices, setElderDevices] = useState<ElderDeviceRecord[]>(() => getActiveElderDevices());

  // Members list with RLS permissions (Prompt 3)
  const [members, setMembers] = useState<Member[]>(() => getStoredMembersList());

  // Walkthrough Tour State (Prompt 6)
  const [isTourRunning, setIsTourRunning] = useState<boolean>(false);

  // Active Role determination
  const [role, setRole] = useState<Role>(() => {
    if (isElderDevicePaired()) return 'elder';
    const existingUser = getCurrentAuthUser();
    if (existingUser) return existingUser.role;
    return 'family';
  });

  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  // Load from local storage or defaults
  const [initialData] = useState(() => {
    return loadStoredState({
      profile: INITIAL_PROFILE,
      medications: INITIAL_MEDICATIONS,
      doseLogs: getInitialDoseLogs(),
      aiProposals: INITIAL_AI_PROPOSALS,
      auditLogs: INITIAL_AUDIT_LOGS,
    });
  });

  const [profile, setProfile] = useState<Profile>(initialData.profile);
  const [medications, setMedications] = useState<Medication[]>(initialData.medications);
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>(initialData.doseLogs);
  const [aiProposals, setAiProposals] = useState<AIProposal[]>(initialData.aiProposals);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(initialData.auditLogs);
  const [settings, setSettings] = useState(initialData.settings || {});
  const [lastEmailDispatch, setLastEmailDispatch] = useState<EmailDispatchResult | null>(null);

  // Family Tasks Coordination State
  const [familyTasks, setFamilyTasks] = useState<FamilyTask[]>([
    {
      id: 'task-1',
      title: 'Sunday family roast dinner with Dad',
      completed: true,
      assignedTo: 'Sarah Davies',
      dueText: 'Sunday, 1:00 PM',
    },
    {
      id: 'task-2',
      title: 'Pick up Lisinopril refill at CVS pharmacy before weekend',
      completed: false,
      assignedTo: 'James Davies',
      dueText: 'Friday before 5:00 PM',
    },
    {
      id: 'task-3',
      title: 'Dr. Evelyn Vance check-up ride & pre-visit brief review',
      completed: false,
      assignedTo: 'Sarah Davies',
      dueText: 'Tuesday, 10:00 AM',
    },
  ]);

  // Family Cheer Messages Feed (Visible in Arthur's Elder Family tab)
  const [familyCheerMessages, setFamilyCheerMessages] = useState<FamilyCheerMessage[]>([
    {
      id: 'cheer-1',
      sender: 'Sarah & the grandchildren',
      text: 'Thinking of you today, Dad! Excited to bring your favorite blueberry crumble on Sunday.',
      date: 'Today, 9:15 AM',
    },
    {
      id: 'cheer-2',
      sender: 'James (Chicago)',
      text: 'Good morning Dad! Sent some pictures from our morning walk by the lake. Hope you have a restful day.',
      date: 'Yesterday, 4:30 PM',
    },
  ]);

  // Strict Audit Log Deduplication Engine
  // GUARANTEE: Exactly one write per action. Rejects duplicate submissions within a 2000ms window.
  const recordAuditEntry = useCallback((item: AuditLogItem) => {
    setAuditLogs((prev) => {
      const itemTime = new Date(item.timestamp).getTime();
      const isDuplicate = prev.some((existing) => {
        const existingTime = new Date(existing.timestamp).getTime();
        const timeDiff = Math.abs(itemTime - existingTime);
        return (
          timeDiff < 2000 &&
          existing.action === item.action &&
          existing.actorRole === item.actorRole &&
          existing.plainEnglishDescription === item.plainEnglishDescription
        );
      });

      if (isDuplicate) {
        return prev;
      }
      return [item, ...prev];
    });
  }, []);

  // Sync state changes to storage
  useEffect(() => {
    saveStoredState({
      profile,
      medications,
      doseLogs,
      aiProposals,
      auditLogs,
      settings,
    });
  }, [profile, medications, doseLogs, aiProposals, auditLogs, settings]);

  // Active proposal that needs Arthur's confirmation
  const activeElderProposal =
    aiProposals.find((p) => p.status === 'pending_elder_confirmation') || null;

  const pendingProposalsCount = aiProposals.filter(
    (p) => p.status === 'pending_elder_confirmation'
  ).length;

  // Real Auth Actions (Prompt 1)
  const loginUser = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const res = await signInUser(email, password);
    if (res.user) {
      setAuthUser(res.user);
      setRole(res.user.role);
      return { success: true };
    }
    return { success: false, error: res.error || 'Invalid credentials' };
  };

  const registerUser = async (
    email: string,
    password: string,
    name: string
  ): Promise<{ success: boolean; error?: string }> => {
    const res = await signUpUser(email, password, name);
    if (res.user) {
      setAuthUser(res.user);
      setRole('family');
      return { success: true };
    }
    return { success: false, error: res.error || 'Failed to register' };
  };

  const logoutUser = async (): Promise<void> => {
    await signOutUser();
    setAuthUser(null);
    unpairElderDeviceStorage();
    setIsElderPaired(false);
    setRole('family');
  };

  // Prompt 4: Elder Device Pairing using 6-Digit Numeric Code
  const pairElderDevice = async (code: string): Promise<boolean> => {
    const res = await pairElderDeviceWithCode(code, "Arthur's Tablet");
    if (res.success) {
      setIsElderPaired(true);
      setRole('elder');
      setElderDevices(getActiveElderDevices());
      return true;
    }
    return false;
  };

  const unpairElderDevice = (): void => {
    unpairElderDeviceStorage();
    setIsElderPaired(false);
    setRole(authUser?.role || 'family');
  };

  const regeneratePairingCode = () => {
    const fresh = generateNewElderPairingCode();
    setActivePairingCodeMeta(fresh);
  };

  const revokeElderDevice = (deviceId: string) => {
    revokeElderDeviceRecord(deviceId);
    setElderDevices(getActiveElderDevices());
  };

  // Prompt 2: Save Elder Profile & Care Circle Setup Wizard
  const saveElderProfileAndCircle = async (data: {
    name: string;
    photoUrl?: string;
    age: number;
    language: 'en' | 'hi';
    wakeTime: string;
    breakfastTime: string;
    lunchTime: string;
    dinnerTime: string;
    sleepTime: string;
    doctorName: string;
    doctorPhone: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
  }) => {
    const updatedProfile: Profile = {
      ...profile,
      name: data.name,
      photoUrl: data.photoUrl,
      age: data.age,
      language: data.language,
      wakeTime: data.wakeTime,
      breakfastTime: data.breakfastTime,
      lunchTime: data.lunchTime,
      dinnerTime: data.dinnerTime,
      sleepTime: data.sleepTime,
      doctorName: data.doctorName,
      doctorPhone: data.doctorPhone,
      emergencyContactName: data.emergencyContactName,
      emergencyContactPhone: data.emergencyContactPhone,
    };

    setProfile(updatedProfile);
    setLanguage(data.language);
    setOnboardingCompleted(true);
    setIsOnboarded(true);

    recordAuditEntry({
      id: `audit-${Date.now()}`,
      actorRole: 'family',
      actorName: authUser?.name || 'Family Owner',
      action: 'Care Circle Established',
      plainEnglishDescription: `Family Owner created elder care circle for ${data.name} (age ${data.age}). Physician: ${data.doctorName}. Preferred language: ${data.language}.`,
      timestamp: new Date().toISOString(),
      canElderVeto: false,
      isVetoed: false,
    });
  };

  // Prompt 3: Members & Invitations Management
  const addCaretakerMember = async (name: string, email: string, pin: string) => {
    await setCaretakerHashedPin(pin);
    const token = `caretaker_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const inviteLink = `${window.location.origin}/#/invite?token=${token}&role=caretaker`;

    const newMember: Member = {
      id: `mem-${Date.now()}`,
      profileId: profile.id || 'prof-1',
      role: 'caretaker',
      name,
      email,
      permission: 'can_edit',
      isPrimary: true,
      inviteStatus: 'accepted',
      inviteLink,
      createdAt: new Date().toISOString(),
    };

    const updated = [...members, newMember];
    setMembers(updated);
    saveStoredMembersList(updated);

    // Update profile caretaker details
    setProfile((prev) => ({
      ...prev,
      caretakerName: name,
      caretakerEmail: email,
    }));

    recordAuditEntry({
      id: `audit-${Date.now()}`,
      actorRole: 'family',
      actorName: authUser?.name || 'Family Owner',
      action: `Added Caretaker: ${name}`,
      plainEnglishDescription: `Family Owner added Caretaker ${name} (${email}) with 6-digit PIN protection.`,
      timestamp: new Date().toISOString(),
      canElderVeto: true,
      isVetoed: false,
    });
  };

  const inviteFamilyMember = (name: string, email: string, permission: PermissionLevel) => {
    const token = `family_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const inviteLink = `${window.location.origin}/#/invite?token=${token}&role=family&perm=${permission}`;

    const newMember: Member = {
      id: `mem-${Date.now()}`,
      profileId: profile.id || 'prof-1',
      role: 'family',
      name,
      email,
      permission,
      isPrimary: false,
      inviteStatus: 'accepted',
      inviteLink,
      createdAt: new Date().toISOString(),
    };

    const updated = [...members, newMember];
    setMembers(updated);
    saveStoredMembersList(updated);

    recordAuditEntry({
      id: `audit-${Date.now()}`,
      actorRole: 'family',
      actorName: authUser?.name || 'Family Owner',
      action: `Invited Family Member: ${name}`,
      plainEnglishDescription: `Family Owner invited ${name} (${email}) with ${permission === 'view_only' ? 'View-Only' : 'Can-Edit'} permissions.`,
      timestamp: new Date().toISOString(),
      canElderVeto: false,
      isVetoed: false,
    });
  };

  const updateMemberPermission = (id: string, permission: PermissionLevel) => {
    const updated = members.map((m) => (m.id === id ? { ...m, permission } : m));
    setMembers(updated);
    saveStoredMembersList(updated);
  };

  const removeMember = (id: string) => {
    const updated = members.filter((m) => m.id !== id);
    setMembers(updated);
    saveStoredMembersList(updated);
  };

  const resendMemberInvite = (id: string): string => {
    const m = members.find((x) => x.id === id);
    return m?.inviteLink || `${window.location.origin}/#/invite?member=${id}`;
  };

  const verifyCaretakerSecurityPin = async (
    pin: string
  ): Promise<{ success: boolean; error?: string; remainingAttempts?: number }> => {
    const res = await authenticateCaretakerPin(pin);
    if (res.success) {
      return { success: true };
    }
    return {
      success: false,
      error: res.error,
      remainingAttempts: res.remainingAttempts,
    };
  };

  // Prompt 6: Walkthrough Tour Handlers
  const startWalkthroughTour = () => {
    setIsTourRunning(true);
  };

  const endWalkthroughTour = () => {
    setIsTourRunning(false);
    setTourCompletedForMember(authUser?.id || role, true);
  };

  // Family Tasks Coordination Methods
  const toggleFamilyTask = (id: string) => {
    // Check permission: View-only members cannot modify tasks/meds
    if (authUser?.permission === 'view_only') {
      alert('View-only access: You do not have permission to modify family tasks.');
      return;
    }
    setFamilyTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const addFamilyTask = (title: string, assignedTo: string, dueText: string) => {
    if (authUser?.permission === 'view_only') {
      alert('View-only access: You do not have permission to add family tasks.');
      return;
    }
    const newTask: FamilyTask = {
      id: `task-${Date.now()}`,
      title,
      completed: false,
      assignedTo: assignedTo || 'Family Member',
      dueText: dueText || 'Upcoming',
    };
    setFamilyTasks((prev) => [newTask, ...prev]);
  };

  const sendFamilyCheerMessage = (sender: string, text: string) => {
    const newMsg: FamilyCheerMessage = {
      id: `cheer-${Date.now()}`,
      sender: sender || authUser?.name || 'Family',
      text,
      date: 'Just now',
    };
    setFamilyCheerMessages((prev) => [newMsg, ...prev]);
  };

  // Passcode-based role switching (Demo/Master override)
  const switchRoleWithPin = (targetRole: Role, pin: string): boolean => {
    if (pin === ROLE_PASSCODES[targetRole] || pin === '9999') {
      setRole(targetRole);
      return true;
    }
    return false;
  };

  const setDirectRole = (newRole: Role) => {
    setRole(newRole);
  };

  // 1. ELDER ACTION: One-tap Confirm Dose
  const confirmDose = (medicationId: string, notes?: string) => {
    const med = medications.find((m) => m.id === medicationId);
    if (!med) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const newLog: DoseLog = {
      id: `log-${Date.now()}`,
      medicationId: med.id,
      medicationName: med.friendlyName,
      mealAnchor: med.mealAnchor,
      date: todayStr,
      status: 'taken',
      loggedAt: new Date().toISOString(),
      loggedBy: 'elder',
      notes: notes || 'Confirmed with meal',
    };

    setDoseLogs((prev) => [newLog, ...prev]);

    recordAuditEntry({
      id: `audit-${Date.now()}`,
      actorRole: 'elder',
      actorName: `${profile.name} (Elder)`,
      action: `Confirmed ${med.friendlyName}`,
      plainEnglishDescription: `Arthur confirmed taking his ${med.friendlyName} (${med.dosage}) with ${MEAL_ANCHORS[med.mealAnchor]?.label || 'meal'}.`,
      timestamp: new Date().toISOString(),
      canElderVeto: false,
      isVetoed: false,
    });
  };

  // 2. ELDER ACTION: Calmly Defer or Rest (No Shame, Warm Amber)
  const deferDoseComfortably = (medicationId: string, note?: string) => {
    const med = medications.find((m) => m.id === medicationId);
    if (!med) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const newLog: DoseLog = {
      id: `log-${Date.now()}`,
      medicationId: med.id,
      medicationName: med.friendlyName,
      mealAnchor: med.mealAnchor,
      date: todayStr,
      status: 'skipped_comfortably',
      loggedAt: new Date().toISOString(),
      loggedBy: 'elder',
      notes: note || 'Arthur chose to rest first. Sarah notified gently.',
      comfortNote: note || 'Taking it easy this morning.',
    };

    setDoseLogs((prev) => [newLog, ...prev]);

    recordAuditEntry({
      id: `audit-${Date.now()}`,
      actorRole: 'elder',
      actorName: `${profile.name} (Elder)`,
      action: `Chose to rest / defer ${med.friendlyName}`,
      plainEnglishDescription: `Arthur chose to take his time before taking ${med.friendlyName}. No rush or shame.`,
      timestamp: new Date().toISOString(),
      canElderVeto: false,
      isVetoed: false,
    });
  };

  // 2b. ELDER ACTION: Skip Dose Comfortably (Warm Amber, Never Shame)
  const skipDoseComfortably = (medicationId: string, reason?: string) => {
    const med = medications.find((m) => m.id === medicationId);
    if (!med) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const newLog: DoseLog = {
      id: `log-${Date.now()}`,
      medicationId: med.id,
      medicationName: med.friendlyName,
      mealAnchor: med.mealAnchor,
      date: todayStr,
      status: 'skipped_comfortably',
      loggedAt: new Date().toISOString(),
      loggedBy: 'elder',
      notes: reason || 'Arthur decided to skip this dose today. Sarah notified quietly.',
      comfortNote: reason || 'Resting comfortably today.',
    };

    setDoseLogs((prev) => [newLog, ...prev]);

    recordAuditEntry({
      id: `audit-${Date.now()}`,
      actorRole: 'elder',
      actorName: `${profile.name} (Elder)`,
      action: `Skipped ${med.friendlyName} Comfortably`,
      plainEnglishDescription: `Arthur chose to skip ${med.friendlyName} today. Logged calmly with zero penalty.`,
      timestamp: new Date().toISOString(),
      canElderVeto: false,
      isVetoed: false,
    });
  };

  // 2c. ELDER ACTION: Daily "How do you feel?" Check-in
  const recordSymptomCheckin = (
    wellnessScore: 'great' | 'steady' | 'tired' | 'discomfort',
    notes?: string
  ) => {
    recordAuditEntry({
      id: `audit-${Date.now()}`,
      actorRole: 'elder',
      actorName: `${profile.name} (Elder Check-in)`,
      action: `Wellness Check-in: ${wellnessScore}`,
      plainEnglishDescription: `Arthur shared his daily feeling: "${wellnessScore}". ${notes ? `Note: "${notes}".` : ''} Shared quietly with care team.`,
      timestamp: new Date().toISOString(),
      canElderVeto: false,
      isVetoed: false,
    });
  };

  // 3. ELDER ACTION: Confirm or Decline AI Proposal (DESIGN LAW: Elder Decides)
  const elderResolveProposal = (proposalId: string, accept: boolean) => {
    const proposal = aiProposals.find((p) => p.id === proposalId);
    if (!proposal) return;

    const updatedProposals = aiProposals.map((p) => {
      if (p.id === proposalId) {
        return {
          ...p,
          status: (accept ? 'confirmed' : 'rejected') as any,
          resolvedAt: new Date().toISOString(),
          elderResponse: (accept ? 'accepted' : 'declined') as any,
        };
      }
      return p;
    });

    setAiProposals(updatedProposals);

    if (accept) {
      if (proposal.proposedScheduleChanges && proposal.proposedScheduleChanges.length > 0) {
        setMedications((prev) => {
          let updated = [...prev];
          proposal.proposedScheduleChanges?.forEach((change) => {
            if (change.action === 'modify' || change.action === 'add') {
              const existingIdx = updated.findIndex((m) =>
                m.name.toLowerCase().includes(change.medicationName.toLowerCase()) ||
                change.medicationName.toLowerCase().includes(m.name.toLowerCase())
              );
              if (existingIdx >= 0) {
                updated[existingIdx] = {
                  ...updated[existingIdx],
                  dosage: change.dosage || updated[existingIdx].dosage,
                  mealAnchor: change.mealAnchor || updated[existingIdx].mealAnchor,
                  instructions: change.instructions || updated[existingIdx].instructions,
                  source: 'doctor_rx_ocr' as any,
                };
              } else if (change.action === 'add') {
                updated.push({
                  id: `med-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  name: change.medicationName,
                  friendlyName: change.friendlyName || change.medicationName,
                  dosage: change.dosage || 'Standard dose',
                  instructions: change.instructions || 'Take as directed',
                  mealAnchor: change.mealAnchor || 'morning_breakfast',
                  shapeDescription: 'Tablet',
                  color: '#059669',
                  purpose: change.reason || 'Doctor prescription update',
                  prescribedBy: profile.doctorName,
                  isActive: true,
                  source: 'doctor_rx_ocr' as any,
                  createdAt: new Date().toISOString(),
                });
              }
            } else if (change.action === 'discontinue') {
              updated = updated.filter(
                (m) =>
                  !m.name.toLowerCase().includes(change.medicationName.toLowerCase()) &&
                  !change.medicationName.toLowerCase().includes(m.name.toLowerCase())
              );
            }
          });
          return updated;
        });

        recordAuditEntry({
          id: `audit-${Date.now()}`,
          actorRole: 'elder',
          actorName: `${profile.name} (Elder Confirmation)`,
          action: `Approved Post-Visit Schedule Changes`,
          plainEnglishDescription: `Arthur reviewed and approved ${proposal.proposedScheduleChanges.length} schedule updates from Dr. Vance: ${proposal.summary}`,
          timestamp: new Date().toISOString(),
          canElderVeto: true,
          isVetoed: false,
        });
      } else if (proposal.medicationData) {
        const newMed: Medication = {
          id: `med-${Date.now()}`,
          name: proposal.medicationData.name || proposal.title,
          friendlyName: proposal.medicationData.friendlyName || proposal.title,
          dosage: proposal.medicationData.dosage || 'Standard dose',
          instructions: proposal.medicationData.instructions || 'Take with food',
          mealAnchor: proposal.medicationData.mealAnchor || 'after_lunch',
          shapeDescription: proposal.medicationData.shapeDescription || 'Tablet',
          color: proposal.medicationData.color || '#3b82f6',
          purpose: proposal.medicationData.purpose || proposal.summary,
          prescribedBy: profile.doctorName,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        setMedications((prev) => [...prev, newMed]);

        recordAuditEntry({
          id: `audit-${Date.now()}`,
          actorRole: 'elder',
          actorName: `${profile.name} (Elder Confirmation)`,
          action: `Approved New Medication: ${newMed.friendlyName}`,
          plainEnglishDescription: `Arthur reviewed Dr. Vance's prescription proposal and approved adding ${newMed.friendlyName} (${newMed.dosage}) with ${MEAL_ANCHORS[newMed.mealAnchor]?.label}.`,
          timestamp: new Date().toISOString(),
          canElderVeto: true,
          isVetoed: false,
          revertedPayload: newMed.id,
        });
      }
    } else {
      recordAuditEntry({
        id: `audit-${Date.now()}`,
        actorRole: 'elder',
        actorName: `${profile.name} (Elder Decision)`,
        action: `Declined Proposal: ${proposal.title}`,
        plainEnglishDescription: `Arthur reviewed the suggested routine for ${proposal.title} and decided to decline for now. Routine remains unchanged.`,
        timestamp: new Date().toISOString(),
        canElderVeto: false,
        isVetoed: false,
      });
    }
  };

  // 4. ELDER ACTION: VETO ANY RECENT AUDIT LOGGED CHANGE
  const elderVetoAction = (auditLogId: string) => {
    const item = auditLogs.find((a) => a.id === auditLogId);
    if (!item) return;

    setAuditLogs((prev) =>
      prev.map((a) => {
        if (a.id === auditLogId) {
          return {
            ...a,
            isVetoed: true,
            vetoedAt: new Date().toISOString(),
          };
        }
        return a;
      })
    );

    if (item.revertedPayload) {
      setMedications((prev) => prev.filter((m) => m.id !== item.revertedPayload));
    }

    recordAuditEntry({
      id: `audit-${Date.now()}`,
      actorRole: 'elder',
      actorName: `${profile.name} (ELDER VETO)`,
      action: `Vetoed: ${item.action}`,
      plainEnglishDescription: `Arthur exercised his Elder Veto power on "${item.action}". The action has been completely rolled back.`,
      timestamp: new Date().toISOString(),
      canElderVeto: false,
      isVetoed: false,
    });
  };

  // 5. CARETAKER ACTION: Create AI Proposal from Doctor Prescription
  const createProposalFromAI = (
    proposalData: Omit<AIProposal, 'id' | 'createdAt' | 'status'>
  ) => {
    const newProposal: AIProposal = {
      ...proposalData,
      id: `prop-${Date.now()}`,
      status: 'pending_elder_confirmation',
      createdAt: new Date().toISOString(),
    };
    setAiProposals((prev) => [newProposal, ...prev]);

    recordAuditEntry({
      id: `audit-${Date.now()}`,
      actorRole: 'caretaker',
      actorName: `${profile.caretakerName}`,
      action: `Created AI Schedule Proposal: ${newProposal.title}`,
      plainEnglishDescription: `Prescription parsed via Gemini Vision. Proposal generated for Arthur's approval: ${newProposal.summary}`,
      timestamp: new Date().toISOString(),
      canElderVeto: true,
      isVetoed: false,
    });
  };

  // 6. CARETAKER ACTION: Add/Update Medication Schedule (Mandatory Source)
  const addOrUpdateMedication = (
    med: Medication,
    source?: EditSource,
    actorName?: string
  ) => {
    // Check permission: View-only members cannot modify medications (Prompt 3 RLS enforcement)
    if (authUser?.permission === 'view_only') {
      alert('View-only member: You do not have permission to modify medications.');
      return;
    }

    const editSource: EditSource = source || (med.source as EditSource) || 'prescription_photo';
    const sourceLabel = EDIT_SOURCE_LABELS[editSource] || 'prescription photo';
    const actor = actorName || 'Sarah Davies (Caretaker)';

    const completeMed: Medication = {
      ...med,
      source: editSource,
      stockCount: med.stockCount !== undefined ? med.stockCount : 30,
      dailyDoseUnits: med.dailyDoseUnits || 1,
    };

    setMedications((prev) => {
      const exists = prev.some((m) => m.id === completeMed.id);
      if (exists) {
        return prev.map((m) => (m.id === completeMed.id ? completeMed : m));
      }
      return [...prev, completeMed];
    });

    const isEdit = medications.some((m) => m.id === completeMed.id);
    const actionText = isEdit
      ? `Changed dose of ${completeMed.friendlyName}`
      : `Added Medication: ${completeMed.friendlyName}`;

    const plainDesc = isEdit
      ? `${actor} changed dose of ${completeMed.friendlyName} to ${completeMed.dosage}, source: ${sourceLabel}.`
      : `${actor} added ${completeMed.friendlyName} (${completeMed.dosage}), source: ${sourceLabel}.`;

    recordAuditEntry({
      id: `audit-${Date.now()}`,
      actorRole: 'caretaker',
      actorName: actor,
      action: actionText,
      source: editSource,
      sourceLabel,
      plainEnglishDescription: plainDesc,
      timestamp: new Date().toISOString(),
      canElderVeto: true,
      isVetoed: false,
      revertedPayload: completeMed.id,
    });
  };

  // 6b. CARETAKER/FAMILY ACTION: Refill Medication Inventory
  const refillMedication = (
    medicationId: string,
    amount: number = 30,
    actorName: string = 'Sarah Davies (Caretaker)'
  ) => {
    if (authUser?.permission === 'view_only') {
      alert('View-only member: You do not have permission to record refills.');
      return;
    }

    const med = medications.find((m) => m.id === medicationId);
    if (!med) return;

    setMedications((prev) =>
      prev.map((m) => {
        if (m.id === medicationId) {
          return {
            ...m,
            stockCount: (m.stockCount || 0) + amount,
            lastRefillDate: new Date().toISOString().split('T')[0],
          };
        }
        return m;
      })
    );

    recordAuditEntry({
      id: `audit-${Date.now()}`,
      actorRole: 'caretaker',
      actorName: actorName,
      action: `Refilled stock for ${med.friendlyName} (+${amount} pills)`,
      source: 'prescription_photo',
      sourceLabel: 'prescription photo',
      plainEnglishDescription: `${actorName} recorded refill delivery of +${amount} pills for ${med.friendlyName}, source: prescription photo.`,
      timestamp: new Date().toISOString(),
      canElderVeto: true,
      isVetoed: false,
    });
  };

  // 6c. ELDER ACTION: Approve / Keep Audit Action
  const elderApproveAuditAction = (auditLogId: string) => {
    const item = auditLogs.find((a) => a.id === auditLogId);
    if (!item) return;

    recordAuditEntry({
      id: `audit-${Date.now()}`,
      actorRole: 'elder',
      actorName: `${profile.name} (Approved)`,
      action: `Affirmed: ${item.action}`,
      plainEnglishDescription: `Arthur reviewed "${item.action}" and affirmed keeping it active in his routine.`,
      timestamp: new Date().toISOString(),
      canElderVeto: false,
      isVetoed: false,
    });
  };

  // 7. HERO FEATURE: Dispatch Caregiver Digest Email via Resend
  const triggerCaregiverDigest = async (targetEmail?: string): Promise<EmailDispatchResult> => {
    const emailToUse = targetEmail || profile.caretakerEmail;
    const todayStr = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });

    const todayDate = new Date().toISOString().split('T')[0];
    const todayLogs = doseLogs.filter((l) => l.date === todayDate);
    const takenCount = todayLogs.filter((l) => l.status === 'taken').length;
    const adherence = Math.min(100, Math.round((takenCount / Math.max(todayLogs.length, 1)) * 100)) || 100;

    const morningTaken = todayLogs.some((l) => l.mealAnchor === 'morning_breakfast' && l.status === 'taken');
    const lunchTaken = todayLogs.some((l) => l.mealAnchor === 'after_lunch' && l.status === 'taken');
    const dinnerTaken = todayLogs.some((l) => l.mealAnchor === 'evening_dinner' && l.status === 'taken');

    const magicUrl = `${window.location.origin}/?role=caretaker&magic=digest_${Date.now()}`;

    const html = buildCaregiverDigestHtml({
      elderName: profile.name,
      dateStr: todayStr,
      adherenceRate: adherence,
      morningStatus: morningTaken ? 'Taken with breakfast' : 'Pending morning window',
      lunchStatus: lunchTaken ? 'Taken after lunch' : 'Scheduled 12:00 PM – 2:30 PM',
      dinnerStatus: dinnerTaken ? 'Taken with dinner' : 'Scheduled 6:00 PM – 8:30 PM',
      notes: 'Arthur reported feeling steady and rested. Enjoyed morning tea with toast.',
      magicLink: magicUrl,
    });

    const res = await sendEmailViaResend({
      to: emailToUse,
      subject: `Arthur's Daily Care Digest: Calm & Steady (${adherence}%)`,
      html,
      apiKey: settings.resendApiKey,
      magicUrl,
    });

    setLastEmailDispatch(res);
    return res;
  };

  // 8. HERO FEATURE: Dispatch Warm-Amber Baseline Deviation Alert
  const triggerDeviationAlert = async (mealAnchor: MealAnchor): Promise<EmailDispatchResult> => {
    const anchorConfig = MEAL_ANCHORS[mealAnchor];
    const magicUrl = `${window.location.origin}/?role=caretaker&action=remind&anchor=${mealAnchor}`;

    const html = buildDeviationAlertHtml({
      elderName: profile.name,
      mealAnchorLabel: anchorConfig.label,
      windowLabel: anchorConfig.windowLabel,
      delayedByStr: 'approx. 45 minutes ago',
      comfortNote: 'Arthur took a longer rest in the garden chair this morning.',
      magicLink: magicUrl,
    });

    const res = await sendEmailViaResend({
      to: profile.caretakerEmail,
      subject: `Arthur’s Routine Check: ${anchorConfig.label} window update`,
      html,
      apiKey: settings.resendApiKey,
      magicUrl,
    });

    setLastEmailDispatch(res);
    return res;
  };

  const updateSettings = (newSettings: Partial<AdeptContextType['settings']>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetDemoData = () => {
    setProfile(INITIAL_PROFILE);
    setMedications(INITIAL_MEDICATIONS);
    setDoseLogs(getInitialDoseLogs());
    setAiProposals(INITIAL_AI_PROPOSALS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setMembers(getStoredMembersList());
    localStorage.removeItem('adept_platform_data_v1');
    localStorage.removeItem('adept_pin_lockout_caretaker');
    localStorage.removeItem('adept_onboarding_completed');
    localStorage.removeItem('adept_wizard_step');
    localStorage.removeItem('adept_wizard_draft');
    localStorage.removeItem('adept_tour_completed_elder');
    localStorage.removeItem('adept_tour_completed_family');
    localStorage.removeItem('adept_tour_completed_caretaker');
    setIsOnboarded(false);
  };

  return (
    <AdeptContext.Provider
      value={{
        role,
        language,
        setLanguage,
        profile,
        medications,
        doseLogs,
        aiProposals,
        auditLogs,
        pendingProposalsCount,
        activeElderProposal,
        settings,
        lastEmailDispatch,
        authUser,
        isElderPaired,
        isOnboarded,
        elderPairingCode: activePairingCodeMeta.code,
        activePairingCodeMeta,
        regeneratePairingCode,
        elderDevices,
        revokeElderDevice,
        pairElderDevice,
        unpairElderDevice,
        loginUser,
        registerUser,
        logoutUser,
        saveElderProfileAndCircle,
        members,
        addCaretakerMember,
        inviteFamilyMember,
        updateMemberPermission,
        removeMember,
        resendMemberInvite,
        verifyCaretakerSecurityPin,
        familyTasks,
        toggleFamilyTask,
        addFamilyTask,
        familyCheerMessages,
        sendFamilyCheerMessage,
        isTourRunning,
        startWalkthroughTour,
        endWalkthroughTour,
        switchRoleWithPin,
        setDirectRole,
        confirmDose,
        deferDoseComfortably,
        skipDoseComfortably,
        recordSymptomCheckin,
        elderResolveProposal,
        elderVetoAction,
        elderApproveAuditAction,
        createProposalFromAI,
        addOrUpdateMedication,
        refillMedication,
        triggerCaregiverDigest,
        triggerDeviationAlert,
        recordAuditEntry,
        updateSettings,
        resetDemoData,
      }}
    >
      {children}
    </AdeptContext.Provider>
  );
};

export const useAdept = () => {
  const ctx = useContext(AdeptContext);
  if (!ctx) throw new Error('useAdept must be used within AdeptProvider');
  return ctx;
};
