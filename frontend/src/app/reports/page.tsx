'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AuthGate } from '@/components/AuthGate';
import { PageShell } from '@/components/PageShell';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { apiClient } from '@/lib/api-client';
import { apiErrorMessage } from '@/lib/api-error';
import { formatPrice, toNumber } from '@/lib/format';
import type { Rate, RateHistory, RateStatistics } from '@/types';

const RANGES = [
  { label: '6 hours', hours: 6 },
  { label: '24 hours', hours: 24 },
  { label: '7 days', hours: 24 * 7 },
  { label: '30 days', hours: 24 * 30 },
];

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'up' | 'down' }) {
  const toneClass =
    tone === 'up' ? 'text-success-700' : tone === 'down' ? 'text-alert-600' : 'text-neutral-900';
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className={`text-xl font-bold mt-1 ${toneClass}`}>{value}</p>
    </div>
  );
}

function Trends() {
  const [threads, setThreads] = useState<Rate[]>([]);
  const [threadId, setThreadId] = useState<number | null>(null);
  const [hours, setHours] = useState(24);

  const [history, setHistory] = useState<RateHistory[]>([]);
  const [stats, setStats] = useState<RateStatistics | null>(null);
  const [heading, setHeading] = useState<{ name: string; agency: string } | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChart, setLoadingChart] = useState(false);

  useEffect(() => {
    apiClient
      .getRates({ limit: 200 })
      .then((res) => {
        const rows: Rate[] = res.data.data ?? [];
        setThreads(rows);
        if (rows.length) setThreadId(rows[0].thread_id);
      })
      .catch((error) => toast.error(apiErrorMessage(error, 'Failed to load threads')))
      .finally(() => setLoadingList(false));
  }, []);

  useEffect(() => {
    if (!threadId) return;
    setLoadingChart(true);
    apiClient
      .getRateHistory(threadId, { hours })
      .then((res) => {
        const data = res.data.data;
        setHistory(data.history ?? []);
        setStats(data.statistics ?? null);
        setHeading({ name: data.thread_name, agency: data.agency });
      })
      .catch((error) => toast.error(apiErrorMessage(error, 'Failed to load history')))
      .finally(() => setLoadingChart(false));
  }, [threadId, hours]);

  const chartData = useMemo(
    () =>
      history.map((point) => ({
        time: new Date(point.timestamp).toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        price: toNumber(point.price_pkr),
      })),
    [history]
  );

  const change = toNumber(stats?.change);

  return (
    <PageShell title="Rate Trends" description="Price history for a single thread over time.">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Thread</label>
            <select
              value={threadId ?? ''}
              onChange={(e) => setThreadId(Number(e.target.value))}
              disabled={loadingList}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {threads.map((t) => (
                <option key={t.thread_id} value={t.thread_id}>
                  {t.thread_name} — {t.agency_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Range</label>
            <select
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {RANGES.map((r) => (
                <option key={r.hours} value={r.hours}>
                  Last {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loadingList || loadingChart ? (
        <LoadingSpinner label="Loading history..." />
      ) : !threadId || chartData.length === 0 ? (
        <EmptyState
          message="No rate history in this range"
          hint="Try a longer range, or have a broker publish a new rate."
        />
      ) : (
        <>
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <Stat label="Current" value={`₨${formatPrice(stats.current)}`} />
              <Stat label="High" value={`₨${formatPrice(stats.high)}`} />
              <Stat label="Low" value={`₨${formatPrice(stats.low)}`} />
              <Stat label="Average" value={`₨${formatPrice(stats.average)}`} />
              <Stat
                label="Change"
                value={`${change > 0 ? '+' : ''}${formatPrice(change)} (${
                  stats.change_percent ?? 0
                }%)`}
                tone={change > 0 ? 'up' : change < 0 ? 'down' : undefined}
              />
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="font-semibold text-neutral-900">{heading?.name}</h2>
            <p className="text-sm text-neutral-500 mb-4">{heading?.agency}</p>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#6b7280' }} minTickGap={24} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    domain={['auto', 'auto']}
                    width={70}
                    tickFormatter={(v) => `₨${formatPrice(v)}`}
                  />
                  <Tooltip
                    formatter={(v: number) => [`₨${formatPrice(v)}`, 'Rate']}
                    contentStyle={{ borderRadius: 8, borderColor: '#e5e7eb', fontSize: 13 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </PageShell>
  );
}

export default function Page() {
  return (
    <AuthGate>
      <Trends />
    </AuthGate>
  );
}
