import React, { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { Translations } from '../i18n/strings';
import {
  CheckinAnswer,
  PAYMENT_MODES,
  PreCommitChoice,
  WaitlistEntry,
  WeeklyCheckin,
} from '../types/moneymate';
import {
  BudgetCalculationResult,
  WeeklySummaryResult,
  formatINR,
} from '../utils/budgetMath';

interface InsightsTabProps {
  t: Translations;
  weeklySummary: WeeklySummaryResult;
  metrics: BudgetCalculationResult;
  currentCheckin: WeeklyCheckin | undefined;
  waitlistEntry: WaitlistEntry | null;
  isPilotOrWaitlisted: boolean;
  onSubmitCheckin: (answer: CheckinAnswer) => void;
  onSubmitPreCommit: (choice: Exclude<PreCommitChoice, 'Pending'>, objection: string) => void;
  onOpenWaitlist: () => void;
}

export const InsightsTab: React.FC<InsightsTabProps> = ({
  t,
  weeklySummary,
  metrics,
  currentCheckin,
  waitlistEntry,
  isPilotOrWaitlisted,
  onSubmitCheckin,
  onSubmitPreCommit,
  onOpenWaitlist,
}) => {
  const [preCommitChoice, setPreCommitChoice] = useState<Exclude<PreCommitChoice, 'Pending'>>(
    waitlistEntry?.preCommit49 && waitlistEntry.preCommit49 !== 'Pending'
      ? waitlistEntry.preCommit49
      : 'Yes'
  );
  const [objection, setObjection] = useState(waitlistEntry?.preCommitObjection || '');
  const [preCommitSaved, setPreCommitSaved] = useState(
    Boolean(waitlistEntry?.preCommit49 && waitlistEntry.preCommit49 !== 'Pending')
  );

  const totalPayments = PAYMENT_MODES.reduce(
    (sum, mode) => sum + (metrics.paymentBreakdown[mode] || 0),
    0
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Left column: Weekly Summary & Pilot Check-in */}
      <div className="lg:col-span-7 space-y-5">
        <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {t.weeklySummary}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Rolling 7-day summary · {weeklySummary.weekKey}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 p-3.5">
              <p className="text-xs text-slate-500 dark:text-slate-400">Total spent</p>
              <p className="mt-1 text-lg sm:text-xl font-bold font-mono-num text-slate-900 dark:text-white">
                {formatINR(weeklySummary.totalSpent)}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 p-3.5">
              <p className="text-xs text-slate-500 dark:text-slate-400">Top category</p>
              <p className="mt-1 text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                {weeklySummary.topCategory}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 p-3.5">
              <p className="text-xs text-slate-500 dark:text-slate-400">Days on track</p>
              <p className="mt-1 text-lg sm:text-xl font-bold font-mono-num text-teal-700 dark:text-teal-300">
                {weeklySummary.daysOnTrack} / 7
              </p>
            </div>
          </div>

          {/* Single Pilot Research Question */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {t.checkinQuestion}
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {(['Yes', 'No', 'Not sure'] as CheckinAnswer[]).map((answer) => {
                const selected = currentCheckin?.changedSpendingChoice === answer;
                return (
                  <button
                    key={answer}
                    type="button"
                    onClick={() => onSubmitCheckin(answer)}
                    className={`min-h-[48px] rounded-xl text-sm font-semibold border transition flex items-center justify-center gap-1.5 ${
                      selected
                        ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {selected && <Check className="w-4 h-4" />}
                    <span>{answer}</span>
                  </button>
                );
              })}
            </div>
            {currentCheckin && (
              <p className="text-xs text-teal-700 dark:text-teal-300 font-medium">
                Saved for this week&rsquo;s pilot check-in ({currentCheckin.changedSpendingChoice}). Thank you!
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Right column: Payment Mix + Optional ₹49 Pre-commit */}
      <div className="lg:col-span-5 space-y-5">
        {/* Payment Mode Mix */}
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            How you paid this month
          </h3>
          <div className="space-y-3">
            {PAYMENT_MODES.map((mode) => {
              const amount = metrics.paymentBreakdown[mode] || 0;
              const pct = totalPayments > 0 ? Math.round((amount / totalPayments) * 100) : 0;
              return (
                <div key={mode} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{mode}</span>
                    <span className="font-mono-num text-slate-600 dark:text-slate-400">
                      {formatINR(amount)} · {pct}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-teal-600 dark:bg-teal-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Optional ₹49/month Pre-Commitment Card for Waitlisted / Pilot Users */}
        {isPilotOrWaitlisted ? (
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-semibold">Pilot validation question</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Would you pre-commit ₹49/month?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No payment is charged here—this helps us test student pricing before launch.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['Yes', 'No', 'Maybe'] as Array<Exclude<PreCommitChoice, 'Pending'>>).map(
                (choice) => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => {
                      setPreCommitChoice(choice);
                      setPreCommitSaved(false);
                    }}
                    className={`min-h-[44px] rounded-xl text-xs font-semibold border transition ${
                      preCommitChoice === choice
                        ? 'bg-slate-900 dark:bg-teal-600 border-slate-900 dark:border-teal-600 text-white'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {choice}
                  </button>
                )
              )}
            </div>

            <textarea
              rows={2}
              maxLength={300}
              value={objection}
              onChange={(e) => {
                setObjection(e.target.value);
                setPreCommitSaved(false);
              }}
              placeholder="Optional: what would make ₹49/month worth it (or why not)?"
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />

            <button
              type="button"
              onClick={() => {
                onSubmitPreCommit(preCommitChoice, objection);
                setPreCommitSaved(true);
              }}
              className="w-full min-h-[44px] rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition"
            >
              {preCommitSaved ? 'Response saved' : 'Save response'}
            </button>
          </section>
        ) : (
          <section className="rounded-2xl bg-slate-100/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Join the student early-access waitlist
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Test MoneyMate with your hostel or PG allowance and share quick feedback during our 4-week pilot.
            </p>
            <button
              type="button"
              onClick={onOpenWaitlist}
              className="w-full min-h-[44px] rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition"
            >
              Join early-access waitlist
            </button>
          </section>
        )}
      </div>
    </div>
  );
};
