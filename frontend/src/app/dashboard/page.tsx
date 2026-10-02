'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { AuthGate } from '@/components/AuthGate';
import { PageShell } from '@/components/PageShell';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { apiClient } from '@/lib/api-client';
import { apiErrorMessage } from '@/lib/api-error';
import { formatPrice, formatTime, threadType } from '@/lib/format';
import type { Agency, Rate } from '@/types';

function Rates() {
  const [rates, setRates] = useState<Rate[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgency, setSelectedAgency] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const fetchRates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.getRates({
        agency_id: selectedAgency ? parseInt(selectedAgency, 10) : undefined,
        limit: 200,
      });
      setRates(response.data.data ?? []);
    } catch (error: any) {
      toast.error(apiErrorMessage(error, 'Failed to load rates'));
    } finally {
      setLoading(false);
    }
  }, [selectedAgency]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  useEffect(() => {
    apiClient
      .getAgencies({ limit: 200 })
      .then((res) => setAgencies(res.data.data ?? []))
      .catch(() => {
        // Non-fatal: the filter just falls back to "All Agencies".
      });
  }, []);

  // /rates has no thread-type filter, so narrow client-side.
  const threadTypes = useMemo(
    () => Array.from(new Set(rates.map((r) => threadType(r.thread_name)))).sort(),
    [rates]
  );

  const visibleRates = useMemo(
    () => (selectedType ? rates.filter((r) => threadType(r.thread_name) === selectedType) : rates),
    [rates, selectedType]
  );

  return (
    <PageShell title="Live Rates" description="The current rate for every thread in the market.">
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Thread Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Types</option>
              {threadTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Agency</label>
            <select
              value={selectedAgency}
              onChange={(e) => setSelectedAgency(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Agencies</option>
              {agencies.map((agency) => (
                <option key={agency.id} value={String(agency.id)}>
                  {agency.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Latest Rates</h2>
          {!loading && (
            <p className="text-sm text-neutral-500">
              {visibleRates.length} {visibleRates.length === 1 ? 'thread' : 'threads'}
            </p>
          )}
        </div>

        {loading ? (
          <LoadingSpinner label="Loading rates..." />
        ) : visibleRates.length === 0 ? (
          <EmptyState message="No rates found" hint="Try clearing the filters above." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleRates.map((rate) => {
              const up = rate.change > 0;
              const down = rate.change < 0;
              const badge = up
                ? 'bg-success-50 text-success-700'
                : down
                ? 'bg-alert-50 text-alert-700'
                : 'bg-neutral-100 text-neutral-600';

              return (
                <div key={rate.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-neutral-900">{rate.thread_name}</h3>
                      <p className="text-sm text-neutral-600">{rate.agency_name}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge}`}>
                      {up ? '↑' : down ? '↓' : '•'} {Math.abs(rate.change_percent)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-2xl font-bold text-neutral-900">
                        ₨{formatPrice(rate.price_pkr)}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {rate.weight} • {rate.packaging}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-neutral-600">
                        {up ? '+' : ''}
                        {rate.change}
                      </p>
                      <p className="text-xs text-neutral-500">Updated {formatTime(rate.updated_at)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}

export default function Page() {
  return (
    <AuthGate>
      <Rates />
    </AuthGate>
  );
}
