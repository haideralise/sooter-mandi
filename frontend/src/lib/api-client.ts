import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use((config) => {
      const token = this.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearToken();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  private clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  }

  public setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  // Auth endpoints
  async register(data: {
    name: string;
    email: string;
    phone: string;
    city?: string;
    organization_name?: string;
  }) {
    return this.client.post('/auth/register', data);
  }

  async login(email: string, password: string) {
    return this.client.post('/auth/login', { email, password });
  }

  async logout() {
    return this.client.post('/auth/logout');
  }

  async getMe() {
    return this.client.get('/auth/me');
  }

  // Rates endpoints
  async getRates(params?: { agency_id?: number; thread_id?: number; limit?: number; page?: number }) {
    return this.client.get('/rates', { params });
  }

  async getRateHistory(threadId: number, params?: { hours?: number; days?: number }) {
    return this.client.get(`/rates/${threadId}/history`, { params });
  }

  async getRate(id: number) {
    return this.client.get(`/rates/${id}`);
  }

  async updateRate(data: { thread_id: number; price_pkr: number; godown_address?: string; notes?: string }) {
    return this.client.post('/rates/update', data);
  }

  // Agencies endpoints
  async getAgencies(params?: { city?: string; active_only?: boolean; limit?: number; page?: number }) {
    return this.client.get('/agencies', { params });
  }

  async getAgency(id: number) {
    return this.client.get(`/agencies/${id}`);
  }

  async createAgency(data: {
    name: string;
    city: string;
    godown_address?: string;
    contact_phone?: string;
    contact_email?: string;
  }) {
    return this.client.post('/agencies', data);
  }

  async updateAgency(id: number, data: any) {
    return this.client.put(`/agencies/${id}`, data);
  }

  // Threads endpoints
  async getThreads(params?: { agency_id?: number; type?: string; active_only?: boolean; limit?: number; page?: number }) {
    return this.client.get('/threads', { params });
  }

  async getThread(id: number) {
    return this.client.get(`/threads/${id}`);
  }

  async createThread(data: {
    agency_id: number;
    type: string;
    color: string;
    packaging_type: 'Carton' | 'Bag';
    weight_value?: number;
    weight_unit?: 'lbs' | 'kg' | 'g';
  }) {
    return this.client.post('/threads', data);
  }

  // Subscriptions endpoints
  async getSubscriptions(params?: { limit?: number; page?: number }) {
    return this.client.get('/subscriptions', { params });
  }

  async createSubscription(data: { thread_id?: number; agency_id?: number; notification_type: 'All' | 'Email' | 'Push' }) {
    return this.client.post('/subscriptions', data);
  }

  async deleteSubscription(id: number) {
    return this.client.delete(`/subscriptions/${id}`);
  }

  // Activity logs endpoints (admin only)
  async getActivityLogs(params?: {
    client_id?: number;
    action_type?: string;
    days?: number;
    limit?: number;
    page?: number;
  }) {
    return this.client.get('/activity-logs', { params });
  }

  async exportActivityLogs(params: { start_date: string; end_date: string; client_id?: number }) {
    return this.client.get('/activity-logs/export', { params, responseType: 'blob' });
  }

  // Reports endpoints
  async getAgencySummary(params?: { days?: number; agency_id?: number }) {
    return this.client.get('/reports/agency-summary', { params });
  }

  async getRateHistoryReport(params: {
    start_date: string;
    end_date: string;
    agency_id?: number;
    thread_id?: number;
  }) {
    return this.client.get('/reports/rate-history', { params, responseType: 'blob' });
  }
}

export const apiClient = new ApiClient();
