'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AuthGate } from '@/components/AuthGate';
import { PageShell } from '@/components/PageShell';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { apiClient } from '@/lib/api-client';
import { apiErrorMessage } from '@/lib/api-error';
import {
  blobErrorMessage,
  daysAgo,
  downloadBlob,
  formatDateTime,
  formatPrice,
  isoDate,
  toNumber,
} from '@/lib/format';
import type { Agency } from '@/types';

interface SummaryThread {
  thread_id: number;
  thread_name: string;
  packaging: string;
  current_price: string | number;
  change: number;
  change_percent: number;
  trend: 'up' | 'down' | 'flat';
  updated_at: string;
}

interface AgencySummary {
  agency_id: number;
  agency_name: string;
  city: string;
  thread_count: number;
  threads: SummaryThread[];
}

const TREND_CLASS: Record<SummaryThread['trend'], string> = {
  up: 'bg-success-50 text-success-700',
  down: 'bg-alert-50 text-alert-700',
  flat: 'bg-neutral-100 text-neutral-600',
};

const TREND_ICON: Record<SummaryThread['trend'], string> = { up: '↑', down: '↓', flat: '•' };

function Reports() {
  const [summary, setSummary] = useState<AgencySummary[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [days, setDays] = useState(1);
  const [startDate, setStartDate] = useState(daysAgo(7));
  const [endDate, setEndDate] = useState(isoDate());
  const [exportAgency, setExportAgency] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.getAgencySummary({ days });
      setSummary(res.data.data ?? []);
    } catch (error: any) {
      toast.error(apiErrorMessage(error, 'Failed to load summary'));
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    apiClient
      .getAgencies({ limit: 200 })
      .then((res) => setAgencies(res.data.data ?? []))
      .catch(() => {});
  }, []);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await apiClient.getRateHistoryReport({
        start_date: startDate,
        end_date: endDate,
        agency_id: exportAgency ? Number(exportAgency) : undefined,
      });
      downloadBlob(res.data, `rate-history-${startDate}-to-${endDate}.csv`);
      toast.success('CSV downloaded');
    } catch (error: any) {
      toast.error(await blobErrorMessage(error, 'Export failed'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <PageShell title="Reports" description="Market movement by agency, and raw history export.">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <p className="text-sm font-medium text-neutral-700 mb-2">Export rate history to CSV</p>
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
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Agency</label>
            <select
              value={exportAgency}
              onChange={(e) => setExportAgency(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All agencies</option>
              {agencies.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
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
          Dates are interpreted in the server&apos;s timezone (UTC), which runs 5 hours behind PKT.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-semibold text-neutral-900">Agency summary</h2>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
        >
          <option value={1}>Change over last 1 day</option>
          <option value={7}>Change over last 7 days</option>
          <option value={30}>Change over last 30 days</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner label="Building summary..." />
      ) : summary.length === 0 ? (
        <EmptyState message="No agencies to report on" />
      ) : (
        <div className="space-y-6">
          {summary.map((agency) => (
            <div key={agency.agency_id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-200 flex items-baseline justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-neutral-900">{agency.agency_name}</h3>
                  <p className="text-sm text-neutral-500">{agency.city}</p>
                </div>
                <span className="text-sm text-neutral-500">
                  {agency.thread_count} {agency.thread_count === 1 ? 'thread' : 'threads'}
                </span>
              </div>
              {agency.threads.length === 0 ? (
                <p className="px-4 py-6 text-sm text-neutral-500">No rates recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-50 text-neutral-600">
                      <tr>
                        <th className="text-left font-medium px-4 py-2">Thread</th>
                        <th className="text-left font-medium px-4 py-2">Packaging</th>
                        <th className="text-right font-medium px-4 py-2">Current</th>
                        <th className="text-right font-medium px-4 py-2">Change</th>
                        <th className="text-left font-medium px-4 py-2">Updated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {agency.threads.map((t) => (
                        <tr key={t.thread_id} className="hover:bg-neutral-50">
                          <td className="px-4 py-2 font-medium text-neutral-900">{t.thread_name}</td>
                          <td className="px-4 py-2 text-neutral-600">{t.packaging}</td>
                          <td className="px-4 py-2 text-right font-medium text-neutral-900">
                            ₨{formatPrice(t.current_price)}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                TREND_CLASS[t.trend]
                              }`}
                            >
                              {TREND_ICON[t.trend]} {toNumber(t.change) > 0 ? '+' : ''}
                              {formatPrice(t.change)} ({t.change_percent}%)
                            </span>
                          </td>
                          <td className="px-4 py-2 text-neutral-500 whitespace-nowrap">
                            {formatDateTime(t.updated_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}

export default function Page() {
  return (
    <AuthGate allow={['admin']}>
      <Reports />
    </AuthGate>
  );
}
