import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { Translations } from '../i18n/strings';
import { AlertSettings, Budget, Expense, ExpenseCategory } from '../types/moneymate';
import {
  BudgetCalculationResult,
  formatDateDDMMM,
  formatINR,
} from '../utils/budgetMath';
import { CATEGORY_META, CategoryIcon } from './CategoryIcon';

interface HomeTabProps {
  t: Translations;
  isDemoMode: boolean;
  hasJoinedWaitlist: boolean;
  budget: Budget;
  metrics: BudgetCalculationResult;
  expenses: Expense[];
  alertSettings: AlertSettings;
  dismissedAlertIds: string[];
  onDismissAlert: (id: string) => void;
  onQuickShortcut: (category: ExpenseCategory, suggestedAmount?: number) => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onOpenOnboarding: () => void;
  onOpenWaitlist: () => void;
  onOpenQuickAdd: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  t,
  isDemoMode,
  hasJoinedWaitlist,
  budget,
  metrics,
  expenses,
  alertSettings,
  dismissedAlertIds,
  onDismissAlert,
  onQuickShortcut,
  onEditExpense,
  onDeleteExpense,
  onOpenOnboarding,
  onOpenWaitlist,
  onOpenQuickAdd,
}) => {
  const paceLabel =
    metrics.paceState === 'green'
      ? t.onTrack
      : metrics.paceState === 'amber'
        ? t.spendingFaster
        : t.overBudget;

  const paceStyles =
    metrics.paceState === 'green'
      ? {
          bar: 'bg-emerald-600 dark:bg-emerald-500',
          badge: 'text-emerald-700 dark:text-emerald-300',
          Icon: CheckCircle2,
        }
      : metrics.paceState === 'amber'
        ? {
            bar: 'bg-amber-500',
            badge: 'text-amber-700 dark:text-amber-300',
            Icon: TrendingUp,
          }
        : {
            bar: 'bg-rose-600 dark:bg-rose-500',
            badge: 'text-rose-700 dark:text-rose-300',
            Icon: AlertTriangle,
          };

  const PaceIcon = paceStyles.Icon;

  const visibleAlerts = alertSettings.overspendAlertsEnabled
    ? metrics.alerts.filter((a) => !dismissedAlertIds.includes(a.id))
    : [];

  // Unique recent categories + most recent expense amount for 1-tap repeat
  const recentShortcuts: Array<{ category: ExpenseCategory; amount: number }> = [];
  const seen = new Set<ExpenseCategory>();
  for (const exp of expenses) {
    if (!seen.has(exp.category)) {
      seen.add(exp.category);
      recentShortcuts.push({ category: exp.category, amount: exp.amount });
    }
    if (recentShortcuts.length >= 4) break;
  }

  return (
    <div className="space-y-5">
      {/* Subtle Demo / Waitlist Action Strip */}
      {(isDemoMode || !hasJoinedWaitlist) && (
        <div className="rounded-2xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/70 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs sm:text-sm text-teal-900 dark:text-teal-100 font-medium">
            {isDemoMode
              ? 'Demo mode active (₹8,000 allowance) · Try logging a spend or set up your own.'
              : 'In the student pilot · Reserve your early-access spot anytime.'}
          </p>
          <div className="flex items-center gap-2">
            {isDemoMode && (
              <button
                type="button"
                onClick={onOpenOnboarding}
                className="min-h-[38px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-700 text-xs font-semibold text-teal-800 dark:text-teal-200 hover:bg-teal-100/60 transition whitespace-nowrap"
              >
                Set up my budget
              </button>
            )}
            {!hasJoinedWaitlist && (
              <button
                type="button"
                onClick={onOpenWaitlist}
                className="min-h-[38px] px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-xs font-semibold text-white transition whitespace-nowrap"
              >
                Join waitlist
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main 2-column responsive layout on desktop, stacked thumb-friendly on Android */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left / Primary Column */}
        <div className="lg:col-span-7 space-y-5">
          {/* HERO SAFE-TO-SPEND CARD */}
          <section
            aria-label="Safe to spend today"
            className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-5"
          >
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {t.safeToSpendPrefix}
              </p>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-4xl sm:text-5xl font-extrabold font-mono-num tracking-tight text-slate-900 dark:text-white">
                  {formatINR(metrics.safeToSpendToday)}
                </span>
                {t.safeToSpendSuffix && (
                  <span className="text-lg font-semibold text-slate-500 dark:text-slate-400">
                    {t.safeToSpendSuffix}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 tabular-nums">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {formatINR(Math.max(0, metrics.remainingMoney))}
                </span>{' '}
                {t.leftThisMonth}{' '}
                <span aria-hidden="true" className="mx-1 text-slate-400">
                  ·
                </span>{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {metrics.daysUntilNextAllowance}
                </span>{' '}
                {t.daysUntilNext} ({formatDateDDMMM(budget.nextAllowanceDate)})
              </p>
            </div>

            {/* Money Used vs Month Elapsed Progress Bar */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className={`inline-flex items-center gap-1.5 font-semibold ${paceStyles.badge}`}>
                  <PaceIcon className="w-4 h-4 shrink-0" />
                  <span>{paceLabel}</span>
                </span>
                <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                  {metrics.budgetUsedPct}% spent · {metrics.monthElapsedPct}% month elapsed
                </span>
              </div>

              <div className="relative h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${paceStyles.bar}`}
                  style={{ width: `${Math.min(100, metrics.budgetUsedPct)}%` }}
                />
                {/* Month elapsed vertical marker */}
                <div
                  title={`Month elapsed: ${metrics.monthElapsedPct}%`}
                  className="absolute top-0 bottom-0 w-0.5 bg-slate-900/50 dark:bg-white/60"
                  style={{ left: `${Math.min(99, Math.max(1, metrics.monthElapsedPct))}%` }}
                />
              </div>
            </div>

            {/* Today's Spend vs Daily Safe Limit */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t.todaySpend}</p>
                <p className="mt-0.5 text-lg font-bold font-mono-num text-slate-900 dark:text-slate-100">
                  {formatINR(metrics.spentToday)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 dark:text-slate-400">{t.dailySafeLimit}</p>
                <p className="mt-0.5 text-lg font-bold font-mono-num text-teal-700 dark:text-teal-300">
                  {formatINR(metrics.dailySafeAmount)}
                </p>
              </div>
            </div>

            {metrics.spentToday > metrics.dailySafeAmount && metrics.daysUntilNextAllowance > 1 && (
              <p className="text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 rounded-xl px-3 py-2">
                Today&rsquo;s extra spend adjusts tomorrow&rsquo;s daily safe limit to{' '}
                <strong className="font-mono-num">{formatINR(metrics.projectedTomorrowSafe)}</strong>.
              </p>
            )}
          </section>

          {/* Friendly Overspend Alerts */}
          {visibleAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-2xl border p-4 flex items-start justify-between gap-3 ${
                alert.severity === 'red'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100'
              }`}
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold">{alert.title}</p>
                <p className="text-xs opacity-90 leading-relaxed">{alert.message}</p>
              </div>
              <button
                type="button"
                onClick={() => onDismissAlert(alert.id)}
                className="min-h-[38px] px-3 rounded-xl bg-white/80 dark:bg-slate-900/70 text-xs font-semibold shrink-0 hover:bg-white transition"
              >
                Got it
              </button>
            </div>
          ))}

          {/* One-Tap Recent Category Shortcuts */}
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {t.quickRepeat}
              </h2>
              <button
                type="button"
                onClick={onOpenQuickAdd}
                className="min-h-[36px] inline-flex items-center gap-1 text-xs font-semibold text-teal-700 dark:text-teal-300 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Custom amount</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentShortcuts.length > 0 ? (
                recentShortcuts.map((item) => (
                  <button
                    key={item.category}
                    type="button"
                    onClick={() => onQuickShortcut(item.category, item.amount)}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/50 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 transition active:scale-[0.98]"
                  >
                    <CategoryIcon category={item.category} size="sm" />
                    <span>{item.category}</span>
                    <span className="font-mono-num text-teal-700 dark:text-teal-300">
                      {formatINR(item.amount)}
                    </span>
                  </button>
                ))
              ) : (
                <button
                  type="button"
                  onClick={onOpenQuickAdd}
                  className="min-h-[44px] px-4 rounded-xl bg-teal-600 text-white text-xs font-semibold flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Log your first expense</span>
                </button>
              )}
            </div>
          </section>
        </div>

        {/* Right / Secondary Column */}
        <div className="lg:col-span-5 space-y-5">
          {/* Category Breakdown Bars */}
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {t.categoryBreakdown}
              </h2>
              <span className="text-xs font-mono-num text-slate-500 dark:text-slate-400">
                {formatINR(metrics.totalSpentThisCycle)} total
              </span>
            </div>

            {metrics.categoryBreakdown.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-3">
                No expenses logged in this cycle yet. Tap + below to add one in 5 seconds.
              </p>
            ) : (
              <div className="space-y-3">
                {metrics.categoryBreakdown.map((item) => {
                  const meta = CATEGORY_META[item.category];
                  return (
                    <div key={item.category} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {item.category}
                        </span>
                        <span className="font-mono-num text-slate-600 dark:text-slate-300">
                          {formatINR(item.amount)} · {item.percentage}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${meta.barColor}`}
                          style={{ width: `${Math.max(4, item.percentage)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Recent Expenses List */}
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {t.recentExpenses}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {expenses.length} entries
              </span>
            </div>

            {expenses.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
                Nothing logged yet. Your daily safe limit stays untouched.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {expenses.slice(0, 12).map((exp) => (
                  <div
                    key={exp.id}
                    className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CategoryIcon category={exp.category} size="md" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {exp.note || exp.category}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {exp.category} · {exp.paymentMode} · {formatDateDDMMM(exp.date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-sm font-bold font-mono-num text-slate-900 dark:text-slate-100 mr-1">
                        {formatINR(exp.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onEditExpense(exp)}
                        aria-label={`Edit ${exp.note || exp.category}`}
                        className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:text-teal-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteExpense(exp.id)}
                        aria-label={`Delete ${exp.note || exp.category}`}
                        className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Privacy Trust Note */}
          <div className="flex items-center justify-between gap-3 px-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>{t.privacyNote}</span>
            </span>
            {!hasJoinedWaitlist && (
              <button
                type="button"
                onClick={onOpenWaitlist}
                className="inline-flex items-center gap-0.5 font-semibold text-teal-700 dark:text-teal-300 hover:underline whitespace-nowrap"
              >
                <span>Early access</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
