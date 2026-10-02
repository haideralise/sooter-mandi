'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AuthGate } from '@/components/AuthGate';
import { PageShell } from '@/components/PageShell';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { apiClient } from '@/lib/api-client';
import { apiErrorMessage, apiFieldErrors } from '@/lib/api-error';
import { formatPrice } from '@/lib/format';
import type { Agency, Thread } from '@/types';

const BLANK = {
  agency_id: '',
  type: '',
  color: '',
  packaging_type: 'Carton' as 'Carton' | 'Bag',
  weight_value: '',
  weight_unit: 'lbs' as 'lbs' | 'kg' | 'g',
  description: '',
};

function Threads() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(BLANK);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const load = async () => {
    try {
      setLoading(true);
      const [threadRes, agencyRes] = await Promise.all([
        apiClient.getThreads({ limit: 200, active_only: false }),
        apiClient.getAgencies({ limit: 200 }),
      ]);
      setThreads(threadRes.data.data ?? []);
      setAgencies(agencyRes.data.data ?? []);
    } catch (error: any) {
      toast.error(apiErrorMessage(error, 'Failed to load threads'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!form.agency_id && agencies.length) {
      setForm((p) => ({ ...p, agency_id: String(agencies[0].id) }));
    }
  }, [agencies, form.agency_id]);

  const reset = () => {
    setEditingId(null);
    setFieldErrors({});
    setForm({ ...BLANK, agency_id: agencies.length ? String(agencies[0].id) : '' });
  };

  const startEdit = (thread: Thread) => {
    setEditingId(thread.id);
    setFieldErrors({});
    setForm({
      agency_id: String(thread.agency_id),
      type: thread.type,
      color: thread.color,
      packaging_type: thread.packaging_type,
      weight_value: thread.weight_value != null ? String(parseFloat(String(thread.weight_value))) : '',
      weight_unit: thread.weight_unit ?? 'lbs',
      description: thread.description ?? '',
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});

    const weight = form.weight_value ? parseFloat(form.weight_value) : undefined;

    try {
      if (editingId) {
        // The API's thread update does not accept agency_id.
        await apiClient.updateThread(editingId, {
          type: form.type,
          color: form.color,
          packaging_type: form.packaging_type,
          weight_value: weight,
          weight_unit: form.weight_unit,
          description: form.description || undefined,
        });
        toast.success('Thread updated');
      } else {
        await apiClient.createThread({
          agency_id: Number(form.agency_id),
          type: form.type,
          color: form.color,
          packaging_type: form.packaging_type,
          weight_value: weight,
          weight_unit: form.weight_unit,
          description: form.description || undefined,
        });
        toast.success('Thread created');
      }
      reset();
      await load();
    } catch (error: any) {
      setFieldErrors(apiFieldErrors(error));
      toast.error(apiErrorMessage(error, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (thread: Thread, isActive: boolean) => {
    try {
      await apiClient.updateThread(thread.id, { is_active: isActive });
      toast.success(isActive ? 'Thread activated' : 'Thread deactivated');
      await load();
    } catch (error: any) {
      toast.error(apiErrorMessage(error, 'Update failed'));
    }
  };

  const err = (key: string) =>
    fieldErrors[key] ? <p className="text-sm text-alert-600 mt-1">{fieldErrors[key]}</p> : null;

  return (
    <PageShell title="Thread Catalog" description="Products each agency sells, and their packaging.">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={submit} className="bg-white rounded-lg shadow p-6 space-y-4 h-fit">
          <h2 className="font-semibold text-neutral-900">
            {editingId ? 'Edit thread' : 'New thread'}
          </h2>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Agency</label>
            <select
              value={form.agency_id}
              onChange={(e) => setForm((p) => ({ ...p, agency_id: e.target.value }))}
              disabled={Boolean(editingId)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-100"
            >
              {agencies.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            {editingId && (
              <p className="text-xs text-neutral-500 mt-1">Agency cannot be changed after creation.</p>
            )}
            {err('agency_id')}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Type</label>
              <input
                required
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                placeholder="Cotton"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              {err('type')}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Color</label>
              <input
                required
                value={form.color}
                onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                placeholder="White"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              {err('color')}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Packaging</label>
              <select
                value={form.packaging_type}
                onChange={(e) =>
                  setForm((p) => ({ ...p, packaging_type: e.target.value as 'Carton' | 'Bag' }))
                }
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="Carton">Carton</option>
                <option value="Bag">Bag</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Weight</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.weight_value}
                onChange={(e) => setForm((p) => ({ ...p, weight_value: e.target.value }))}
                placeholder="100"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Unit</label>
              <select
                value={form.weight_unit}
                onChange={(e) =>
                  setForm((p) => ({ ...p, weight_unit: e.target.value as 'lbs' | 'kg' | 'g' }))
                }
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="lbs">lbs</option>
                <option value="kg">kg</option>
                <option value="g">g</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Description <span className="text-neutral-400 font-normal">(optional)</span>
            </label>
            <input
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || agencies.length === 0}
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingId ? 'Save changes' : 'Create thread'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={reset}
                className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-900 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="lg:col-span-2">
          {loading ? (
            <LoadingSpinner label="Loading threads..." />
          ) : threads.length === 0 ? (
            <EmptyState message="No threads yet" hint="Create one using the form." />
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 text-neutral-600">
                    <tr>
                      <th className="text-left font-medium px-4 py-3">Thread</th>
                      <th className="text-left font-medium px-4 py-3">Agency</th>
                      <th className="text-left font-medium px-4 py-3">Packaging</th>
                      <th className="text-left font-medium px-4 py-3">Status</th>
                      <th className="text-right font-medium px-4 py-3">Current</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {threads.map((thread) => (
                      <tr key={thread.id} className="hover:bg-neutral-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-neutral-900">
                            {thread.type} - {thread.color}
                          </p>
                          {thread.description && (
                            <p className="text-xs text-neutral-500">{thread.description}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-neutral-600">{thread.agency_name}</td>
                        <td className="px-4 py-3 text-neutral-600">
                          {thread.weight} · {thread.packaging_type}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                              thread.is_active
                                ? 'bg-success-50 text-success-700'
                                : 'bg-neutral-100 text-neutral-500'
                            }`}
                          >
                            {thread.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-neutral-900 font-medium">
                          ₨{formatPrice(thread.current_price)}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => startEdit(thread)}
                            className="px-2 py-1 text-primary-600 hover:bg-primary-50 rounded font-medium"
                          >
                            Edit
                          </button>
                          {thread.is_active ? (
                            <button
                              onClick={() => toggleActive(thread, false)}
                              className="px-2 py-1 text-alert-600 hover:bg-alert-50 rounded font-medium ml-1"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleActive(thread, true)}
                              className="px-2 py-1 text-success-700 hover:bg-success-50 rounded font-medium ml-1"
                            >
                              Reactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

export default function Page() {
  return (
    <AuthGate allow={['admin']}>
      <Threads />
    </AuthGate>
  );
}
