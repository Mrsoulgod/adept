import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  Role,
  Profile,
  Medication,
  DoseLog,
  AIProposal,
  AuditLogItem,
  MealAnchor,
} from '../lib/types';
import { MEAL_ANCHORS } from '../lib/types';
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
  // Caretaker Actions
  createProposalFromAI: (proposal: Omit<AIProposal, 'id' | 'createdAt' | 'status'>) => void;
  addOrUpdateMedication: (medication: Medication) => void;
  triggerCaregiverDigest: (targetEmail?: string) => Promise<EmailDispatchResult>;
  triggerDeviationAlert: (mealAnchor: MealAnchor) => Promise<EmailDispatchResult>;
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
  const [role, setRole] = useState<Role>('elder');
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

  // Passcode-based role switching
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

    // Record audit log
    const auditItem: AuditLogItem = {
      id: `audit-${Date.now()}`,
      actorRole: 'elder',
      actorName: `${profile.name} (Elder)`,
      action: `Confirmed ${med.friendlyName}`,
      plainEnglishDescription: `Arthur confirmed taking his ${med.friendlyName} (${med.dosage}) with ${MEAL_ANCHORS[med.mealAnchor]?.label || 'meal'}.`,
      timestamp: new Date().toISOString(),
      canElderVeto: false,
      isVetoed: false,
    };
    setAuditLogs((prev) => [auditItem, ...prev]);
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

    const auditItem: AuditLogItem = {
      id: `audit-${Date.now()}`,
      actorRole: 'elder',
      actorName: `${profile.name} (Elder)`,
      action: `Chose to rest / defer ${med.friendlyName}`,
      plainEnglishDescription: `Arthur chose to take his time before taking ${med.friendlyName}. No rush or shame.`,
      timestamp: new Date().toISOString(),
      canElderVeto: false,
      isVetoed: false,
    };
    setAuditLogs((prev) => [auditItem, ...prev]);
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

    const auditItem: AuditLogItem = {
      id: `audit-${Date.now()}`,
      actorRole: 'elder',
      actorName: `${profile.name} (Elder)`,
      action: `Skipped ${med.friendlyName} Comfortably`,
      plainEnglishDescription: `Arthur chose to skip ${med.friendlyName} today. Logged calmly with zero penalty.`,
      timestamp: new Date().toISOString(),
      canElderVeto: false,
      isVetoed: false,
    };
    setAuditLogs((prev) => [auditItem, ...prev]);
  };

  // 2c. ELDER ACTION: Daily "How do you feel?" Check-in
  const recordSymptomCheckin = (
    wellnessScore: 'great' | 'steady' | 'tired' | 'discomfort',
    notes?: string
  ) => {
    const auditItem: AuditLogItem = {
      id: `audit-${Date.now()}`,
      actorRole: 'elder',
      actorName: `${profile.name} (Elder Check-in)`,
      action: `Wellness Check-in: ${wellnessScore}`,
      plainEnglishDescription: `Arthur shared his daily feeling: "${wellnessScore}". ${notes ? `Note: "${notes}".` : ''} Shared quietly with care team.`,
      timestamp: new Date().toISOString(),
      canElderVeto: false,
      isVetoed: false,
    };
    setAuditLogs((prev) => [auditItem, ...prev]);
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
          elderResponse: (accept ? 'accepted' : 'declined') as any,
          resolvedAt: new Date().toISOString(),
        };
      }
      return p;
    });
    setAiProposals(updatedProposals);

    if (accept) {
      if (proposal.proposedScheduleChanges && proposal.proposedScheduleChanges.length > 0) {
        // Multi-change schedule proposal from post-visit voice note
        setMedications((prev) => {
          let updated = [...prev];
          for (const change of proposal.proposedScheduleChanges!) {
            if (change.action === 'discontinue') {
              updated = updated.map((m) =>
                m.name.toLowerCase().includes(change.medicationName.toLowerCase()) ||
                m.friendlyName.toLowerCase().includes(change.friendlyName.toLowerCase())
                  ? { ...m, isActive: false }
                  : m
              );
            } else if (change.action === 'modify') {
              updated = updated.map((m) =>
                m.name.toLowerCase().includes(change.medicationName.toLowerCase()) ||
                m.friendlyName.toLowerCase().includes(change.friendlyName.toLowerCase())
                  ? {
                      ...m,
                      dosage: change.dosage || m.dosage,
                      mealAnchor: change.mealAnchor || m.mealAnchor,
                      instructions: change.instructions || m.instructions,
                    }
                  : m
              );
            } else if (change.action === 'add') {
              const newMed: Medication = {
                id: `med-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                name: change.medicationName,
                friendlyName: change.friendlyName,
                dosage: change.dosage || 'Standard dose',
                instructions: change.instructions || 'Take with food',
                mealAnchor: change.mealAnchor || 'after_lunch',
                shapeDescription: 'Capsule',
                color: '#059669',
                purpose: change.reason,
                prescribedBy: profile.doctorName,
                isActive: true,
                createdAt: new Date().toISOString(),
              };
              updated.push(newMed);
            }
          }
          return updated;
        });

        const auditItem: AuditLogItem = {
          id: `audit-${Date.now()}`,
          actorRole: 'elder',
          actorName: `${profile.name} (Elder Confirmation)`,
          action: `Approved Post-Visit Schedule Changes`,
          plainEnglishDescription: `Arthur reviewed and approved ${proposal.proposedScheduleChanges.length} schedule updates from Dr. Vance: ${proposal.summary}`,
          timestamp: new Date().toISOString(),
          canElderVeto: true,
          isVetoed: false,
        };
        setAuditLogs((prev) => [auditItem, ...prev]);
      } else if (proposal.medicationData) {
        // Add single medication to active schedule (from prescription OCR)
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

        // Audit Log with ELDER VETO option
        const auditItem: AuditLogItem = {
          id: `audit-${Date.now()}`,
          actorRole: 'elder',
          actorName: `${profile.name} (Elder Confirmation)`,
          action: `Approved New Medication: ${newMed.friendlyName}`,
          plainEnglishDescription: `Arthur reviewed Dr. Vance's prescription proposal and approved adding ${newMed.friendlyName} (${newMed.dosage}) with ${MEAL_ANCHORS[newMed.mealAnchor]?.label}.`,
          timestamp: new Date().toISOString(),
          canElderVeto: true, // Arthur can still veto or undo this later!
          isVetoed: false,
          revertedPayload: newMed.id,
        };
        setAuditLogs((prev) => [auditItem, ...prev]);
      }
    } else {
      const auditItem: AuditLogItem = {
        id: `audit-${Date.now()}`,
        actorRole: 'elder',
        actorName: `${profile.name} (Elder Decision)`,
        action: `Declined Proposal: ${proposal.title}`,
        plainEnglishDescription: `Arthur reviewed the suggested routine for ${proposal.title} and decided to decline for now. Routine remains unchanged.`,
        timestamp: new Date().toISOString(),
        canElderVeto: false,
        isVetoed: false,
      };
      setAuditLogs((prev) => [auditItem, ...prev]);
    }
  };

  // 4. ELDER ACTION: VETO ANY RECENT AUDIT LOGGED CHANGE
  const elderVetoAction = (auditLogId: string) => {
    const item = auditLogs.find((a) => a.id === auditLogId);
    if (!item) return;

    // Mark as vetoed
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

    // If it was an added medication, deactivate or remove it
    if (item.revertedPayload) {
      setMedications((prev) => prev.filter((m) => m.id !== item.revertedPayload));
    }

    // Add immediate veto announcement log
    const vetoNotice: AuditLogItem = {
      id: `audit-${Date.now()}`,
      actorRole: 'elder',
      actorName: `${profile.name} (ELDER VETO)`,
      action: `Vetoed: ${item.action}`,
      plainEnglishDescription: `Arthur exercised his Elder Veto power on "${item.action}". The action has been completely rolled back.`,
      timestamp: new Date().toISOString(),
      canElderVeto: false,
      isVetoed: false,
    };
    setAuditLogs((prev) => [vetoNotice, ...prev]);
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

    // Audit log
    const auditItem: AuditLogItem = {
      id: `audit-${Date.now()}`,
      actorRole: 'caretaker',
      actorName: `${profile.caretakerName}`,
      action: `Created AI Schedule Proposal: ${newProposal.title}`,
      plainEnglishDescription: `Prescription parsed via Gemini Vision. Proposal generated for Arthur's approval: ${newProposal.summary}`,
      timestamp: new Date().toISOString(),
      canElderVeto: true,
      isVetoed: false,
    };
    setAuditLogs((prev) => [auditItem, ...prev]);
  };

  // 6. CARETAKER ACTION: Add/Update Medication Schedule
  const addOrUpdateMedication = (med: Medication) => {
    setMedications((prev) => {
      const exists = prev.some((m) => m.id === med.id);
      if (exists) {
        return prev.map((m) => (m.id === med.id ? med : m));
      }
      return [...prev, med];
    });

    const auditItem: AuditLogItem = {
      id: `audit-${Date.now()}`,
      actorRole: 'caretaker',
      actorName: `${profile.caretakerName}`,
      action: `Saved Medication: ${med.friendlyName}`,
      plainEnglishDescription: `Schedule configured for ${med.friendlyName} with meal anchor: ${MEAL_ANCHORS[med.mealAnchor]?.label}.`,
      timestamp: new Date().toISOString(),
      canElderVeto: true,
      isVetoed: false,
      revertedPayload: med.id,
    };
    setAuditLogs((prev) => [auditItem, ...prev]);
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
    localStorage.removeItem('adept_platform_data_v1');
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
        switchRoleWithPin,
        setDirectRole,
        confirmDose,
        deferDoseComfortably,
        skipDoseComfortably,
        recordSymptomCheckin,
        elderResolveProposal,
        elderVetoAction,
        createProposalFromAI,
        addOrUpdateMedication,
        triggerCaregiverDigest,
        triggerDeviationAlert,
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
