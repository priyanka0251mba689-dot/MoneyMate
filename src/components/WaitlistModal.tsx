import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { CollegeYear, PreCommitChoice, StayType, WaitlistEntry } from '../types/moneymate';

interface WaitlistModalProps {
  isOpen: boolean;
  existingEntry: WaitlistEntry | null;
  userId: string;
  onClose: () => void;
  onSubmitWaitlist: (entry: WaitlistEntry) => void;
  onSubmitPreCommit: (choice: Exclude<PreCommitChoice, 'Pending'>, objection: string) => void;
}

const YEARS: CollegeYear[] = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'PG / Other'];
const STAYS: StayType[] = ['Hostel', 'PG', 'Shared Flat'];

export const WaitlistModal: React.FC<WaitlistModalProps> = ({
  isOpen,
  existingEntry,
  userId,
  onClose,
  onSubmitWaitlist,
  onSubmitPreCommit,
}) => {
  const [step, setStep] = useState<'form' | 'precommit' | 'done'>(
    existingEntry ? 'precommit' : 'form'
  );
  const [name, setName] = useState(existingEntry?.name || '');
  const [contact, setContact] = useState(existingEntry?.contact || '');
  const [college, setCollege] = useState(existingEntry?.college || '');
  const [year, setYear] = useState<CollegeYear>(existingEntry?.year || '1st Year');
  const [stayType, setStayType] = useState<StayType>(existingEntry?.stayType || 'Hostel');
  const [error, setError] = useState('');

  const [preCommit, setPreCommit] = useState<Exclude<PreCommitChoice, 'Pending'>>(
    existingEntry?.preCommit49 && existingEntry.preCommit49 !== 'Pending'
      ? existingEntry.preCommit49
      : 'Yes'
  );
  const [objection, setObjection] = useState(existingEntry?.preCommitObjection || '');

  if (!isOpen) return null;

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contact.trim() || !college.trim()) {
      setError('Please fill in your name, email/WhatsApp, and college.');
      return;
    }
    setError('');
    const now = new Date().toISOString();
    onSubmitWaitlist({
      userId,
      name: name.trim(),
      contact: contact.trim(),
      college: college.trim(),
      year,
      stayType,
      preCommit49: 'Pending',
      createdAt: now,
      updatedAt: now,
    });
    setStep('precommit');
  };

  const handlePreCommitSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitPreCommit(preCommit, objection);
    setStep('done');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Early-access waitlist"
    >
      <div className="w-full sm:max-w-lg max-h-[94dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-teal-700 dark:text-teal-300">
              MoneyMate Student Pilot
            </p>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {step === 'form'
                ? 'Join early-access waitlist'
                : step === 'precommit'
                  ? 'One quick pilot question'
                  : 'You are on the early-access list'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Make your allowance last the whole month. Built for hostel &amp; PG students in India.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close waitlist"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'form' && (
          <form onSubmit={handleJoin} className="space-y-3.5">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Full name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rohan Mehta"
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Email or WhatsApp number
              </span>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="e.g. rohan@college.edu or +91 98..."
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">College</span>
              <input
                type="text"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="e.g. NIT Surathkal"
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100"
              />
            </label>

            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Year</span>
              <div className="flex flex-wrap gap-2">
                {YEARS.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setYear(y)}
                    className={`min-h-[38px] px-3 rounded-xl text-xs font-semibold border transition ${
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

            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Hostel / PG
              </span>
              <div className="grid grid-cols-3 gap-2">
                {STAYS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStayType(s)}
                    className={`min-h-[42px] rounded-xl text-xs font-semibold border transition ${
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

            {error && <p className="text-xs font-medium text-rose-600">{error}</p>}

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
              <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
              <span>We never read your SMS or bank accounts.</span>
            </div>

            <button
              type="submit"
              className="w-full min-h-[48px] rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold transition"
            >
              Join early-access waitlist
            </button>
          </form>
        )}

        {step === 'precommit' && (
          <form onSubmit={handlePreCommitSave} className="space-y-4">
            <div className="rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 p-4 space-y-1">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Would you pre-commit ₹49/month?
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Only for pilot &amp; waitlisted students. Zero payment is collected today—your honest answer helps shape our student pricing.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {(['Yes', 'No', 'Maybe'] as Array<Exclude<PreCommitChoice, 'Pending'>>).map(
                (choice) => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => setPreCommit(choice)}
                    className={`min-h-[48px] rounded-xl text-sm font-semibold border transition ${
                      preCommit === choice
                        ? 'bg-teal-600 border-teal-600 text-white'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {choice}
                  </button>
                )
              )}
            </div>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                What is your biggest hesitation or feedback? (optional)
              </span>
              <textarea
                rows={3}
                maxLength={300}
                value={objection}
                onChange={(e) => setObjection(e.target.value)}
                placeholder="e.g. Price feels right if reminders work, or I prefer ₹29..."
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-sm text-slate-900 dark:text-slate-100"
              />
            </label>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[46px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Skip for now
              </button>
              <button
                type="submit"
                className="flex-1 min-h-[46px] rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold"
              >
                Save answer
              </button>
            </div>
          </form>
        )}

        {step === 'done' && (
          <div className="py-4 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-teal-600 mx-auto" />
            <div className="space-y-1">
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                Thanks for helping build MoneyMate!
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Your waitlist spot and ₹49/mo feedback ({preCommit}) have been recorded.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[46px] rounded-2xl bg-teal-600 text-white text-sm font-bold"
            >
              Back to MoneyMate
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
