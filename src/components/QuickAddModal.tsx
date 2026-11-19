import React, { useEffect, useState } from 'react';
import { Check, Delete, Trash2, X } from 'lucide-react';
import {
  EXPENSE_CATEGORIES,
  Expense,
  ExpenseCategory,
  PAYMENT_MODES,
  PaymentMode,
} from '../types/moneymate';
import { getTodayISO } from '../utils/budgetMath';
import { CategoryIcon } from './CategoryIcon';

interface QuickAddModalProps {
  isOpen: boolean;
  initialCategory?: ExpenseCategory | null;
  initialAmount?: number | null;
  editingExpense?: Expense | null;
  recentCategories: ExpenseCategory[];
  onClose: () => void;
  onSave: (payload: {
    id?: string;
    amount: number;
    category: ExpenseCategory;
    paymentMode: PaymentMode;
    note: string;
    date: string;
  }) => void;
  onDelete?: (id: string) => void;
}

const KEYPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'back'] as const;

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  initialCategory,
  initialAmount,
  editingExpense,
  recentCategories,
  onClose,
  onSave,
  onDelete,
}) => {
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food & delivery');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(getTodayISO());
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    if (editingExpense) {
      setAmountStr(String(Math.round(editingExpense.amount)));
      setCategory(editingExpense.category);
      setPaymentMode(editingExpense.paymentMode);
      setNote(editingExpense.note || '');
      setDate(editingExpense.date);
    } else {
      setAmountStr(initialAmount && initialAmount > 0 ? String(Math.round(initialAmount)) : '');
      setCategory(initialCategory || recentCategories[0] || 'Food & delivery');
      setPaymentMode('UPI');
      setNote('');
      setDate(getTodayISO());
    }
  }, [isOpen, editingExpense, initialCategory, initialAmount, recentCategories]);

  if (!isOpen) return null;

  const parsedAmount = Number(amountStr || '0');

  const handleKeyPress = (key: (typeof KEYPAD_KEYS)[number]) => {
    setError('');
    if (key === 'back') {
      setAmountStr((prev) => prev.slice(0, -1));
      return;
    }
    if (amountStr.length >= 6) return;
    if (amountStr === '' && (key === '0' || key === '00')) return;
    setAmountStr((prev) => prev + key);
  };

  const handleQuickBump = (bump: number) => {
    setError('');
    const next = Math.min(999999, (Number(amountStr || '0') || 0) + bump);
    setAmountStr(String(next));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Enter an amount greater than ₹0');
      return;
    }
    onSave({
      id: editingExpense?.id,
      amount: parsedAmount,
      category,
      paymentMode,
      note: note.trim(),
      date: date || getTodayISO(),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={editingExpense ? 'Edit expense' : 'Add expense'}
    >
      <div className="w-full sm:max-w-md max-h-[94dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 sm:hidden" />

        <form onSubmit={handleSubmit} className="px-4 pb-6 pt-2 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {editingExpense ? 'Edit expense' : 'Quick add expense'}
            </h2>
            <div className="flex items-center gap-1">
              {editingExpense && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(editingExpense.id);
                    onClose();
                  }}
                  aria-label="Delete expense"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Amount Display */}
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 px-4 py-3 text-center">
            <div className="text-3xl font-extrabold font-mono-num text-slate-900 dark:text-white tracking-tight">
              ₹{amountStr ? Number(amountStr).toLocaleString('en-IN') : '0'}
            </div>
            <div className="mt-2 flex items-center justify-center gap-2">
              {[50, 100, 200].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickBump(val)}
                  className="min-h-[36px] px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors"
                >
                  +₹{val}
                </button>
              ))}
              {amountStr && (
                <button
                  type="button"
                  onClick={() => setAmountStr('')}
                  className="min-h-[36px] px-2.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Clear
                </button>
              )}
            </div>
            {error && <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}
          </div>

          {/* Numeric Keypad FIRST for sub-5-second entry */}
          <div className="grid grid-cols-3 gap-2">
            {KEYPAD_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleKeyPress(key)}
                className="min-h-[48px] rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.97] text-lg font-semibold font-mono-num text-slate-900 dark:text-slate-100 flex items-center justify-center transition"
              >
                {key === 'back' ? <Delete className="w-5 h-5" /> : key}
              </button>
            ))}
          </div>

          {/* Category Chips */}
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Category</p>
            <div className="flex flex-wrap gap-2">
              {EXPENSE_CATEGORIES.map((cat) => {
                const active = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`min-h-[42px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition whitespace-nowrap ${
                      active
                        ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {!active && <CategoryIcon category={cat} size="sm" />}
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Mode */}
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_MODES.map((mode) => {
              const active = paymentMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode)}
                  className={`min-h-[44px] rounded-xl text-xs font-semibold border transition ${
                    active
                      ? 'bg-slate-900 dark:bg-teal-600 border-slate-900 dark:border-teal-600 text-white'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {mode}
                </button>
              );
            })}
          </div>

          {/* Optional Note & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={140}
              placeholder="Optional note (e.g. Mess extra)"
              className="min-h-[44px] px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="date"
              value={date}
              max={getTodayISO()}
              onChange={(e) => setDate(e.target.value)}
              aria-label="Expense date"
              className="min-h-[44px] px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Save CTA */}
          <button
            type="submit"
            className="w-full min-h-[50px] rounded-2xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition"
          >
            <Check className="w-4 h-4" />
            <span>{editingExpense ? 'Update expense' : 'Save expense'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
