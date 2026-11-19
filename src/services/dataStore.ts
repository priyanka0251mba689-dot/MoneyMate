import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { OperationType, auth, db, handleFirestoreError } from '../firebase';
import {
  AlertSettings,
  AnalyticsEvent,
  AnalyticsEventName,
  Budget,
  Expense,
  PilotSummary,
  UserProfile,
  WaitlistEntry,
  WeeklyCheckin,
} from '../types/moneymate';
import { getISOWeekKey, getTodayISO } from '../utils/budgetMath';
import { LocalWorkspaceState, createSeedWorkspace } from './seedData';

const STORAGE_KEY = 'moneymate_workspace_v1';

export function loadLocalWorkspace(): LocalWorkspaceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = createSeedWorkspace();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw) as LocalWorkspaceState;
    if (!parsed.budget || !parsed.profile) {
      const seed = createSeedWorkspace();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    return parsed;
  } catch {
    return createSeedWorkspace();
  }
}

export function saveLocalWorkspace(state: LocalWorkspaceState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to persist local workspace', err);
  }
}

export function resetLocalWorkspaceToBlank(name = 'Student'): LocalWorkspaceState {
  const today = getTodayISO();
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);
  const nextIso = nextMonth.toISOString().slice(0, 10);
  const nowIso = new Date().toISOString();
  const fresh: LocalWorkspaceState = {
    profile: {
      uid: 'demo-student',
      name,
      onboardingCompleted: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    budget: {
      userId: 'demo-student',
      allowance: 8000,
      cycleStartDate: today,
      nextAllowanceDate: nextIso,
      fixedCosts: [],
      updatedAt: nowIso,
    },
    expenses: [],
    alertSettings: {
      userId: 'demo-student',
      overspendAlertsEnabled: true,
      dailyReminderEnabled: true,
      dailyReminderTime: '21:00',
      browserNotificationsEnabled: false,
      updatedAt: nowIso,
    },
    checkins: [],
    events: [],
    waitlistEntry: null,
    demoPilotSummaries: createSeedWorkspace().demoPilotSummaries,
    demoWaitlistEntries: createSeedWorkspace().demoWaitlistEntries,
  };
  saveLocalWorkspace(fresh);
  return fresh;
}

export function subscribeUserFirestore(
  uid: string,
  callbacks: {
    onProfile: (p: UserProfile | null) => void;
    onBudget: (b: Budget | null) => void;
    onExpenses: (e: Expense[]) => void;
    onAlertSettings: (s: AlertSettings | null) => void;
    onCheckins: (c: WeeklyCheckin[]) => void;
    onEvents: (ev: AnalyticsEvent[]) => void;
  }
): () => void {
  const unsubs: Array<() => void> = [];

  const profilePath = `users/${uid}`;
  unsubs.push(
    onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        callbacks.onProfile(snap.exists() ? (snap.data() as UserProfile) : null);
      },
      (err) => handleFirestoreError(err, OperationType.GET, profilePath)
    )
  );

  const budgetPath = `users/${uid}/budgets/current`;
  unsubs.push(
    onSnapshot(
      doc(db, 'users', uid, 'budgets', 'current'),
      (snap) => {
        callbacks.onBudget(snap.exists() ? (snap.data() as Budget) : null);
      },
      (err) => handleFirestoreError(err, OperationType.GET, budgetPath)
    )
  );

  const expensesPath = `users/${uid}/expenses`;
  unsubs.push(
    onSnapshot(
      query(collection(db, 'users', uid, 'expenses'), orderBy('date', 'desc')),
      (snap) => {
        const list: Expense[] = snap.docs.map((d) => ({
          ...(d.data() as Expense),
          id: d.id,
        }));
        callbacks.onExpenses(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, expensesPath)
    )
  );

  const settingsPath = `users/${uid}/settings/alerts`;
  unsubs.push(
    onSnapshot(
      doc(db, 'users', uid, 'settings', 'alerts'),
      (snap) => {
        callbacks.onAlertSettings(snap.exists() ? (snap.data() as AlertSettings) : null);
      },
      (err) => handleFirestoreError(err, OperationType.GET, settingsPath)
    )
  );

  const checkinsPath = `users/${uid}/checkins`;
  unsubs.push(
    onSnapshot(
      collection(db, 'users', uid, 'checkins'),
      (snap) => {
        const list = snap.docs.map((d) => ({ ...(d.data() as WeeklyCheckin), id: d.id }));
        callbacks.onCheckins(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, checkinsPath)
    )
  );

  const eventsPath = `users/${uid}/events`;
  unsubs.push(
    onSnapshot(
      collection(db, 'users', uid, 'events'),
      (snap) => {
        const list = snap.docs.map((d) => ({ ...(d.data() as AnalyticsEvent), id: d.id }));
        callbacks.onEvents(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, eventsPath)
    )
  );

  return () => {
    unsubs.forEach((u) => u());
  };
}

export async function saveProfileCloud(uid: string, profile: UserProfile): Promise<void> {
  const path = `users/${uid}`;
  const now = new Date().toISOString();
  const payload: UserProfile = {
    uid,
    name: profile.name.slice(0, 100) || 'Student',
    ...(profile.email ? { email: profile.email.slice(0, 160) } : {}),
    ...(profile.college ? { college: profile.college.slice(0, 140) } : {}),
    ...(profile.year ? { year: profile.year } : {}),
    ...(profile.stayType ? { stayType: profile.stayType } : {}),
    onboardingCompleted: profile.onboardingCompleted,
    createdAt: profile.createdAt || now,
    updatedAt: now,
  };
  try {
    await setDoc(doc(db, 'users', uid), payload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveBudgetCloud(uid: string, budget: Budget): Promise<void> {
  const path = `users/${uid}/budgets/current`;
  const payload: Budget = {
    userId: uid,
    allowance: Math.max(0, Math.min(10000000, Number(budget.allowance) || 0)),
    cycleStartDate: budget.cycleStartDate,
    nextAllowanceDate: budget.nextAllowanceDate,
    fixedCosts: budget.fixedCosts.slice(0, 25).map((f) => ({
      id: f.id,
      label: f.label.slice(0, 60),
      amount: Math.max(0, Number(f.amount) || 0),
    })),
    updatedAt: new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, 'users', uid, 'budgets', 'current'), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function upsertExpenseCloud(uid: string, expense: Expense): Promise<void> {
  const id = expense.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 100) || `exp-${Date.now()}`;
  const path = `users/${uid}/expenses/${id}`;
  const now = new Date().toISOString();
  const payload: Expense = {
    id,
    userId: uid,
    amount: Math.max(1, Math.min(1000000, Number(expense.amount))),
    category: expense.category,
    paymentMode: expense.paymentMode,
    ...(expense.note?.trim() ? { note: expense.note.trim().slice(0, 140) } : {}),
    date: expense.date,
    createdAt: expense.createdAt || now,
    updatedAt: now,
  };
  try {
    await setDoc(doc(db, 'users', uid, 'expenses', id), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteExpenseCloud(uid: string, expenseId: string): Promise<void> {
  const path = `users/${uid}/expenses/${expenseId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'expenses', expenseId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveAlertSettingsCloud(uid: string, settings: AlertSettings): Promise<void> {
  const path = `users/${uid}/settings/alerts`;
  const payload: AlertSettings = {
    userId: uid,
    overspendAlertsEnabled: settings.overspendAlertsEnabled,
    dailyReminderEnabled: settings.dailyReminderEnabled,
    dailyReminderTime: settings.dailyReminderTime,
    browserNotificationsEnabled: Boolean(settings.browserNotificationsEnabled),
    updatedAt: new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, 'users', uid, 'settings', 'alerts'), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveWeeklyCheckinCloud(uid: string, checkin: WeeklyCheckin): Promise<void> {
  const docId = checkin.weekKey.replace(/[^a-zA-Z0-9_-]/g, '_');
  const path = `users/${uid}/checkins/${docId}`;
  const payload: WeeklyCheckin = {
    userId: uid,
    weekKey: checkin.weekKey,
    totalSpent: Math.max(0, checkin.totalSpent),
    topCategory: checkin.topCategory.slice(0, 64),
    daysOnTrack: Math.max(0, Math.min(7, checkin.daysOnTrack)),
    changedSpendingChoice: checkin.changedSpendingChoice,
    createdAt: checkin.createdAt || new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, 'users', uid, 'checkins', docId), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function logAnalyticsEventCloud(
  uid: string,
  eventName: AnalyticsEventName
): Promise<void> {
  const id = `${eventName}_${Date.now()}`;
  const path = `users/${uid}/events/${id}`;
  const payload: AnalyticsEvent = {
    userId: uid,
    eventName,
    weekKey: getISOWeekKey(getTodayISO()),
    createdAt: new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, 'users', uid, 'events', id), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function saveWaitlistEntryCloud(entry: WaitlistEntry): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const path = `waitlist/${uid}`;
  const now = new Date().toISOString();
  const payload: WaitlistEntry = {
    userId: uid,
    name: entry.name.trim().slice(0, 100),
    contact: entry.contact.trim().slice(0, 160),
    college: entry.college.trim().slice(0, 140),
    year: entry.year,
    stayType: entry.stayType,
    preCommit49: entry.preCommit49,
    ...(entry.preCommitObjection?.trim()
      ? { preCommitObjection: entry.preCommitObjection.trim().slice(0, 300) }
      : {}),
    createdAt: entry.createdAt || now,
    updatedAt: now,
  };
  try {
    await setDoc(doc(db, 'waitlist', uid), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateWaitlistPreCommitCloud(
  preCommit49: WaitlistEntry['preCommit49'],
  preCommitObjection: string
): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const path = `waitlist/${uid}`;
  try {
    await updateDoc(doc(db, 'waitlist', uid), {
      preCommit49,
      preCommitObjection: preCommitObjection.trim().slice(0, 300),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function syncPilotSummaryCloud(uid: string, summary: PilotSummary): Promise<void> {
  const path = `pilotMetrics/${uid}`;
  const payload: PilotSummary = {
    userId: uid,
    displayName: summary.displayName.slice(0, 100),
    ...(summary.college ? { college: summary.college.slice(0, 140) } : {}),
    ...(summary.stayType ? { stayType: summary.stayType.slice(0, 40) } : {}),
    week4Active: summary.week4Active,
    weeklyActionsCount: summary.weeklyActionsCount,
    activeWeeksCount: summary.activeWeeksCount,
    lastCheckinAnswer: summary.lastCheckinAnswer,
    preCommit49: summary.preCommit49,
    ...(summary.preCommitObjection
      ? { preCommitObjection: summary.preCommitObjection.slice(0, 300) }
      : {}),
    updatedAt: new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, 'pilotMetrics', uid), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function fetchAdminPilotDataCloud(): Promise<{
  pilotSummaries: PilotSummary[];
  waitlistEntries: WaitlistEntry[];
}> {
  try {
    const [pilotSnap, waitlistSnap] = await Promise.all([
      getDocs(collection(db, 'pilotMetrics')),
      getDocs(collection(db, 'waitlist')),
    ]);
    return {
      pilotSummaries: pilotSnap.docs.map((d) => d.data() as PilotSummary),
      waitlistEntries: waitlistSnap.docs.map((d) => ({ ...(d.data() as WaitlistEntry), id: d.id })),
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'pilotMetrics');
  }
}

export async function deleteAllUserDataCloud(uid: string): Promise<void> {
  try {
    const subcols = ['budgets', 'expenses', 'settings', 'checkins', 'events'];
    const batch = writeBatch(db);
    for (const sub of subcols) {
      const snap = await getDocs(collection(db, 'users', uid, sub));
      snap.docs.forEach((d) => batch.delete(d.ref));
    }
    batch.delete(doc(db, 'users', uid));
    batch.delete(doc(db, 'pilotMetrics', uid));
    batch.delete(doc(db, 'waitlist', uid));
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${uid}`);
  }
}
