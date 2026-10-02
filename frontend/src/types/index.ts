export interface Rate {
  id: number;
  thread_id: number;
  thread_name: string;
  agency_id: number;
  agency_name: string;
  /** Eloquent `decimal:2` casts serialise as strings, e.g. "1500.00". */
  price_pkr: string | number;
  previous_price?: string | number | null;
  change: number;
  change_percent: number;
  packaging: string;
  weight: string;
  updated_at: string;
}

export interface Thread {
  id: number;
  agency_id: number;
  agency_name: string;
  type: string;
  color: string;
  packaging_type: 'Carton' | 'Bag';
  weight: string;
  weight_value?: string | number | null;
  weight_unit?: 'lbs' | 'kg' | 'g';
  description?: string | null;
  is_active: boolean;
  current_price: string | number;
  last_updated: string | null;
}

export interface Agency {
  id: number;
  name: string;
  city: string;
  godown_address?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  is_active: boolean;
  thread_count: number;
  created_at?: string;
}

export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  organization_name?: string;
}

export interface Subscription {
  id: number;
  thread_id?: number;
  thread_name?: string;
  agency_id?: number;
  agency_name?: string;
  notification_type: 'All' | 'Email' | 'Push';
  created_at: string;
}

export interface ActivityLog {
  id: number;
  client_id: number;
  client_name: string;
  action_type: string;
  action_details?: string;
  thread_id?: number;
  agency_id?: number;
  ip_address?: string;
  timestamp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
  details?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

export interface RateHistory {
  price_pkr: number;
  timestamp: string;
}

export interface RateStatistics {
  current: number;
  high: number;
  low: number;
  average: number;
  change?: number;
  change_percent?: number;
}

export type AuthRole = 'client' | 'broker' | 'admin';

/**
 * Clients and staff live in separate backend tables, so the shape differs
 * slightly. Everything past `email` is optional for that reason.
 */
export interface AuthAccount {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  is_active?: boolean;
  last_login?: string | null;
  city?: string | null;
  organization_name?: string | null;
  role?: 'admin' | 'broker';
}

export interface LoginResponseData {
  token: string;
  role: AuthRole;
  client?: AuthAccount;
  user?: AuthAccount;
}

export interface RegisterResponseData {
  client_id: number;
  name: string;
  email: string;
  role: AuthRole;
  token: string;
}

export interface MeResponseData {
  role: AuthRole;
  account: AuthAccount;
}
