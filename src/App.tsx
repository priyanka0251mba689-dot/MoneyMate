import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import { BarChart3, Home, Plus, Settings } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomeTab } from './components/HomeTab';
import { InsightsTab } from './components/InsightsTab';
import { OnboardingModal } from './components/OnboardingModal';
import { OfflineIndicator, PWAInstallButton } from './components/PWAControls';
import { PilotAdminModal } from './components/PilotAdminModal';
import { QuickAddModal } from './components/QuickAddModal';
import { SettingsTab } from './components/SettingsTab';
import { WaitlistModal } from './components/WaitlistModal';
import { ADMIN_EMAIL, auth, googleProvider } from './firebase';
import { Language, STRINGS } from './i18n/strings';
import {
  deleteAllUserDataCloud,
  deleteExpenseCloud,
  loadLocalWorkspace,
  logAnalyticsEventCloud,
  resetLocalWorkspaceToBlank,
  saveAlertSettingsCloud,
  saveBudgetCloud,
  saveLocalWorkspace,
  saveProfileCloud,
  saveWaitlistEntryCloud,
  saveWeeklyCheckinCloud,
  subscribeUserFirestore,
  syncPilotSummaryCloud,
  updateWaitlistPreCommitCloud,
  upsertExpenseCloud,
} from './services/dataStore';
import { LocalWorkspaceState, createSeedWorkspace } from './services/seedData';
import {
  AlertSettings,
  AnalyticsEvent,
  AnalyticsEventName,
  Budget,
  CheckinAnswer,
  Expense,
  ExpenseCategory,
  PaymentMode,
  PilotSummary,
  PreCommitChoice,
  UserProfile,
  WaitlistEntry,
  WeeklyCheckin,
} from './types/moneymate';
import {
  calculateBudgetMetrics,
  calculateWeeklySummary,
  getISOWeekKey,
  getTodayISO,
} from './utils/budgetMath';

type ActiveTab = 'home' | 'insights' | 'settings';

function MoneyMateShell() {
  const [localState, setLocalState] = useState<LocalWorkspaceState>(() => loadLocalWorkspace());
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [cloudProfile, setCloudProfile] = useState<UserProfile | null>(null);
  const [cloudBudget, setCloudBudget] = useState<Budget | null>(null);
  const [cloudExpenses, setCloudExpenses] = useState<Expense[]>([]);
  const [cloudAlerts, setCloudAlerts] = useState<AlertSettings | null>(null);
  const [cloudCheckins, setCloudCheckins] = useState<WeeklyCheckin[]>([]);
  const [cloudEvents, setCloudEvents] = useState<AnalyticsEvent[]>([]);

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('moneymate_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });
  const [language, setLanguage] = useState<Language>('en');

  // Modals & sheets
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddCategory, setQuickAddCategory] = useState<ExpenseCategory | null>(null);
  const [quickAddAmount, setQuickAddAmount] = useState<number | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [pilotAdminOpen, setPilotAdminOpen] = useState(false);

  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2800);
  }, []);

  // Sync dark mode class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('moneymate_theme', theme);
  }, [theme]);

  // Listen to Firebase Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        setCloudProfile(null);
        setCloudBudget(null);
        setCloudExpenses([]);
        setCloudAlerts(null);
        setCloudCheckins([]);
        setCloudEvents([]);
      }
    });
    return () => unsub();
  }, []);

  // Subscribe to user's Firestore data when signed in
  useEffect(() => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    const unsub = subscribeUserFirestore(uid, {
      onProfile: (p) => {
        setCloudProfile(p);
        if (!p) {
          // Bootstrap profile & open 2-min onboarding for newly signed-in user
          const now = new Date().toISOString();
          const starter: UserProfile = {
            uid,
            name: firebaseUser.displayName || 'Student',
            email: firebaseUser.email || undefined,
            onboardingCompleted: false,
            createdAt: now,
            updatedAt: now,
          };
          void saveProfileCloud(uid, starter);
          setOnboardingOpen(true);
        }
      },
      onBudget: setCloudBudget,
      onExpenses: setCloudExpenses,
      onAlertSettings: setCloudAlerts,
      onCheckins: setCloudCheckins,
      onEvents: setCloudEvents,
    });
    return () => unsub();
  }, [firebaseUser]);

  const isSignedIn = Boolean(firebaseUser);
  const isAdminUser = Boolean(
    firebaseUser?.email && firebaseUser.email.toLowerCase() === ADMIN_EMAIL
  );

  // Active state source (Firestore when signed in, localStorage Demo Mode otherwise)
  const profile: UserProfile = useMemo(() => {
    if (isSignedIn && cloudProfile) return cloudProfile;
    return localState.profile;
  }, [isSignedIn, cloudProfile, localState.profile]);

  const budget: Budget = useMemo(() => {
    if (isSignedIn && cloudBudget) return cloudBudget;
    return localState.budget;
  }, [isSignedIn, cloudBudget, localState.budget]);

  const expenses: Expense[] = useMemo(() => {
    if (isSignedIn) return cloudExpenses;
    return [...localState.expenses].sort((a, b) => b.date.localeCompare(a.date));
  }, [isSignedIn, cloudExpenses, localState.expenses]);

  const alertSettings: AlertSettings = useMemo(() => {
    if (isSignedIn && cloudAlerts) return cloudAlerts;
    return localState.alertSettings;
  }, [isSignedIn, cloudAlerts, localState.alertSettings]);

  const checkins: WeeklyCheckin[] = useMemo(() => {
    if (isSignedIn) return cloudCheckins;
    return localState.checkins;
  }, [isSignedIn, cloudCheckins, localState.checkins]);

  const events: AnalyticsEvent[] = useMemo(() => {
    if (isSignedIn) return cloudEvents;
    return localState.events;
  }, [isSignedIn, cloudEvents, localState.events]);

  const todayIso = getTodayISO();
  const metrics = useMemo(
    () => calculateBudgetMetrics(budget, expenses, todayIso),
    [budget, expenses, todayIso]
  );
  const weeklySummary = useMemo(
    () => calculateWeeklySummary(budget, expenses, todayIso),
    [budget, expenses, todayIso]
  );
  const currentCheckin = useMemo(
    () => checkins.find((c) => c.weekKey === weeklySummary.weekKey),
    [checkins, weeklySummary.weekKey]
  );

  // Helper to update local state cleanly
  const updateLocal = useCallback((updater: (prev: LocalWorkspaceState) => LocalWorkspaceState) => {
    setLocalState((prev) => {
      const next = updater(prev);
      saveLocalWorkspace(next);
      return next;
    });
  }, []);

  // Track light analytics event + sync pilot summary
  const trackEvent = useCallback(
    (eventName: AnalyticsEventName) => {
      const weekKey = getISOWeekKey(getTodayISO());
      const now = new Date().toISOString();
      if (firebaseUser) {
        void logAnalyticsEventCloud(firebaseUser.uid, eventName);
      } else {
        updateLocal((prev) => ({
          ...prev,
          events: [
            ...prev.events,
            {
              id: `ev-${Date.now()}`,
              userId: prev.profile.uid,
              eventName,
              weekKey,
              createdAt: now,
            },
          ],
        }));
      }
    },
    [firebaseUser, updateLocal]
  );

  // Log home_opened once per session
  useEffect(() => {
    trackEvent('home_opened');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser?.uid]);

  // Gentle daily reminder & overspend browser notifications when granted
  useEffect(() => {
    if (
      !alertSettings.browserNotificationsEnabled ||
      typeof Notification === 'undefined' ||
      Notification.permission !== 'granted'
    ) {
      return;
    }

    const checkReminder = () => {
      if (!alertSettings.dailyReminderEnabled) return;
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const sentKey = `moneymate_reminded_${getTodayISO(now)}`;
      if (hhmm === alertSettings.dailyReminderTime && !localStorage.getItem(sentKey)) {
        localStorage.setItem(sentKey, '1');
        try {
          new Notification('Quick MoneyMate check-in', {
            body: 'Take 5 seconds to log today’s UPI or cash spends so tomorrow’s safe limit stays accurate.',
          });
        } catch {
          // Ignore in restricted iframe contexts
        }
      }
    };

    const timer = window.setInterval(checkReminder, 30000);
    return () => window.clearInterval(timer);
  }, [
    alertSettings.browserNotificationsEnabled,
    alertSettings.dailyReminderEnabled,
    alertSettings.dailyReminderTime,
  ]);

  // Sync PilotSummary for signed-in users whenever key pilot stats change
  useEffect(() => {
    if (!firebaseUser || !cloudProfile) return;
    const currentWeek = getISOWeekKey(todayIso);
    const weeklyActionsCount = events.filter((e) => e.weekKey === currentWeek).length;
    const distinctWeeks = new Set(events.map((e) => e.weekKey)).size;
    const summary: PilotSummary = {
      userId: firebaseUser.uid,
      displayName: cloudProfile.name,
      college: cloudProfile.college,
      stayType: cloudProfile.stayType,
      week4Active: weeklyActionsCount >= 3,
      weeklyActionsCount,
      activeWeeksCount: Math.max(1, distinctWeeks),
      lastCheckinAnswer: currentCheckin?.changedSpendingChoice || 'None',
      preCommit49: localState.waitlistEntry?.preCommit49 || 'Pending',
      preCommitObjection: localState.waitlistEntry?.preCommitObjection,
      updatedAt: new Date().toISOString(),
    };
    void syncPilotSummaryCloud(firebaseUser.uid, summary);
  }, [
    firebaseUser,
    cloudProfile,
    events,
    currentCheckin,
    localState.waitlistEntry,
    todayIso,
  ]);

  // Handlers
  const handleSignInGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      showToast('Signed in with Google');
    } catch (err) {
      console.error('Google sign-in failed:', err);
      showToast('Sign-in was cancelled or blocked');
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    showToast('Switched to local Demo Mode');
  };

  const handleSaveExpense = async (payload: {
    id?: string;
    amount: number;
    category: ExpenseCategory;
    paymentMode: PaymentMode;
    note: string;
    date: string;
  }) => {
    const id = payload.id || `exp-${Date.now()}`;
    const now = new Date().toISOString();
    const expense: Expense = {
      id,
      userId: profile.uid,
      amount: payload.amount,
      category: payload.category,
      paymentMode: payload.paymentMode,
      note: payload.note || undefined,
      date: payload.date,
      createdAt: now,
      updatedAt: now,
    };

    if (firebaseUser) {
      await upsertExpenseCloud(firebaseUser.uid, expense);
    } else {
      updateLocal((prev) => {
        const exists = prev.expenses.some((e) => e.id === id);
        return {
          ...prev,
          expenses: exists
            ? prev.expenses.map((e) => (e.id === id ? expense : e))
            : [expense, ...prev.expenses],
        };
      });
    }

    if (!payload.id) {
      trackEvent('expense_added');
      showToast(`Logged ₹${Math.round(payload.amount)} · Safe limit updated`);
    } else {
      showToast('Expense updated');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (firebaseUser) {
      await deleteExpenseCloud(firebaseUser.uid, id);
    } else {
      updateLocal((prev) => ({
        ...prev,
        expenses: prev.expenses.filter((e) => e.id !== id),
      }));
    }
    showToast('Expense deleted');
  };

  const handleCompleteOnboarding = async (nextProfile: UserProfile, nextBudget: Budget) => {
    if (firebaseUser) {
      await Promise.all([
        saveProfileCloud(firebaseUser.uid, nextProfile),
        saveBudgetCloud(firebaseUser.uid, nextBudget),
      ]);
    } else {
      updateLocal((prev) => ({
        ...prev,
        profile: nextProfile,
        budget: nextBudget,
        expenses: prev.profile.name === 'Aarav Sharma' ? [] : prev.expenses,
      }));
    }
    trackEvent('onboarding_completed');
    showToast('Budget ready — your safe-to-spend number is live');
  };

  const handleUpdateBudget = async (nextBudget: Budget) => {
    if (firebaseUser) {
      await saveBudgetCloud(firebaseUser.uid, nextBudget);
    } else {
      updateLocal((prev) => ({ ...prev, budget: nextBudget }));
    }
  };

  const handleUpdateAlertSettings = async (nextSettings: AlertSettings) => {
    if (firebaseUser) {
      await saveAlertSettingsCloud(firebaseUser.uid, nextSettings);
    } else {
      updateLocal((prev) => ({ ...prev, alertSettings: nextSettings }));
    }
  };

  const handleSubmitCheckin = async (answer: CheckinAnswer) => {
    const checkin: WeeklyCheckin = {
      userId: profile.uid,
      weekKey: weeklySummary.weekKey,
      totalSpent: weeklySummary.totalSpent,
      topCategory: weeklySummary.topCategory,
      daysOnTrack: weeklySummary.daysOnTrack,
      changedSpendingChoice: answer,
      createdAt: new Date().toISOString(),
    };
    if (firebaseUser) {
      await saveWeeklyCheckinCloud(firebaseUser.uid, checkin);
    } else {
      updateLocal((prev) => {
        const rest = prev.checkins.filter((c) => c.weekKey !== checkin.weekKey);
        return { ...prev, checkins: [...rest, checkin] };
      });
    }
    trackEvent('weekly_checkin_answered');
    showToast('Weekly check-in saved');
  };

  const handleSubmitWaitlist = async (entry: WaitlistEntry) => {
    if (firebaseUser) {
      await saveWaitlistEntryCloud(entry);
    }
    updateLocal((prev) => ({
      ...prev,
      waitlistEntry: entry,
      demoWaitlistEntries: [
        entry,
        ...prev.demoWaitlistEntries.filter((w) => w.userId !== entry.userId),
      ],
    }));
  };

  const handleSubmitPreCommit = async (
    choice: Exclude<PreCommitChoice, 'Pending'>,
    objection: string
  ) => {
    if (firebaseUser && localState.waitlistEntry) {
      await updateWaitlistPreCommitCloud(choice, objection);
    }
    updateLocal((prev) => {
      const updatedEntry: WaitlistEntry = prev.waitlistEntry
        ? { ...prev.waitlistEntry, preCommit49: choice, preCommitObjection: objection }
        : {
            userId: profile.uid,
            name: profile.name,
            contact: profile.email || 'pilot-user',
            college: profile.college || 'Pilot Campus',
            year: profile.year || '1st Year',
            stayType: profile.stayType || 'Hostel',
            preCommit49: choice,
            preCommitObjection: objection,
          };
      return {
        ...prev,
        waitlistEntry: updatedEntry,
      };
    });
    showToast('Pre-commitment feedback saved');
  };

  const handleResetDemo = () => {
    const fresh = createSeedWorkspace();
    saveLocalWorkspace(fresh);
    setLocalState(fresh);
    setDismissedAlertIds([]);
    showToast('Restored ₹8,000 demo allowance data');
  };

  const handleDeleteAllData = async () => {
    if (firebaseUser) {
      await deleteAllUserDataCloud(firebaseUser.uid);
    }
    const blank = resetLocalWorkspaceToBlank(profile.name);
    setLocalState(blank);
    setDismissedAlertIds([]);
    showToast('All personal data cleared');
    setOnboardingOpen(true);
  };

  // Combine current local user into pilot rows for demo visibility
  const combinedPilotSummaries: PilotSummary[] = useMemo(() => {
    const currentWeek = getISOWeekKey(todayIso);
    const weeklyActions = events.filter((e) => e.weekKey === currentWeek).length;
    const distinctWeeks = Math.max(1, new Set(events.map((e) => e.weekKey)).size);
    const selfRow: PilotSummary = {
      userId: profile.uid,
      displayName: `${profile.name} (You)`,
      college: profile.college || 'Demo Campus',
      stayType: profile.stayType || 'Hostel',
      week4Active: weeklyActions >= 3,
      weeklyActionsCount: weeklyActions,
      activeWeeksCount: distinctWeeks,
      lastCheckinAnswer: currentCheckin?.changedSpendingChoice || 'None',
      preCommit49: localState.waitlistEntry?.preCommit49 || 'Pending',
      preCommitObjection: localState.waitlistEntry?.preCommitObjection,
    };
    return [selfRow, ...localState.demoPilotSummaries];
  }, [
    profile,
    events,
    currentCheckin,
    localState.waitlistEntry,
    localState.demoPilotSummaries,
    todayIso,
  ]);

  const recentCategories = useMemo(() => {
    const unique: ExpenseCategory[] = [];
    for (const exp of expenses) {
      if (!unique.includes(exp.category)) unique.push(exp.category);
    }
    return unique;
  }, [expenses]);

  const t = STRINGS[language];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B1120] text-[#0F172A] dark:text-[#F1F5F9]">
      {/* Compact Sticky Top Bar (3-zone contract) */}
      <header className="sticky top-0 z-30 h-14 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className="text-lg font-extrabold font-display tracking-tight text-teal-700 dark:text-teal-300 whitespace-nowrap shrink-0"
          >
            MoneyMate
          </button>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 dark:hover:text-white ${
                activeTab === 'home' ? 'text-teal-700 dark:text-teal-300 font-semibold' : ''
              }`}
            >
              {t.navHome}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('insights')}
              className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 dark:hover:text-white ${
                activeTab === 'insights' ? 'text-teal-700 dark:text-teal-300 font-semibold' : ''
              }`}
            >
              {t.navInsights}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 dark:hover:text-white ${
                activeTab === 'settings' ? 'text-teal-700 dark:text-teal-300 font-semibold' : ''
              }`}
            >
              {t.navSettings}
            </button>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton variant="compact" />
            <button
              type="button"
              onClick={() => {
                setEditingExpense(null);
                setQuickAddCategory(null);
                setQuickAddAmount(null);
                setQuickAddOpen(true);
              }}
              className="hidden md:inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-3.5 py-2 whitespace-nowrap shrink-0 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add expense</span>
            </button>
          </div>
        </div>
      </header>

      <OfflineIndicator />

      {/* Main Scrollable Viewport */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-24 md:pb-10">
        {activeTab === 'home' && (
          <HomeTab
            t={t}
            isDemoMode={!isSignedIn && profile.name === 'Aarav Sharma'}
            hasJoinedWaitlist={Boolean(localState.waitlistEntry)}
            budget={budget}
            metrics={metrics}
            expenses={expenses}
            alertSettings={alertSettings}
            dismissedAlertIds={dismissedAlertIds}
            onDismissAlert={(id) => {
              setDismissedAlertIds((prev) => [...prev, id]);
              trackEvent('alert_opened');
            }}
            onQuickShortcut={(cat, amt) => {
              setEditingExpense(null);
              setQuickAddCategory(cat);
              setQuickAddAmount(amt || null);
              setQuickAddOpen(true);
            }}
            onEditExpense={(exp) => {
              setEditingExpense(exp);
              setQuickAddOpen(true);
            }}
            onDeleteExpense={(id) => void handleDeleteExpense(id)}
            onOpenOnboarding={() => setOnboardingOpen(true)}
            onOpenWaitlist={() => setWaitlistOpen(true)}
            onOpenQuickAdd={() => {
              setEditingExpense(null);
              setQuickAddCategory(null);
              setQuickAddAmount(null);
              setQuickAddOpen(true);
            }}
          />
        )}

        {activeTab === 'insights' && (
          <InsightsTab
            t={t}
            weeklySummary={weeklySummary}
            metrics={metrics}
            currentCheckin={currentCheckin}
            waitlistEntry={localState.waitlistEntry}
            isPilotOrWaitlisted={Boolean(localState.waitlistEntry) || isSignedIn || events.length >= 2}
            onSubmitCheckin={(ans) => void handleSubmitCheckin(ans)}
            onSubmitPreCommit={(choice, obj) => void handleSubmitPreCommit(choice, obj)}
            onOpenWaitlist={() => setWaitlistOpen(true)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            profile={profile}
            budget={budget}
            alertSettings={alertSettings}
            isSignedIn={isSignedIn}
            isAdminUser={isAdminUser}
            theme={theme}
            language={language}
            onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            onToggleLanguage={setLanguage}
            onUpdateBudget={(next) => void handleUpdateBudget(next)}
            onUpdateAlertSettings={(next) => void handleUpdateAlertSettings(next)}
            onSignInGoogle={() => void handleSignInGoogle()}
            onSignOut={() => void handleSignOut()}
            onOpenOnboarding={() => setOnboardingOpen(true)}
            onOpenWaitlist={() => setWaitlistOpen(true)}
            onOpenPilotAdmin={() => setPilotAdminOpen(true)}
            onResetDemo={handleResetDemo}
            onDeleteAllData={() => void handleDeleteAllData()}
          />
        )}
      </main>

      {/* Mobile Bottom Thumb-Zone Navigation: Home, Add (+), Insights, Settings */}
      <nav
        aria-label="Primary navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe"
      >
        <div className="grid grid-cols-4 items-center h-16 px-2">
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors ${
              activeTab === 'home'
                ? 'text-teal-700 dark:text-teal-300 font-semibold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[11px] leading-none">{t.navHome}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingExpense(null);
              setQuickAddCategory(null);
              setQuickAddAmount(null);
              setQuickAddOpen(true);
            }}
            className="min-h-[48px] flex flex-col items-center justify-center gap-0.5"
          >
            <span className="w-11 h-9 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-sm active:scale-95 transition-transform">
              <Plus className="w-5 h-5" />
            </span>
            <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-300 leading-none">
              {t.navAdd}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('insights')}
            className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors ${
              activeTab === 'insights'
                ? 'text-teal-700 dark:text-teal-300 font-semibold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[11px] leading-none">{t.navInsights}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors ${
              activeTab === 'settings'
                ? 'text-teal-700 dark:text-teal-300 font-semibold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[11px] leading-none">{t.navSettings}</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      <QuickAddModal
        isOpen={quickAddOpen}
        initialCategory={quickAddCategory}
        initialAmount={quickAddAmount}
        editingExpense={editingExpense}
        recentCategories={recentCategories}
        onClose={() => {
          setQuickAddOpen(false);
          setEditingExpense(null);
        }}
        onSave={(payload) => void handleSaveExpense(payload)}
        onDelete={(id) => void handleDeleteExpense(id)}
      />

      <OnboardingModal
        isOpen={onboardingOpen}
        initialProfile={profile}
        initialBudget={budget}
        isSignedIn={isSignedIn}
        onSignInGoogle={() => void handleSignInGoogle()}
        onComplete={(p, b) => void handleCompleteOnboarding(p, b)}
        onClose={() => setOnboardingOpen(false)}
      />

      <WaitlistModal
        isOpen={waitlistOpen}
        existingEntry={localState.waitlistEntry}
        userId={profile.uid}
        onClose={() => setWaitlistOpen(false)}
        onSubmitWaitlist={(entry) => void handleSubmitWaitlist(entry)}
        onSubmitPreCommit={(choice, obj) => void handleSubmitPreCommit(choice, obj)}
      />

      <PilotAdminModal
        isOpen={pilotAdminOpen}
        isAdminUser={isAdminUser}
        isSignedIn={isSignedIn}
        localPilotSummaries={combinedPilotSummaries}
        localWaitlistEntries={localState.demoWaitlistEntries}
        onClose={() => setPilotAdminOpen(false)}
      />

      {/* Non-intrusive Feedback Toast */}
      {toastMsg && (
        <div
          role="status"
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 text-xs font-semibold shadow-lg whitespace-nowrap"
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MoneyMateShell />
    </ErrorBoundary>
  );
}
