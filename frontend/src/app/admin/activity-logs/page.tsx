'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AuthGate } from '@/components/AuthGate';
import { PageShell } from '@/components/PageShell';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { apiClient } from '@/lib/api-client';
import { apiErrorMessage } from '@/lib/api-error';
import { blobErrorMessage, daysAgo, downloadBlob, formatDateTime, isoDate } from '@/lib/format';
import type { ActivityLog } from '@/types';

const RANGES = [1, 7, 30, 90];

function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [days, setDays] = useState(7);
  const [actionType, setActionType] = useState('');
  const [startDate, setStartDate] = useState(daysAgo(7));
  const [endDate, setEndDate] = useState(isoDate());

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.getActivityLogs({
        days,
        action_type: actionType || undefined,
        limit: 100,
      });
      setLogs(res.data.data ?? []);
      setTotal(res.data.pagination?.total ?? 0);
    } catch (error: any) {
      toast.error(apiErrorMessage(error, 'Failed to load activity logs'));
    } finally {
      setLoading(false);
    }
  }, [days, actionType]);

  useEffect(() => {
    load();
  }, [load]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await apiClient.exportActivityLogs({
        start_date: startDate,
        end_date: endDate,
      });
      downloadBlob(res.data, `activity-logs-${startDate}-to-${endDate}.csv`);
      toast.success('CSV downloaded');
    } catch (error: any) {
      toast.error(await blobErrorMessage(error, 'Export failed'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <PageShell
      title="Client Activity"
      description="What clients have been doing, and when."
    >
      <div className="bg-white rounded-lg shadow p-6 mb-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Period</label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {RANGES.map((d) => (
                <option key={d} value={d}>
                  Last {d} {d === 1 ? 'day' : 'days'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Action type <span className="text-neutral-400 font-normal">(optional)</span>
            </label>
            <input
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              placeholder="logged_in, registered, viewed_rate..."
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="border-t border-neutral-200 pt-4">
          <p className="text-sm font-medium text-neutral-700 mb-2">Export a date range to CSV</p>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-neutral-500 mb-1">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button
              onClick={exportCsv}
              disabled={exporting}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {exporting ? 'Exporting...' : 'Download CSV'}
            </button>
          </div>
          <p className="text-xs text-neutral-500 mt-2">
            Dates are interpreted in the server&apos;s timezone (UTC).
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading activity..." />
      ) : logs.length === 0 ? (
        <EmptyState
          message="No activity in this period"
          hint="Try a longer period, or clear the action type filter."
        />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-200 text-sm text-neutral-600">
            Showing {logs.length} of {total}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="text-left font-medium px-4 py-3">When</th>
                  <th className="text-left font-medium px-4 py-3">Client</th>
                  <th className="text-left font-medium px-4 py-3">Action</th>
                  <th className="text-left font-medium px-4 py-3">Details</th>
                  <th className="text-left font-medium px-4 py-3">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="px-4 py-3 font-medium text-neutral-900">{log.client_name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">
                        {log.action_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{log.action_details || '—'}</td>
                    <td className="px-4 py-3 text-neutral-500">{log.ip_address || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageShell>
  );
}

export default function Page() {
  return (
    <AuthGate allow={['admin']}>
      <ActivityLogs />
    </AuthGate>
  );
}
