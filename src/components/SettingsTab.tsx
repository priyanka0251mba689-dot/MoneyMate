import React, { useState } from 'react';
import {
  Bell,
  Cloud,
  Database,
  Globe,
  LogOut,
  Moon,
  Plus,
  ShieldCheck,
  Sun,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { Language } from '../i18n/strings';
import { AlertSettings, Budget, FixedCostItem, UserProfile } from '../types/moneymate';
import { formatINR } from '../utils/budgetMath';
import { PWAInstallButton } from './PWAControls';

interface SettingsTabProps {
  profile: UserProfile;
  budget: Budget;
  alertSettings: AlertSettings;
  isSignedIn: boolean;
  isAdminUser: boolean;
  theme: 'light' | 'dark';
  language: Language;
  onToggleTheme: () => void;
  onToggleLanguage: (lang: Language) => void;
  onUpdateBudget: (next: Budget) => void;
  onUpdateAlertSettings: (next: AlertSettings) => void;
  onSignInGoogle: () => void;
  onSignOut: () => void;
  onOpenOnboarding: () => void;
  onOpenWaitlist: () => void;
  onOpenPilotAdmin: () => void;
  onResetDemo: () => void;
  onDeleteAllData: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  profile,
  budget,
  alertSettings,
  isSignedIn,
  isAdminUser,
  theme,
  language,
  onToggleTheme,
  onToggleLanguage,
  onUpdateBudget,
  onUpdateAlertSettings,
  onSignInGoogle,
  onSignOut,
  onOpenOnboarding,
  onOpenWaitlist,
  onOpenPilotAdmin,
  onResetDemo,
  onDeleteAllData,
}) => {
  const [allowanceInput, setAllowanceInput] = useState(String(budget.allowance));
  const [nextDateInput, setNextDateInput] = useState(budget.nextAllowanceDate);
  const [fixedCosts, setFixedCosts] = useState<FixedCostItem[]>(budget.fixedCosts);
  const [newCostLabel, setNewCostLabel] = useState('');
  const [newCostAmount, setNewCostAmount] = useState('');
  const [budgetSavedMsg, setBudgetSavedMsg] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [notifStatus, setNotifStatus] = useState('');

  const totalFixed = fixedCosts.reduce((s, f) => s + (Number(f.amount) || 0), 0);
  const spendablePreview = Math.max(0, (Number(allowanceInput) || 0) - totalFixed);

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBudget({
      ...budget,
      allowance: Math.max(0, Number(allowanceInput) || 0),
      nextAllowanceDate: nextDateInput,
      fixedCosts: fixedCosts.filter((f) => f.label.trim() && f.amount > 0),
      updatedAt: new Date().toISOString(),
    });
    setBudgetSavedMsg('Budget updated — safe-to-spend recalculated.');
    setTimeout(() => setBudgetSavedMsg(''), 3000);
  };

  const handleAddFixedCost = () => {
    const amt = Number(newCostAmount);
    if (!newCostLabel.trim() || !amt || amt <= 0) return;
    setFixedCosts((prev) => [
      ...prev,
      { id: `fc-${Date.now()}`, label: newCostLabel.trim(), amount: amt },
    ]);
    setNewCostLabel('');
    setNewCostAmount('');
  };

  const handleRemoveFixedCost = (id: string) => {
    setFixedCosts((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddMidMonthBonus = (bonus: number) => {
    const nextVal = (Number(allowanceInput) || 0) + bonus;
    setAllowanceInput(String(nextVal));
    onUpdateBudget({
      ...budget,
      allowance: nextVal,
      nextAllowanceDate: nextDateInput,
      fixedCosts,
      updatedAt: new Date().toISOString(),
    });
    setBudgetSavedMsg(`Added ${formatINR(bonus)} to this month's allowance.`);
    setTimeout(() => setBudgetSavedMsg(''), 3000);
  };

  const handleEnableBrowserNotifications = async () => {
    if (!('Notification' in window)) {
      setNotifStatus('Browser notifications are not supported in this browser.');
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      onUpdateAlertSettings({
        ...alertSettings,
        browserNotificationsEnabled: true,
      });
      setNotifStatus('Notifications enabled.');
      try {
        new Notification('MoneyMate reminder set', {
          body: `We will nudge you gently around ${alertSettings.dailyReminderTime} to log today's UPI spends.`,
        });
      } catch {
        // Ignore in sandboxed contexts
      }
    } else {
      setNotifStatus('Permission dismissed. In-app alerts remain active.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Left column: Mid-month Budget Editor */}
      <div className="lg:col-span-7 space-y-5">
        <form
          onSubmit={handleSaveBudget}
          className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-5"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Monthly budget & fixed costs
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Edit anytime mid-month if extra money arrives from home.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenOnboarding}
              className="min-h-[38px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              Run 2-min setup
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-1.5 block">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Monthly allowance (₹)
              </span>
              <input
                type="number"
                min={0}
                value={allowanceInput}
                onChange={(e) => setAllowanceInput(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono-num font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </label>

            <label className="space-y-1.5 block">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Next allowance date
              </span>
              <input
                type="date"
                value={nextDateInput}
                onChange={(e) => setNextDateInput(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </label>
          </div>

          {/* Quick Mid-month top-up */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Extra money arrived?</span>
            {[500, 1000, 2000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleAddMidMonthBonus(amt)}
                className="min-h-[36px] px-3 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 text-xs font-semibold hover:bg-teal-100 dark:hover:bg-teal-900/60 transition"
              >
                +{formatINR(amt)}
              </button>
            ))}
          </div>

          {/* Fixed Costs Rows */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Fixed monthly costs ({formatINR(totalFixed)})
              </span>
              <span className="text-xs font-mono-num text-teal-700 dark:text-teal-300 font-semibold">
                Spendable: {formatINR(spendablePreview)}
              </span>
            </div>

            {fixedCosts.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 px-3 py-2"
              >
                <span className="text-sm text-slate-800 dark:text-slate-200 truncate">
                  {item.label}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                    {formatINR(item.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFixedCost(item.id)}
                    aria-label={`Remove ${item.label}`}
                    className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
              <input
                type="text"
                value={newCostLabel}
                onChange={(e) => setNewCostLabel(e.target.value)}
                placeholder="Rent share, recharge, mess..."
                className="sm:col-span-6 min-h-[44px] px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100"
              />
              <input
                type="number"
                min={1}
                value={newCostAmount}
                onChange={(e) => setNewCostAmount(e.target.value)}
                placeholder="₹ Amount"
                className="sm:col-span-4 min-h-[44px] px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono-num text-slate-900 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={handleAddFixedCost}
                className="sm:col-span-2 min-h-[44px] rounded-xl bg-slate-900 dark:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-1 hover:bg-slate-800"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full min-h-[46px] rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition"
          >
            Save budget changes
          </button>
          {budgetSavedMsg && (
            <p className="text-xs font-medium text-teal-700 dark:text-teal-300">{budgetSavedMsg}</p>
          )}
        </form>

        {/* Alerts & Daily Reminder */}
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Alerts & gentle daily reminder
            </h2>
          </div>

          <label className="flex items-center justify-between gap-4 py-1 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Overspend & pace alerts
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Friendly heads-up at 80% used or when daily spend crosses limit
              </p>
            </div>
            <input
              type="checkbox"
              checked={alertSettings.overspendAlertsEnabled}
              onChange={(e) =>
                onUpdateAlertSettings({
                  ...alertSettings,
                  overspendAlertsEnabled: e.target.checked,
                })
              }
              className="w-5 h-5 accent-teal-600 rounded cursor-pointer"
            />
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={alertSettings.dailyReminderEnabled}
                onChange={(e) =>
                  onUpdateAlertSettings({
                    ...alertSettings,
                    dailyReminderEnabled: e.target.checked,
                  })
                }
                className="w-5 h-5 accent-teal-600 rounded cursor-pointer"
              />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Daily expense log reminder
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  One gentle nudge at your chosen time
                </p>
              </div>
            </label>

            <input
              type="time"
              value={alertSettings.dailyReminderTime}
              onChange={(e) =>
                onUpdateAlertSettings({
                  ...alertSettings,
                  dailyReminderTime: e.target.value,
                })
              }
              aria-label="Daily reminder time"
              className="min-h-[40px] px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono-num text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => void handleEnableBrowserNotifications()}
              className="min-h-[42px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              {alertSettings.browserNotificationsEnabled
                ? 'Test browser notification'
                : 'Enable push / browser notifications'}
            </button>
            {notifStatus && (
              <span className="text-xs text-slate-500 dark:text-slate-400">{notifStatus}</span>
            )}
          </div>
        </section>
      </div>

      {/* Right column: Account, PWA, Theme, Language, Pilot & Privacy */}
      <div className="lg:col-span-5 space-y-5">
        {/* Account & Cloud Sync */}
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {profile.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isSignedIn
                  ? `Synced via Google · ${profile.email || 'Cloud active'}`
                  : 'Local Demo Profile · Sign in to sync across devices'}
              </p>
            </div>
            <Cloud className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
          </div>

          {isSignedIn ? (
            <button
              type="button"
              onClick={onSignOut}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out to Demo Mode</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onSignInGoogle}
              className="w-full min-h-[44px] rounded-xl bg-slate-900 dark:bg-teal-600 hover:opacity-95 text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <span>Continue with Google (Cloud Sync)</span>
            </button>
          )}

          <PWAInstallButton variant="card" />
        </section>

        {/* Appearance & Language */}
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Appearance
            </span>
            <button
              type="button"
              onClick={onToggleTheme}
              className="min-h-[42px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>{theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <Globe className="w-4 h-4 text-slate-500" />
              <span>Language</span>
            </span>
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
              {(['en', 'hi'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => onToggleLanguage(lang)}
                  className={`min-h-[34px] px-3 rounded-lg text-xs font-semibold transition ${
                    language === lang
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {lang === 'en' ? 'English' : 'हिन्दी'}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Pilot Research & Waitlist */}
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Pilot & Research Tools
          </h2>
          <button
            type="button"
            onClick={onOpenWaitlist}
            className="w-full min-h-[44px] rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/70 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-teal-100/70 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Early-Access Waitlist & ₹49 Pre-commit</span>
          </button>

          <button
            type="button"
            onClick={onOpenPilotAdmin}
            className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <Database className="w-4 h-4" />
            <span>
              {isAdminUser ? 'Pilot Admin Dashboard & CSV Export' : 'Pilot Metrics & CSV Export'}
            </span>
          </button>
        </section>

        {/* Privacy & Data Deletion */}
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              We store only what you enter. <strong>We never read your SMS or bank accounts.</strong>{' '}
              You can reset or delete your data anytime.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={onResetDemo}
              className="min-h-[40px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Restore ₹8,000 demo data
            </button>

            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="min-h-[40px] px-3 rounded-xl border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                Delete my data
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onDeleteAllData();
                  setConfirmDelete(false);
                }}
                className="min-h-[40px] px-3 rounded-xl bg-rose-600 text-white text-xs font-semibold"
              >
                Confirm delete all data
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
