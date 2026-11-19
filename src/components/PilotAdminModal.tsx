import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, X } from 'lucide-react';
import { fetchAdminPilotDataCloud } from '../services/dataStore';
import { PilotSummary, WaitlistEntry } from '../types/moneymate';

interface PilotAdminModalProps {
  isOpen: boolean;
  isAdminUser: boolean;
  isSignedIn: boolean;
  localPilotSummaries: PilotSummary[];
  localWaitlistEntries: WaitlistEntry[];
  onClose: () => void;
}

function escapeCsv(val: string | number | boolean | undefined): string {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export const PilotAdminModal: React.FC<PilotAdminModalProps> = ({
  isOpen,
  isAdminUser,
  isSignedIn,
  localPilotSummaries,
  localWaitlistEntries,
  onClose,
}) => {
  const [pilotRows, setPilotRows] = useState<PilotSummary[]>(localPilotSummaries);
  const [waitlistRows, setWaitlistRows] = useState<WaitlistEntry[]>(localWaitlistEntries);
  const [loading, setLoading] = useState(false);
  const [sourceLabel, setSourceLabel] = useState('Local / Demo Pilot Cohort');

  const loadCloud = async () => {
    if (!isSignedIn || !isAdminUser) return;
    setLoading(true);
    try {
      const res = await fetchAdminPilotDataCloud();
      if (res.pilotSummaries.length > 0 || res.waitlistEntries.length > 0) {
        setPilotRows(res.pilotSummaries);
        setWaitlistRows(res.waitlistEntries);
        setSourceLabel('Live Firestore Pilot Database');
      }
    } catch (err) {
      console.error('Could not load cloud pilot metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setPilotRows(localPilotSummaries);
    setWaitlistRows(localWaitlistEntries);
    setSourceLabel('Local / Demo Pilot Cohort');
    if (isSignedIn && isAdminUser) {
      void loadCloud();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isSignedIn, isAdminUser, localPilotSummaries, localWaitlistEntries]);

  if (!isOpen) return null;

  const week4ActiveCount = pilotRows.filter((r) => r.week4Active).length;
  const week4Pct = pilotRows.length > 0 ? Math.round((week4ActiveCount / pilotRows.length) * 100) : 0;
  const preCommitYes = pilotRows.filter((r) => r.preCommit49 === 'Yes').length;
  const preCommitPct = pilotRows.length > 0 ? Math.round((preCommitYes / pilotRows.length) * 100) : 0;

  const handleDownloadCSV = () => {
    const headers = [
      'Type',
      'UserID',
      'Name',
      'Contact',
      'College',
      'StayType',
      'Week4Active',
      'WeeklyActions',
      'ActiveWeeks',
      'CheckinAnswer',
      'PreCommit49',
      'Objection',
    ];
    const lines = [headers.join(',')];

    for (const p of pilotRows) {
      lines.push(
        [
          'PilotUser',
          p.userId,
          p.displayName,
          '',
          p.college || '',
          p.stayType || '',
          p.week4Active,
          p.weeklyActionsCount,
          p.activeWeeksCount,
          p.lastCheckinAnswer,
          p.preCommit49,
          p.preCommitObjection || '',
        ]
          .map(escapeCsv)
          .join(',')
      );
    }

    for (const w of waitlistRows) {
      lines.push(
        [
          'Waitlist',
          w.userId,
          w.name,
          w.contact,
          w.college,
          `${w.year} / ${w.stayType}`,
          '',
          '',
          '',
          '',
          w.preCommit49,
          w.preCommitObjection || '',
        ]
          .map(escapeCsv)
          .join(',')
      );
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moneymate-pilot-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Pilot metrics and CSV export"
    >
      <div className="w-full sm:max-w-3xl max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-teal-700 dark:text-teal-300">{sourceLabel}</p>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Pilot Cohort &amp; Research Export
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Week 4 active = opened or logged at least 3 times per week.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isSignedIn && isAdminUser && (
              <button
                type="button"
                onClick={() => void loadCloud()}
                disabled={loading}
                aria-label="Refresh cloud pilot data"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close pilot view"
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 p-3.5">
            <p className="text-xs text-slate-500 dark:text-slate-400">Pilot users</p>
            <p className="mt-1 text-xl font-bold font-mono-num text-slate-900 dark:text-white">
              {pilotRows.length}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 p-3.5">
            <p className="text-xs text-slate-500 dark:text-slate-400">Active in Week 4</p>
            <p className="mt-1 text-xl font-bold font-mono-num text-teal-700 dark:text-teal-300">
              {week4ActiveCount} ({week4Pct}%)
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 p-3.5">
            <p className="text-xs text-slate-500 dark:text-slate-400">Waitlist signups</p>
            <p className="mt-1 text-xl font-bold font-mono-num text-slate-900 dark:text-white">
              {waitlistRows.length}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 p-3.5">
            <p className="text-xs text-slate-500 dark:text-slate-400">Pre-commit ₹49/mo</p>
            <p className="mt-1 text-xl font-bold font-mono-num text-emerald-700 dark:text-emerald-300">
              {preCommitYes} ({preCommitPct}%)
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <th className="py-2.5 px-3 font-semibold">Student</th>
                <th className="py-2.5 px-3 font-semibold">Stay</th>
                <th className="py-2.5 px-3 font-semibold">Week 4 active</th>
                <th className="py-2.5 px-3 font-semibold">Check-in</th>
                <th className="py-2.5 px-3 font-semibold">₹49/mo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {pilotRows.map((row) => (
                <tr key={row.userId} className="text-slate-800 dark:text-slate-200">
                  <td className="py-2.5 px-3">
                    <div className="font-semibold">{row.displayName}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {row.college || 'Campus not set'}
                    </div>
                  </td>
                  <td className="py-2.5 px-3">{row.stayType || '—'}</td>
                  <td className="py-2.5 px-3 font-mono-num">
                    {row.week4Active ? 'Yes' : 'No'} · {row.weeklyActionsCount}/wk
                  </td>
                  <td className="py-2.5 px-3">{row.lastCheckinAnswer}</td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold">{row.preCommit49}</div>
                    {row.preCommitObjection && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
                        {row.preCommitObjection}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={handleDownloadCSV}
          className="w-full min-h-[48px] rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition"
        >
          <Download className="w-4 h-4" />
          <span>Download Pilot CSV</span>
        </button>
      </div>
    </div>
  );
};
