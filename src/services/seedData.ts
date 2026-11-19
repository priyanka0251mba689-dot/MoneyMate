import {
  AlertSettings,
  AnalyticsEvent,
  Budget,
  Expense,
  PilotSummary,
  UserProfile,
  WaitlistEntry,
  WeeklyCheckin,
} from '../types/moneymate';
import { addDaysISO, getISOWeekKey, getTodayISO } from '../utils/budgetMath';

export interface LocalWorkspaceState {
  profile: UserProfile;
  budget: Budget;
  expenses: Expense[];
  alertSettings: AlertSettings;
  checkins: WeeklyCheckin[];
  events: AnalyticsEvent[];
  waitlistEntry: WaitlistEntry | null;
  demoPilotSummaries: PilotSummary[];
  demoWaitlistEntries: WaitlistEntry[];
}

export function createSeedWorkspace(todayIso: string = getTodayISO()): LocalWorkspaceState {
  const cycleStartDate = addDaysISO(todayIso, -12);
  const nextAllowanceDate = addDaysISO(todayIso, 18);
  const userId = 'demo-student';
  const nowIso = new Date().toISOString();

  const profile: UserProfile = {
    uid: userId,
    name: 'Aarav Sharma',
    college: 'NIT Trichy',
    year: '2nd Year',
    stayType: 'Hostel',
    onboardingCompleted: true,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const budget: Budget = {
    userId,
    allowance: 8000,
    cycleStartDate,
    nextAllowanceDate,
    fixedCosts: [
      { id: 'fc-rent', label: 'Hostel room share', amount: 2200 },
      { id: 'fc-recharge', label: 'Jio 28-day recharge', amount: 249 },
      { id: 'fc-spotify', label: 'Spotify Student', amount: 59 },
    ],
    updatedAt: nowIso,
  };

  const expenses: Expense[] = [
    {
      id: 'exp-1',
      userId,
      amount: 85,
      category: 'Food & delivery',
      paymentMode: 'UPI',
      note: 'Night canteen maggi & chai',
      date: todayIso,
      createdAt: nowIso,
    },
    {
      id: 'exp-2',
      userId,
      amount: 40,
      category: 'Travel',
      paymentMode: 'UPI',
      note: 'Auto to main gate',
      date: addDaysISO(todayIso, -1),
      createdAt: nowIso,
    },
    {
      id: 'exp-3',
      userId,
      amount: 260,
      category: 'Food & delivery',
      paymentMode: 'UPI',
      note: 'Biryani bowl with hostelmates',
      date: addDaysISO(todayIso, -2),
      createdAt: nowIso,
    },
    {
      id: 'exp-4',
      userId,
      amount: 145,
      category: 'Academics',
      paymentMode: 'Cash',
      note: 'Lab record & printouts',
      date: addDaysISO(todayIso, -4),
      createdAt: nowIso,
    },
    {
      id: 'exp-5',
      userId,
      amount: 420,
      category: 'Social outings',
      paymentMode: 'UPI',
      note: 'Movie & snacks',
      date: addDaysISO(todayIso, -6),
      createdAt: nowIso,
    },
    {
      id: 'exp-6',
      userId,
      amount: 180,
      category: 'Food & delivery',
      paymentMode: 'UPI',
      note: 'Mess extra + cold coffee',
      date: addDaysISO(todayIso, -8),
      createdAt: nowIso,
    },
    {
      id: 'exp-7',
      userId,
      amount: 310,
      category: 'Shopping',
      paymentMode: 'Card',
      note: 'Laundry detergent & toiletries',
      date: addDaysISO(todayIso, -10),
      createdAt: nowIso,
    },
  ];

  const alertSettings: AlertSettings = {
    userId,
    overspendAlertsEnabled: true,
    dailyReminderEnabled: true,
    dailyReminderTime: '21:00',
    browserNotificationsEnabled: false,
    updatedAt: nowIso,
  };

  const currentWeekKey = getISOWeekKey(todayIso);
  const events: AnalyticsEvent[] = [
    {
      id: 'ev-1',
      userId,
      eventName: 'onboarding_completed',
      weekKey: currentWeekKey,
      createdAt: nowIso,
    },
    {
      id: 'ev-2',
      userId,
      eventName: 'home_opened',
      weekKey: currentWeekKey,
      createdAt: nowIso,
    },
    {
      id: 'ev-3',
      userId,
      eventName: 'expense_added',
      weekKey: currentWeekKey,
      createdAt: nowIso,
    },
  ];

  const demoPilotSummaries: PilotSummary[] = [
    {
      userId: 'pilot-01',
      displayName: 'Riya Verma',
      college: 'DU North Campus',
      stayType: 'PG',
      week4Active: true,
      weeklyActionsCount: 9,
      activeWeeksCount: 4,
      lastCheckinAnswer: 'Yes',
      preCommit49: 'Yes',
      preCommitObjection: '',
      updatedAt: nowIso,
    },
    {
      userId: 'pilot-02',
      displayName: 'Karthik Nair',
      college: 'NIT Trichy',
      stayType: 'Hostel',
      week4Active: true,
      weeklyActionsCount: 6,
      activeWeeksCount: 4,
      lastCheckinAnswer: 'Yes',
      preCommit49: 'Maybe',
      preCommitObjection: 'Would prefer UPI autopay once hostel Wi-Fi is stable',
      updatedAt: nowIso,
    },
    {
      userId: 'pilot-03',
      displayName: 'Sneha Kulkarni',
      college: 'COEP Pune',
      stayType: 'Hostel',
      week4Active: true,
      weeklyActionsCount: 5,
      activeWeeksCount: 4,
      lastCheckinAnswer: 'Not sure',
      preCommit49: 'No',
      preCommitObjection: 'Already tight on ₹6,000 allowance; ₹29 feels easier',
      updatedAt: nowIso,
    },
    {
      userId: 'pilot-04',
      displayName: 'Aditya Singh',
      college: 'VIT Vellore',
      stayType: 'Hostel',
      week4Active: false,
      weeklyActionsCount: 2,
      activeWeeksCount: 2,
      lastCheckinAnswer: 'No',
      preCommit49: 'Pending',
      preCommitObjection: '',
      updatedAt: nowIso,
    },
  ];

  const demoWaitlistEntries: WaitlistEntry[] = [
    {
      id: 'wl-1',
      userId: 'pilot-01',
      name: 'Riya Verma',
      contact: 'riya.verma@du.ac.in',
      college: 'DU North Campus',
      year: '1st Year',
      stayType: 'PG',
      preCommit49: 'Yes',
      createdAt: nowIso,
    },
    {
      id: 'wl-2',
      userId: 'pilot-02',
      name: 'Karthik Nair',
      contact: '+91 98401 22190',
      college: 'NIT Trichy',
      year: '2nd Year',
      stayType: 'Hostel',
      preCommit49: 'Maybe',
      preCommitObjection: 'Would prefer UPI autopay once hostel Wi-Fi is stable',
      createdAt: nowIso,
    },
  ];

  return {
    profile,
    budget,
    expenses,
    alertSettings,
    checkins: [],
    events,
    waitlistEntry: null,
    demoPilotSummaries,
    demoWaitlistEntries,
  };
}
