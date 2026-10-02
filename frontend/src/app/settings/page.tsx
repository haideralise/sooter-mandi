'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { AuthGate } from '@/components/AuthGate';
import { PageShell } from '@/components/PageShell';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { apiClient } from '@/lib/api-client';
import { apiErrorMessage } from '@/lib/api-error';
import { formatDateTime } from '@/lib/format';
import type { Rate, Subscription } from '@/types';

type NotificationType = 'All' | 'Email' | 'Push';

function Subscriptions() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [threads, setThreads] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [threadId, setThreadId] = useState('');
  const [notificationType, setNotificationType] = useState<NotificationType>('All');

  const load = async () => {
    try {
      setLoading(true);
      const [subRes, rateRes] = await Promise.all([
        apiClient.getSubscriptions({ limit: 200 }),
        apiClient.getRates({ limit: 200 }),
      ]);
      setSubs(subRes.data.data ?? []);
      setThreads(rateRes.data.data ?? []);
    } catch (error: any) {
      toast.error(apiErrorMessage(error, 'Failed to load subscriptions'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const subscribedThreadIds = useMemo(
    () => new Set(subs.map((s) => s.thread_id).filter(Boolean)),
    [subs]
  );

  const available = useMemo(
    () => threads.filter((t) => !subscribedThreadIds.has(t.thread_id)),
    [threads, subscribedThreadIds]
  );

  useEffect(() => {
    if (!threadId && available.length) setThreadId(String(available[0].thread_id));
  }, [available, threadId]);

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!threadId) return;

    const thread = threads.find((t) => t.thread_id === Number(threadId));
    setSaving(true);
    try {
      await apiClient.createSubscription({
        thread_id: Number(threadId),
        agency_id: thread?.agency_id,
        notification_type: notificationType,
      });
      toast.success('Subscribed');
      setThreadId('');
      await load();
    } catch (error: any) {
      toast.error(apiErrorMessage(error, 'Failed to subscribe'));
    } finally {
      setSaving(false);
    }
  };

  const unsubscribe = async (id: number) => {
    try {
      await apiClient.deleteSubscription(id);
      toast.success('Unsubscribed');
      setSubs((prev) => prev.filter((s) => s.id !== id));
    } catch (error: any) {
      toast.error(apiErrorMessage(error, 'Failed to unsubscribe'));
    }
  };

  return (
    <PageShell
      title="Subscriptions"
      description="Choose which threads notify you when their rate changes."
    >
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="font-semibold text-neutral-900 mb-4">Follow a thread</h2>
        <form onSubmit={subscribe} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 mb-2">Thread</label>
            <select
              value={threadId}
              onChange={(e) => setThreadId(e.target.value)}
              disabled={available.length === 0}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-100"
            >
              {available.length === 0 && <option value="">You already follow every thread</option>}
              {available.map((t) => (
                <option key={t.thread_id} value={t.thread_id}>
                  {t.thread_name} — {t.agency_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Notify via</label>
            <div className="flex gap-2">
              <select
                value={notificationType}
                onChange={(e) => setNotificationType(e.target.value as NotificationType)}
                className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="All">All</option>
                <option value="Email">Email</option>
                <option value="Push">Push</option>
              </select>
              <button
                type="submit"
                disabled={saving || available.length === 0}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? '...' : 'Add'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <h2 className="font-semibold text-neutral-900 mb-3">
        Active subscriptions {!loading && <span className="text-neutral-500">({subs.length})</span>}
      </h2>

      {loading ? (
        <LoadingSpinner label="Loading..." />
      ) : subs.length === 0 ? (
        <EmptyState
          message="You are not following any threads yet"
          hint="Add one above to get notified when its rate changes."
        />
      ) : (
        <div className="bg-white rounded-lg shadow divide-y divide-neutral-100">
          {subs.map((sub) => (
            <div key={sub.id} className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium text-neutral-900 truncate">
                  {sub.thread_name ?? 'Whole agency'}
                </p>
                <p className="text-sm text-neutral-500 truncate">
                  {sub.agency_name ?? '—'} · notify via {sub.notification_type} · added{' '}
                  {formatDateTime(sub.created_at)}
                </p>
              </div>
              <button
                onClick={() => unsubscribe(sub.id)}
                className="shrink-0 px-3 py-1.5 text-sm font-medium text-alert-600 hover:bg-alert-50 rounded-lg transition-colors"
              >
                Unsubscribe
              </button>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}

export default function Page() {
  // Staff accounts have no subscriptions relation on the API side, so this page
  // is client-only.
  return (
    <AuthGate allow={['client']}>
      <Subscriptions />
    </AuthGate>
  );
}
