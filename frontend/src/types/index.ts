export interface Rate {
  id: number;
  thread_id: number;
  thread_name: string;
  agency_id: number;
  agency_name: string;
  price_pkr: number;
  previous_price?: number;
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
  description?: string;
  current_price: number;
  last_updated: string;
}

export interface Agency {
  id: number;
  name: string;
  city: string;
  contact_phone?: string;
  contact_email?: string;
  thread_count: number;
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
