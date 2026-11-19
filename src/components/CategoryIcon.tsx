import React from 'react';
import {
  BookOpen,
  Bus,
  MoreHorizontal,
  Repeat,
  ShoppingBag,
  Users,
  Utensils,
} from 'lucide-react';
import { ExpenseCategory } from '../types/moneymate';

export const CATEGORY_META: Record<
  ExpenseCategory,
  {
    icon: React.ComponentType<{ className?: string }>;
    tintBg: string;
    tintText: string;
    barColor: string;
  }
> = {
  'Food & delivery': {
    icon: Utensils,
    tintBg: 'bg-teal-50 dark:bg-teal-950/60',
    tintText: 'text-teal-700 dark:text-teal-300',
    barColor: 'bg-teal-600 dark:bg-teal-500',
  },
  Travel: {
    icon: Bus,
    tintBg: 'bg-sky-50 dark:bg-sky-950/60',
    tintText: 'text-sky-700 dark:text-sky-300',
    barColor: 'bg-sky-600 dark:bg-sky-500',
  },
  Subscriptions: {
    icon: Repeat,
    tintBg: 'bg-indigo-50 dark:bg-indigo-950/60',
    tintText: 'text-indigo-700 dark:text-indigo-300',
    barColor: 'bg-indigo-600 dark:bg-indigo-500',
  },
  Shopping: {
    icon: ShoppingBag,
    tintBg: 'bg-amber-50 dark:bg-amber-950/60',
    tintText: 'text-amber-700 dark:text-amber-300',
    barColor: 'bg-amber-600 dark:bg-amber-500',
  },
  'Social outings': {
    icon: Users,
    tintBg: 'bg-rose-50 dark:bg-rose-950/60',
    tintText: 'text-rose-700 dark:text-rose-300',
    barColor: 'bg-rose-600 dark:bg-rose-500',
  },
  Academics: {
    icon: BookOpen,
    tintBg: 'bg-emerald-50 dark:bg-emerald-950/60',
    tintText: 'text-emerald-700 dark:text-emerald-300',
    barColor: 'bg-emerald-600 dark:bg-emerald-500',
  },
  Other: {
    icon: MoreHorizontal,
    tintBg: 'bg-slate-100 dark:bg-slate-800',
    tintText: 'text-slate-700 dark:text-slate-300',
    barColor: 'bg-slate-500 dark:bg-slate-400',
  },
};

export const CategoryIcon: React.FC<{ category: ExpenseCategory; size?: 'sm' | 'md' }> = ({
  category,
  size = 'md',
}) => {
  const meta = CATEGORY_META[category] ?? CATEGORY_META.Other;
  const Icon = meta.icon;
  const box = size === 'sm' ? 'w-8 h-8 rounded-lg' : 'w-10 h-10 rounded-xl';
  const ico = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <div className={`${box} ${meta.tintBg} ${meta.tintText} flex items-center justify-center shrink-0`}>
      <Icon className={ico} />
    </div>
  );
};
