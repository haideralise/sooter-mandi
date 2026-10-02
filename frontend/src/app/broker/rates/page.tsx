'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { AuthGate } from '@/components/AuthGate';
import { PageShell } from '@/components/PageShell';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { apiClient } from '@/lib/api-client';
import { apiErrorMessage, apiFieldErrors } from '@/lib/api-error';
import { formatPrice, formatTime, toNumber } from '@/lib/format';
import type { Rate } from '@/types';

function UpdateRates() {
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const [threadId, setThreadId] = useState<number | null>(null);
  const [price, setPrice] = useState('');
  const [godown, setGodown] = useState('');
  const [notes, setNotes] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getRates({ limit: 200 });
      setRates(res.data.data ?? []);
    } catch (error: any) {
      toast.error(apiErrorMessage(error, 'Failed to load threads'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const selected = useMemo(
    () => rates.find((r) => r.thread_id === threadId) ?? null,
    [rates, threadId]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rates;
    return rates.filter(
      (r) =>
        r.thread_name.toLowerCase().includes(q) || r.agency_name.toLowerCase().includes(q)
    );
  }, [rates, search]);

  const select = (rate: Rate) => {
    setThreadId(rate.thread_id);
    setPrice(String(toNumber(rate.price_pkr)));
    setGodown('');
    setNotes('');
    setFieldErrors({});
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!threadId) return;

    setSaving(true);
    setFieldErrors({});
    try {
      await apiClient.updateRate({
        thread_id: threadId,
        price_pkr: parseFloat(price),
        godown_address: godown || undefined,
        notes: notes || undefined,
      });
      toast.success('Rate updated — subscribers notified');
      setNotes('');
      await load();
    } catch (error: any) {
      setFieldErrors(apiFieldErrors(error));
      toast.error(apiErrorMessage(error, 'Failed to update rate'));
    } finally {
      setSaving(false);
    }
  };

  const delta = selected ? parseFloat(price || '0') - toNumber(selected.price_pkr) : 0;

  return (
    <PageShell
      title="Update Rate"
      description="Pick a thread, enter the new rate. Subscribed clients are notified automatically."
    >
      {loading ? (
        <LoadingSpinner label="Loading threads..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 bg-white rounded-lg shadow">
            <div className="p-4 border-b border-neutral-200">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search thread or agency..."
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="max-h-[32rem] overflow-y-auto divide-y divide-neutral-100">
              {filtered.map((rate) => (
                <button
                  key={rate.thread_id}
                  onClick={() => select(rate)}
                  className={`w-full text-left px-4 py-3 hover:bg-neutral-50 transition-colors ${
                    rate.thread_id === threadId ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-center gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-neutral-900 truncate">{rate.thread_name}</p>
                      <p className="text-sm text-neutral-500 truncate">{rate.agency_name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-neutral-900">₨{formatPrice(rate.price_pkr)}</p>
                      <p className="text-xs text-neutral-500">{formatTime(rate.updated_at)}</p>
                    </div>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="px-4 py-8 text-center text-neutral-500">No threads match “{search}”</p>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            {/* Sticky only from lg up: on mobile the form stacks under the
                list, where sticking to a desktop-height offset looks wrong. */}
            <form onSubmit={submit} className="bg-white rounded-lg shadow p-6 space-y-4 lg:sticky lg:top-32">
              {!selected ? (
                <p className="text-neutral-600 text-sm">Select a thread from the list to update its rate.</p>
              ) : (
                <>
                  <div>
                    <p className="text-sm text-neutral-500">Updating</p>
                    <p className="font-semibold text-neutral-900">{selected.thread_name}</p>
                    <p className="text-sm text-neutral-600">{selected.agency_name}</p>
                    <p className="text-sm text-neutral-500 mt-1">
                      Current: ₨{formatPrice(selected.price_pkr)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      New rate (₨)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        fieldErrors.price_pkr ? 'border-alert-500' : 'border-neutral-300'
                      }`}
                    />
                    {fieldErrors.price_pkr && (
                      <p className="text-sm text-alert-600 mt-1">{fieldErrors.price_pkr}</p>
                    )}
                    {price !== '' && delta !== 0 && (
                      <p
                        className={`text-sm mt-1 font-medium ${
                          delta > 0 ? 'text-success-700' : 'text-alert-600'
                        }`}
                      >
                        {delta > 0 ? '▲' : '▼'} {delta > 0 ? '+' : ''}
                        {delta.toFixed(2)} vs current
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Godown address <span className="text-neutral-400 font-normal">(optional)</span>
                    </label>
                    <input
                      value={godown}
                      onChange={(e) => setGodown(e.target.value)}
                      placeholder="Defaults to the agency's godown"
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Notes <span className="text-neutral-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="e.g. Slight increase due to market demand"
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Publish new rate'}
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}

export default function Page() {
  return (
    <AuthGate allow={['broker', 'admin']}>
      <UpdateRates />
    </AuthGate>
  );
}
