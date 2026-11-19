import { describe, expect, it } from 'vitest';
import { Budget, Expense } from '../types/moneymate';
import {
  calculateBudgetMetrics,
  calculateWeeklySummary,
  formatDateDDMMM,
  formatINR,
} from './budgetMath';

const baseBudget: Budget = {
  userId: 'demo',
  allowance: 8000,
  cycleStartDate: '2026-11-01',
  nextAllowanceDate: '2026-12-01',
  fixedCosts: [
    { id: '1', label: 'Hostel rent share', amount: 2200 },
    { id: '2', label: 'Phone recharge', amount: 250 },
    { id: '3', label: 'Music sub', amount: 50 },
  ],
};

describe('formatINR & formatDateDDMMM', () => {
  it('formats Indian currency cleanly', () => {
    expect(formatINR(125000)).toBe('₹1,25,000');
    expect(formatINR(8000)).toBe('₹8,000');
    expect(formatINR(-180)).toBe('-₹180');
  });

  it('formats dates as DD MMM', () => {
    expect(formatDateDDMMM('2026-11-19')).toBe('19 Nov');
    expect(formatDateDDMMM('2026-12-01')).toBe('01 Dec');
  });
});

describe('calculateBudgetMetrics', () => {
  it('calculates spendable money and daily safe amount cleanly', () => {
    const expenses: Expense[] = [
      {
        id: 'e1',
        userId: 'demo',
        amount: 500,
        category: 'Food & delivery',
        paymentMode: 'UPI',
        date: '2026-11-10',
      },
    ];
    // Spendable = 8000 - 2500 = 5500. Spent before today (Nov 21) = 500 -> remaining = 5000.
    // Days until Dec 1 from Nov 21 = 10 days -> daily safe = 500.
    const metrics = calculateBudgetMetrics(baseBudget, expenses, '2026-11-21');
    expect(metrics.totalFixedCosts).toBe(2500);
    expect(metrics.spendableMoney).toBe(5500);
    expect(metrics.remainingMoney).toBe(5000);
    expect(metrics.daysUntilNextAllowance).toBe(10);
    expect(metrics.dailySafeAmount).toBe(500);
    expect(metrics.safeToSpendToday).toBe(500);
    expect(metrics.paceState).toBe('green');
  });

  it('reduces safe-to-spend today and tomorrow when overspending today', () => {
    const expenses: Expense[] = [
      {
        id: 'e1',
        userId: 'demo',
        amount: 500,
        category: 'Food & delivery',
        paymentMode: 'UPI',
        date: '2026-11-10',
      },
      {
        id: 'e2',
        userId: 'demo',
        amount: 950,
        category: 'Social outings',
        paymentMode: 'UPI',
        date: '2026-11-21',
      },
    ];
    const metricsToday = calculateBudgetMetrics(baseBudget, expenses, '2026-11-21');
    expect(metricsToday.dailySafeAmount).toBe(500);
    expect(metricsToday.spentToday).toBe(950);
    expect(metricsToday.safeToSpendToday).toBe(0);
    expect(metricsToday.projectedTomorrowSafe).toBe(450); // (5500 - 1450) / 9 = 450
    expect(metricsToday.alerts.some((a) => a.id === 'daily_exceeded')).toBe(true);

    // Next day check
    const metricsTomorrow = calculateBudgetMetrics(baseBudget, expenses, '2026-11-22');
    expect(metricsTomorrow.dailySafeAmount).toBe(450);
  });

  it('triggers 80% alert and red pace state when spending fast', () => {
    const expenses: Expense[] = [
      {
        id: 'e1',
        userId: 'demo',
        amount: 4600,
        category: 'Shopping',
        paymentMode: 'UPI',
        date: '2026-11-05',
      },
    ];
    const metrics = calculateBudgetMetrics(baseBudget, expenses, '2026-11-06');
    expect(metrics.budgetUsedPct).toBe(84);
    expect(metrics.paceState).toBe('red');
    expect(metrics.alerts.some((a) => a.id === 'eighty_percent')).toBe(true);
    expect(metrics.alerts.some((a) => a.id === 'pace_early')).toBe(true);
  });
});

describe('calculateWeeklySummary', () => {
  it('computes 7-day total, top category, and days on track', () => {
    const expenses: Expense[] = [
      {
        id: 'e1',
        userId: 'demo',
        amount: 120,
        category: 'Food & delivery',
        paymentMode: 'UPI',
        date: '2026-11-18',
      },
      {
        id: 'e2',
        userId: 'demo',
        amount: 350,
        category: 'Social outings',
        paymentMode: 'Cash',
        date: '2026-11-19',
      },
    ];
    const summary = calculateWeeklySummary(baseBudget, expenses, '2026-11-19');
    expect(summary.totalSpent).toBe(470);
    expect(summary.topCategory).toBe('Social outings');
    expect(summary.daysOnTrack).toBe(6);
  });
});
