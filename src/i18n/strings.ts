export type Language = 'en' | 'hi';

export interface Translations {
  appName: string;
  tagline: string;
  safeToSpendPrefix: string;
  safeToSpendSuffix: string;
  leftThisMonth: string;
  daysUntilNext: string;
  todaySpend: string;
  dailySafeLimit: string;
  onTrack: string;
  spendingFaster: string;
  overBudget: string;
  navHome: string;
  navAdd: string;
  navInsights: string;
  navSettings: string;
  recentExpenses: string;
  categoryBreakdown: string;
  quickRepeat: string;
  privacyNote: string;
  weeklySummary: string;
  checkinQuestion: string;
  save: string;
  cancel: string;
}

export const STRINGS: Record<Language, Translations> = {
  en: {
    appName: 'MoneyMate',
    tagline: 'Make your allowance last the whole month.',
    safeToSpendPrefix: 'You can safely spend',
    safeToSpendSuffix: 'today',
    leftThisMonth: 'left this month',
    daysUntilNext: 'days until your next allowance',
    todaySpend: "Today's spend",
    dailySafeLimit: 'Daily safe limit',
    onTrack: 'On track',
    spendingFaster: 'Spending faster than plan',
    overBudget: 'Over budget',
    navHome: 'Home',
    navAdd: 'Add',
    navInsights: 'Insights',
    navSettings: 'Settings',
    recentExpenses: 'Recent expenses',
    categoryBreakdown: 'This month by category',
    quickRepeat: 'One-tap repeat',
    privacyNote: 'We never read your SMS or bank accounts.',
    weeklySummary: 'This week at a glance',
    checkinQuestion: 'Did the safe-to-spend number change a spending choice this week?',
    save: 'Save',
    cancel: 'Cancel',
  },
  hi: {
    appName: 'MoneyMate',
    tagline: 'अपना मासिक पॉकेट मनी पूरा महीना चलाएं।',
    safeToSpendPrefix: 'आज आप आराम से खर्च कर सकते हैं',
    safeToSpendSuffix: '',
    leftThisMonth: 'इस महीने बाकी',
    daysUntilNext: 'अगले भत्ते में दिन',
    todaySpend: 'आज का खर्च',
    dailySafeLimit: 'रोज़ की सुरक्षित सीमा',
    onTrack: 'सही रफ़्तार',
    spendingFaster: 'तय योजना से तेज़ खर्च',
    overBudget: 'बजट से ज़्यादा',
    navHome: 'होम',
    navAdd: 'जोड़ें',
    navInsights: 'इनसाइट्स',
    navSettings: 'सेटिंग्स',
    recentExpenses: 'हाल के खर्च',
    categoryBreakdown: 'इस महीने का खर्च',
    quickRepeat: 'एक टैप में दोहराएं',
    privacyNote: 'हम कभी आपके SMS या बैंक खाते नहीं पढ़ते।',
    weeklySummary: 'इस हफ्ते का सारांश',
    checkinQuestion: 'क्या आज की सुरक्षित सीमा ने इस हफ्ते आपका कोई खर्च बदला?',
    save: 'सेव करें',
    cancel: 'रद्द करें',
  },
};
