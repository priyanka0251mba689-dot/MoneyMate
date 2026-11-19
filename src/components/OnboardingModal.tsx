import React, { useState } from 'react';
import { ArrowRight, Check, Plus, ShieldCheck, Trash2, X } from 'lucide-react';
import {
  Budget,
  CollegeYear,
  FixedCostItem,
  StayType,
  UserProfile,
} from '../types/moneymate';
import { addDaysISO, diffDaysISO, formatINR, getTodayISO } from '../utils/budgetMath';

interface OnboardingModalProps {
  isOpen: boolean;
  initialProfile: UserProfile;
  initialBudget: Budget;
  isSignedIn: boolean;
  onSignInGoogle: () => void;
  onComplete: (profile: UserProfile, budget: Budget) => void;
  onClose: () => void;
}

const YEARS: CollegeYear[] = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'PG / Other'];
const STAY_TYPES: StayType[] = ['Hostel', 'PG', 'Shared Flat'];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  initialProfile,
  initialBudget,
  isSignedIn,
  onSignInGoogle,
  onComplete,
  onClose,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState(initialProfile.name === 'Aarav Sharma' ? '' : initialProfile.name);
  const [college, setCollege] = useState(initialProfile.college || '');
  const [year, setYear] = useState<CollegeYear>(initialProfile.year || '1st Year');
  const [stayType, setStayType] = useState<StayType>(initialProfile.stayType || 'Hostel');

  const [allowance, setAllowance] = useState(String(initialBudget.allowance || 8000));
  const [nextDate, setNextDate] = useState(
    initialBudget.nextAllowanceDate || addDaysISO(getTodayISO(), 25)
  );
  const [fixedCosts, setFixedCosts] = useState<FixedCostItem[]>([
    { id: 'fc-1', label: 'Hostel / PG rent share', amount: 2200 },
    { id: 'fc-2', label: 'Phone recharge', amount: 249 },
  ]);
  const [newLabel, setNewLabel] = useState('');
  const [newAmount, setNewAmount] = useState('');

  if (!isOpen) return null;

  const today = getTodayISO();
  const totalFixed = fixedCosts.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const allowanceNum = Math.max(0, Number(allowance) || 0);
  const spendable = Math.max(0, allowanceNum - totalFixed);
  const daysRemaining = Math.max(1, diffDaysISO(today, nextDate));
  const dailySafePreview = Math.round(spendable / daysRemaining);

  const handleAddRow = () => {
    const amt = Number(newAmount);
    if (!newLabel.trim() || !amt || amt <= 0) return;
    setFixedCosts((prev) => [
      ...prev,
      { id: `fc-${Date.now()}`, label: newLabel.trim(), amount: amt },
    ]);
    setNewLabel('');
    setNewAmount('');
  };

  const handleFinish = () => {
    const now = new Date().toISOString();
    const nextProfile: UserProfile = {
      ...initialProfile,
      name: name.trim() || 'Student',
      college: college.trim() || undefined,
      year,
      stayType,
      onboardingCompleted: true,
      updatedAt: now,
    };
    const nextBudget: Budget = {
      userId: initialProfile.uid,
      allowance: allowanceNum,
      cycleStartDate: today,
      nextAllowanceDate: nextDate > today ? nextDate : addDaysISO(today, 30),
      fixedCosts: fixedCosts.filter((f) => f.label.trim() && f.amount > 0),
      updatedAt: now,
    };
    onComplete(nextProfile, nextBudget);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="2-minute setup"
    >
      <div className="w-full sm:max-w-lg max-h-[94dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-teal-700 dark:text-teal-300">
              Step {step} of 3 · Under 2 minutes
            </p>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {step === 1
                ? 'Set up your student profile'
                : step === 2
                  ? 'Your monthly allowance'
                  : 'Fixed monthly costs'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close setup"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-colors ${
                s <= step ? 'bg-teal-600' : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            {!isSignedIn && (
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 p-3.5 flex items-center justify-between gap-3">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Want cloud backup across devices?
                </p>
                <button
                  type="button"
                  onClick={onSignInGoogle}
                  className="min-h-[38px] px-3 rounded-xl bg-slate-900 dark:bg-teal-600 text-white text-xs font-semibold whitespace-nowrap"
                >
                  Google Sign-In
                </button>
              </div>
            )}

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Your name
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ananya"
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                College / Campus (optional)
              </span>
              <input
                type="text"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="e.g. NIT Warangal"
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100"
              />
            </label>

            <div className="space-y-1.5">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Year
              </span>
              <div className="flex flex-wrap gap-2">
                {YEARS.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setYear(y)}
                    className={`min-h-[40px] px-3 rounded-xl text-xs font-semibold border transition ${
                      year === y
                        ? 'bg-teal-600 border-teal-600 text-white'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Where do you stay?
              </span>
              <div className="grid grid-cols-3 gap-2">
                {STAY_TYPES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStayType(s)}
                    className={`min-h-[44px] rounded-xl text-xs font-semibold border transition ${
                      stayType === s
                        ? 'bg-teal-600 border-teal-600 text-white'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full min-h-[48px] rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition"
            >
              <span>Next: Allowance</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Monthly allowance or stipend (₹)
              </span>
              <input
                type="number"
                min={0}
                value={allowance}
                onChange={(e) => setAllowance(e.target.value)}
                className="w-full min-h-[48px] px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xl font-bold font-mono-num text-slate-900 dark:text-white"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              {[5000, 8000, 10000, 12000, 15000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAllowance(String(preset))}
                  className="min-h-[38px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold font-mono-num text-slate-800 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-teal-950/50"
                >
                  {formatINR(preset)}
                </button>
              ))}
            </div>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                When does your next allowance arrive?
              </span>
              <input
                type="date"
                value={nextDate}
                min={addDaysISO(today, 1)}
                onChange={(e) => setNextDate(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100"
              />
            </label>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="min-h-[48px] px-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 min-h-[48px] rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold flex items-center justify-center gap-2"
              >
                <span>Next: Fixed costs</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Subtract rent share, phone recharge, or subscriptions so your daily safe limit reflects money you can actually spend.
            </p>

            <div className="space-y-2">
              {fixedCosts.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 px-3 py-2"
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
                      onClick={() =>
                        setFixedCosts((prev) => prev.filter((f) => f.id !== item.id))
                      }
                      aria-label={`Remove ${item.label}`}
                      className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-12 gap-2">
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Item (e.g. Mess fee)"
                className="col-span-6 min-h-[44px] px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              />
              <input
                type="number"
                min={1}
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="₹"
                className="col-span-4 min-h-[44px] px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono-num"
              />
              <button
                type="button"
                onClick={handleAddRow}
                aria-label="Add fixed cost"
                className="col-span-2 min-h-[44px] rounded-xl bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Live Calculation Preview */}
            <div className="rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 p-4 space-y-1">
              <p className="text-xs text-teal-800 dark:text-teal-200">
                Spendable this month: <strong className="font-mono-num">{formatINR(spendable)}</strong>{' '}
                over {daysRemaining} days
              </p>
              <p className="text-base font-bold text-teal-900 dark:text-teal-100">
                Your daily safe-to-spend:{' '}
                <span className="font-mono-num">{formatINR(dailySafePreview)}/day</span>
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
              <span>We never read your SMS or bank accounts.</span>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="min-h-[48px] px-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="flex-1 min-h-[48px] rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Start tracking</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
