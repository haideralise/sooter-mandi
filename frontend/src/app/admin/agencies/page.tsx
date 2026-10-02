'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AuthGate } from '@/components/AuthGate';
import { PageShell } from '@/components/PageShell';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { apiClient } from '@/lib/api-client';
import { apiErrorMessage, apiFieldErrors } from '@/lib/api-error';
import type { Agency } from '@/types';

const BLANK = {
  name: '',
  city: '',
  godown_address: '',
  contact_phone: '',
  contact_email: '',
};

function Agencies() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(BLANK);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const load = async () => {
    try {
      setLoading(true);
      // active_only=false so deactivated agencies stay visible to admins.
      const res = await apiClient.getAgencies({ limit: 200, active_only: false });
      setAgencies(res.data.data ?? []);
    } catch (error: any) {
      toast.error(apiErrorMessage(error, 'Failed to load agencies'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const reset = () => {
    setForm(BLANK);
    setEditingId(null);
    setFieldErrors({});
  };

  const startEdit = (agency: Agency) => {
    setEditingId(agency.id);
    setFieldErrors({});
    setForm({
      name: agency.name,
      city: agency.city,
      godown_address: agency.godown_address ?? '',
      contact_phone: agency.contact_phone ?? '',
      contact_email: agency.contact_email ?? '',
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});

    const payload = {
      name: form.name,
      city: form.city,
      godown_address: form.godown_address || undefined,
      contact_phone: form.contact_phone || undefined,
      contact_email: form.contact_email || undefined,
    };

    try {
      if (editingId) {
        await apiClient.updateAgency(editingId, payload);
        toast.success('Agency updated');
      } else {
        await apiClient.createAgency(payload);
        toast.success('Agency created');
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

  const setActive = async (agency: Agency, isActive: boolean) => {
    try {
      if (isActive) {
        await apiClient.updateAgency(agency.id, { is_active: true });
      } else {
        await apiClient.deleteAgency(agency.id);
      }
      toast.success(`${agency.name} ${isActive ? 'reactivated' : 'deactivated'}`);
      await load();
    } catch (error: any) {
      toast.error(apiErrorMessage(error, 'Update failed'));
    }
  };

  const input = (key: keyof typeof BLANK, label: string, opts: { required?: boolean; type?: string; placeholder?: string } = {}) => (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        {label}
        {!opts.required && <span className="text-neutral-400 font-normal"> (optional)</span>}
      </label>
      <input
        type={opts.type ?? 'text'}
        required={opts.required}
        placeholder={opts.placeholder}
        value={form[key]}
        onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
          fieldErrors[key] ? 'border-alert-500' : 'border-neutral-300'
        }`}
      />
      {fieldErrors[key] && <p className="text-sm text-alert-600 mt-1">{fieldErrors[key]}</p>}
    </div>
  );

  return (
    <PageShell title="Agencies" description="Thread mills and agencies supplying the market.">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={submit} className="bg-white rounded-lg shadow p-6 space-y-4 h-fit">
          <h2 className="font-semibold text-neutral-900">
            {editingId ? 'Edit agency' : 'New agency'}
          </h2>
          {input('name', 'Name', { required: true, placeholder: 'Faisalabad Cotton Mills' })}
          {input('city', 'City', { required: true, placeholder: 'Faisalabad' })}
          {input('godown_address', 'Godown address', { placeholder: 'Godown 14, Sooter Mandi' })}
          {input('contact_phone', 'Phone', { placeholder: '0411234567' })}
          {input('contact_email', 'Email', { type: 'email', placeholder: 'sales@mill.local' })}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingId ? 'Save changes' : 'Create agency'}
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
            <LoadingSpinner label="Loading agencies..." />
          ) : agencies.length === 0 ? (
            <EmptyState message="No agencies yet" hint="Create the first one using the form." />
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 text-neutral-600">
                    <tr>
                      <th className="text-left font-medium px-4 py-3">Agency</th>
                      <th className="text-left font-medium px-4 py-3">City</th>
                      <th className="text-left font-medium px-4 py-3">Contact</th>
                      <th className="text-left font-medium px-4 py-3">Status</th>
                      <th className="text-right font-medium px-4 py-3">Threads</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {agencies.map((agency) => (
                      <tr key={agency.id} className="hover:bg-neutral-50">
                        <td className="px-4 py-3 font-medium text-neutral-900">{agency.name}</td>
                        <td className="px-4 py-3 text-neutral-600">{agency.city}</td>
                        <td className="px-4 py-3 text-neutral-600">
                          {agency.contact_phone || agency.contact_email || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                              agency.is_active
                                ? 'bg-success-50 text-success-700'
                                : 'bg-neutral-100 text-neutral-500'
                            }`}
                          >
                            {agency.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-neutral-600">
                          {agency.thread_count}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => startEdit(agency)}
                            className="px-2 py-1 text-primary-600 hover:bg-primary-50 rounded font-medium"
                          >
                            Edit
                          </button>
                          {agency.is_active ? (
                            <button
                              onClick={() => setActive(agency, false)}
                              className="px-2 py-1 text-alert-600 hover:bg-alert-50 rounded font-medium ml-1"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => setActive(agency, true)}
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
      <Agencies />
    </AuthGate>
  );
}
