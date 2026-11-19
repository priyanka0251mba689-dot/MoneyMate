export type ExpenseCategory =
  | 'Food & delivery'
  | 'Travel'
  | 'Subscriptions'
  | 'Shopping'
  | 'Social outings'
  | 'Academics'
  | 'Other';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Food & delivery',
  'Travel',
  'Subscriptions',
  'Shopping',
  'Social outings',
  'Academics',
  'Other',
];

export type PaymentMode = 'UPI' | 'Cash' | 'Card';
export const PAYMENT_MODES: PaymentMode[] = ['UPI', 'Cash', 'Card'];

export type StayType = 'Hostel' | 'PG' | 'Shared Flat';
export type CollegeYear = '1st Year' | '2nd Year' | '3rd Year' | '4th Year' | 'PG / Other';
export type CheckinAnswer = 'Yes' | 'No' | 'Not sure';
export type PreCommitChoice = 'Pending' | 'Yes' | 'No' | 'Maybe';

export type AnalyticsEventName =
  | 'onboarding_completed'
  | 'expense_added'
  | 'home_opened'
  | 'alert_opened'
  | 'weekly_checkin_answered';

export interface UserProfile {
  uid: string;
  name: string;
  email?: string;
  college?: string;
  year?: CollegeYear;
  stayType?: StayType;
  onboardingCompleted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FixedCostItem {
  id: string;
  label: string;
  amount: number;
}

export interface Budget {
  userId: string;
  allowance: number;
  cycleStartDate: string; // YYYY-MM-DD
  nextAllowanceDate: string; // YYYY-MM-DD
  fixedCosts: FixedCostItem[];
  updatedAt?: string;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: ExpenseCategory;
  paymentMode: PaymentMode;
  note?: string;
  date: string; // YYYY-MM-DD
  createdAt?: string;
  updatedAt?: string;
}

export interface AlertSettings {
  userId: string;
  overspendAlertsEnabled: boolean;
  dailyReminderEnabled: boolean;
  dailyReminderTime: string; // HH:MM
  browserNotificationsEnabled?: boolean;
  updatedAt?: string;
}

export interface WeeklyCheckin {
  id?: string;
  userId: string;
  weekKey: string;
  totalSpent: number;
  topCategory: string;
  daysOnTrack: number;
  changedSpendingChoice: CheckinAnswer;
  createdAt?: string;
}

export interface AnalyticsEvent {
  id?: string;
  userId: string;
  eventName: AnalyticsEventName;
  weekKey: string;
  createdAt?: string;
}

export interface WaitlistEntry {
  id?: string;
  userId: string;
  name: string;
  contact: string;
  college: string;
  year: CollegeYear;
  stayType: StayType;
  preCommit49: PreCommitChoice;
  preCommitObjection?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PilotSummary {
  userId: string;
  displayName: string;
  college?: string;
  stayType?: string;
  week4Active: boolean;
  weeklyActionsCount: number;
  activeWeeksCount: number;
  lastCheckinAnswer: 'None' | CheckinAnswer;
  preCommit49: PreCommitChoice;
  preCommitObjection?: string;
  updatedAt?: string;
}
