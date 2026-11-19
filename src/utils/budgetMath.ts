import {
  Budget,
  EXPENSE_CATEGORIES,
  Expense,
  ExpenseCategory,
  PaymentMode,
} from '../types/moneymate';

export type PaceState = 'green' | 'amber' | 'red';

export interface OverspendAlert {
  id: 'eighty_percent' | 'daily_exceeded' | 'pace_early';
  severity: 'amber' | 'red';
  title: string;
  message: string;
}

export interface CategorySummary {
  category: ExpenseCategory;
  amount: number;
  percentage: number;
}

export interface BudgetCalculationResult {
  totalFixedCosts: number;
  spendableMoney: number;
  totalSpentThisCycle: number;
  spentBeforeToday: number;
  spentToday: number;
  remainingMoney: number;
  remainingAtStartOfToday: number;
  daysTotalInCycle: number;
  daysElapsed: number;
  daysUntilNextAllowance: number;
  dailySafeAmount: number;
  safeToSpendToday: number;
  projectedTomorrowSafe: number;
  budgetUsedPct: number;
  monthElapsedPct: number;
  paceState: PaceState;
  projectedDaysEarly: number;
  alerts: OverspendAlert[];
  categoryBreakdown: CategorySummary[];
  paymentBreakdown: Record<PaymentMode, number>;
}

export interface WeeklySummaryResult {
  weekKey: string;
  totalSpent: number;
  topCategory: string;
  daysOnTrack: number;
}

/**
 * Formats an integer or decimal rupee amount in Indian numbering style (e.g. ₹1,25,000).
 */
export function formatINR(amount: number): string {
  const rounded = Math.round(amount);
  const absVal = Math.abs(rounded);
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(absVal);
  return rounded < 0 ? `-₹${formatted}` : `₹${formatted}`;
}

/**
 * Formats YYYY-MM-DD into DD MMM (e.g. 19 Nov).
 */
export function formatDateDDMMM(isoDate: string): string {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return isoDate;
  const [y, m, d] = parts;
  const date = new Date(Date.UTC(y, m - 1, d));
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(d).padStart(2, '0')} ${months[date.getUTCMonth()]}`;
}

export function getTodayISO(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysISO(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function diffDaysISO(fromIso: string, toIso: string): number {
  const [y1, m1, d1] = fromIso.split('-').map(Number);
  const [y2, m2, d2] = toIso.split('-').map(Number);
  const t1 = Date.UTC(y1, m1 - 1, d1);
  const t2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((t2 - t1) / 86400000);
}

export function getISOWeekKey(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Core safe-to-spend & pace projection calculations.
 *
 * - Spendable money = allowance - sum(fixedCosts)
 * - Daily safe limit (at start of today) = remainingAtStartOfToday / daysUntilNextAllowance
 * - Safe to spend today = max(0, dailySafeAmount - spentToday)
 * - Overspending today lowers remainingMoney, which lowers tomorrow's daily safe amount.
 */
export function calculateBudgetMetrics(
  budget: Budget,
  expenses: Expense[],
  todayIso: string = getTodayISO()
): BudgetCalculationResult {
  const totalFixedCosts = budget.fixedCosts.reduce((sum, item) => sum + Math.max(0, item.amount), 0);
  const spendableMoney = Math.max(0, budget.allowance - totalFixedCosts);

  const cycleExpenses = expenses.filter(
    (e) => e.date >= budget.cycleStartDate && e.date <= todayIso
  );

  const totalSpentThisCycle = cycleExpenses.reduce((sum, e) => sum + Math.max(0, e.amount), 0);
  const spentToday = cycleExpenses
    .filter((e) => e.date === todayIso)
    .reduce((sum, e) => sum + Math.max(0, e.amount), 0);
  const spentBeforeToday = totalSpentThisCycle - spentToday;

  const remainingMoney = spendableMoney - totalSpentThisCycle;
  const remainingAtStartOfToday = spendableMoney - spentBeforeToday;

  const daysTotalInCycle = Math.max(1, diffDaysISO(budget.cycleStartDate, budget.nextAllowanceDate));
  const daysElapsed = Math.min(
    daysTotalInCycle,
    Math.max(1, diffDaysISO(budget.cycleStartDate, todayIso) + 1)
  );
  const daysUntilNextAllowance = Math.max(1, diffDaysISO(todayIso, budget.nextAllowanceDate));

  const dailySafeAmount = Math.max(0, Math.round(remainingAtStartOfToday / daysUntilNextAllowance));
  const safeToSpendToday = Math.max(0, dailySafeAmount - spentToday);

  const tomorrowDays = Math.max(1, daysUntilNextAllowance - 1);
  const projectedTomorrowSafe =
    daysUntilNextAllowance > 1
      ? Math.max(0, Math.round(remainingMoney / tomorrowDays))
      : Math.max(0, Math.round(remainingMoney));

  const budgetUsedPct =
    spendableMoney > 0
      ? Math.min(100, Math.max(0, Math.round((totalSpentThisCycle / spendableMoney) * 100)))
      : totalSpentThisCycle > 0
        ? 100
        : 0;

  const monthElapsedPct = Math.min(
    100,
    Math.max(0, Math.round((daysElapsed / daysTotalInCycle) * 100))
  );

  // Average daily burn rate so far in the cycle
  const avgDailySpend = daysElapsed > 0 ? totalSpentThisCycle / daysElapsed : 0;
  let projectedDaysEarly = 0;
  if (remainingMoney <= 0) {
    projectedDaysEarly = daysUntilNextAllowance;
  } else if (avgDailySpend > 0) {
    const daysMoneyWillLast = Math.floor(remainingMoney / avgDailySpend);
    if (daysMoneyWillLast < daysUntilNextAllowance) {
      projectedDaysEarly = Math.max(1, daysUntilNextAllowance - daysMoneyWillLast);
    }
  }

  let paceState: PaceState = 'green';
  if (remainingMoney <= 0 || budgetUsedPct >= 95 || projectedDaysEarly >= 4 || budgetUsedPct - monthElapsedPct >= 15) {
    paceState = 'red';
  } else if (
    spentToday > dailySafeAmount ||
    projectedDaysEarly >= 1 ||
    budgetUsedPct - monthElapsedPct >= 5 ||
    budgetUsedPct >= 80
  ) {
    paceState = 'amber';
  }

  const alerts: OverspendAlert[] = [];
  if (spendableMoney > 0 && totalSpentThisCycle >= spendableMoney * 0.8) {
    const pct = Math.round((totalSpentThisCycle / spendableMoney) * 100);
    alerts.push({
      id: 'eighty_percent',
      severity: pct >= 100 ? 'red' : 'amber',
      title: pct >= 100 ? 'Monthly spendable budget used up' : `${pct}% of monthly spendable money used`,
      message:
        pct >= 100
          ? `You've crossed your spendable budget of ${formatINR(spendableMoney)}. Keep daily spends minimal until ${formatDateDDMMM(budget.nextAllowanceDate)}.`
          : `You have ${formatINR(Math.max(0, remainingMoney))} left for the next ${daysUntilNextAllowance} day${daysUntilNextAllowance === 1 ? '' : 's'}.`,
    });
  }

  if (spentToday > dailySafeAmount && dailySafeAmount >= 0) {
    const overBy = spentToday - dailySafeAmount;
    alerts.push({
      id: 'daily_exceeded',
      severity: 'amber',
      title: `Today's spend is ${formatINR(overBy)} above your daily safe limit`,
      message:
        daysUntilNextAllowance > 1
          ? `No stress—tomorrow's safe limit adjusts to ${formatINR(projectedTomorrowSafe)} so your allowance still lasts.`
          : `Today is the last day before your next allowance.`,
    });
  }

  if (projectedDaysEarly >= 2 && remainingMoney > 0) {
    alerts.push({
      id: 'pace_early',
      severity: projectedDaysEarly >= 4 ? 'red' : 'amber',
      title: `Heads up: at this pace your money may run out ${projectedDaysEarly} days early`,
      message: `Today's safe amount is ${formatINR(safeToSpendToday)} (${formatINR(dailySafeAmount)} daily limit).`,
    });
  }

  const categoryTotals = new Map<ExpenseCategory, number>();
  EXPENSE_CATEGORIES.forEach((c) => categoryTotals.set(c, 0));
  const paymentBreakdown: Record<PaymentMode, number> = { UPI: 0, Cash: 0, Card: 0 };

  for (const exp of cycleExpenses) {
    categoryTotals.set(exp.category, (categoryTotals.get(exp.category) ?? 0) + exp.amount);
    paymentBreakdown[exp.paymentMode] = (paymentBreakdown[exp.paymentMode] ?? 0) + exp.amount;
  }

  const categoryBreakdown: CategorySummary[] = EXPENSE_CATEGORIES.map((category) => {
    const amount = categoryTotals.get(category) ?? 0;
    const percentage =
      totalSpentThisCycle > 0 ? Math.round((amount / totalSpentThisCycle) * 100) : 0;
    return { category, amount, percentage };
  })
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  return {
    totalFixedCosts,
    spendableMoney,
    totalSpentThisCycle,
    spentBeforeToday,
    spentToday,
    remainingMoney,
    remainingAtStartOfToday,
    daysTotalInCycle,
    daysElapsed,
    daysUntilNextAllowance,
    dailySafeAmount,
    safeToSpendToday,
    projectedTomorrowSafe,
    budgetUsedPct,
    monthElapsedPct,
    paceState,
    projectedDaysEarly,
    alerts,
    categoryBreakdown,
    paymentBreakdown,
  };
}

/**
 * Computes rolling 7-day weekly summary for pilot check-in.
 */
export function calculateWeeklySummary(
  budget: Budget,
  expenses: Expense[],
  todayIso: string = getTodayISO()
): WeeklySummaryResult {
  const weekStart = addDaysISO(todayIso, -6);
  const weekExpenses = expenses.filter((e) => e.date >= weekStart && e.date <= todayIso);
  const totalSpent = weekExpenses.reduce((sum, e) => sum + e.amount, 0);

  const byCat = new Map<string, number>();
  for (const e of weekExpenses) {
    byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount);
  }
  let topCategory = 'None yet';
  let topAmt = 0;
  for (const [cat, amt] of byCat.entries()) {
    if (amt > topAmt) {
      topAmt = amt;
      topCategory = cat;
    }
  }

  // Approximate planned daily safe amount across the cycle
  const totalFixed = budget.fixedCosts.reduce((s, f) => s + f.amount, 0);
  const spendable = Math.max(0, budget.allowance - totalFixed);
  const cycleDays = Math.max(1, diffDaysISO(budget.cycleStartDate, budget.nextAllowanceDate));
  const baselineDaily = spendable / cycleDays;

  let daysOnTrack = 0;
  for (let i = 0; i < 7; i++) {
    const dayIso = addDaysISO(weekStart, i);
    const daySpend = weekExpenses
      .filter((e) => e.date === dayIso)
      .reduce((s, e) => s + e.amount, 0);
    if (daySpend <= baselineDaily) {
      daysOnTrack += 1;
    }
  }

  return {
    weekKey: getISOWeekKey(todayIso),
    totalSpent,
    topCategory,
    daysOnTrack,
  };
}
