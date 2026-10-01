'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { Rate } from '@/types';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgency, setSelectedAgency] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }

    fetchRates();
  }, [isAuthenticated, selectedAgency, selectedType]);

  const fetchRates = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getRates({
        agency_id: selectedAgency ? parseInt(selectedAgency) : undefined,
      });
      setRates(response.data.data);
    } catch (error) {
      toast.error('Failed to load rates');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">🧵 SooterMandi</h1>
            <p className="text-sm text-neutral-500">Live Thread Market Rates</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-neutral-900">{user?.name}</p>
            <button
              onClick={() => {
                useAuthStore.getState().logout();
                window.location.href = '/login';
              }}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
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
                <option value="Cotton">Cotton</option>
                <option value="Polyester">Polyester</option>
                <option value="Silk">Silk</option>
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
                <option value="1">Faisalabad Mills</option>
                <option value="2">Lahore Threads</option>
              </select>
            </div>
          </div>
        </div>

        {/* Rates Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900">Latest Rates</h2>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="text-neutral-600 mt-4">Loading rates...</p>
            </div>
          ) : rates.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-neutral-600">No rates found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rates.map((rate) => (
                <div key={rate.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-neutral-900">{rate.thread_name}</h3>
                      <p className="text-sm text-neutral-600">{rate.agency_name}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      rate.change > 0 ? 'bg-success-50 text-success-700' : 'bg-alert-50 text-alert-700'
                    }`}>
                      {rate.change > 0 ? '↑' : '↓'} {Math.abs(rate.change_percent)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-2xl font-bold text-neutral-900">₨{rate.price_pkr}</p>
                      <p className="text-xs text-neutral-500 mt-1">{rate.weight} • {rate.packaging}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-neutral-600">
                        {rate.change > 0 ? '+' : ''}{rate.change}
                      </p>
                      <p className="text-xs text-neutral-500">
                        Updated {new Date(rate.updated_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
