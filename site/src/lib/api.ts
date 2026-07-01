const BASE_URL = 'http://localhost:3001';

export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
}

export type FeatureRequestStatus = 'open' | 'under-review' | 'planned' | 'in-progress' | 'done' | 'declined';

export interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  status: FeatureRequestStatus;
  vote_count: number;
  user_id: string;
  created_at: string;
  updated_at: string;
  has_voted?: boolean;
}

class ApiClient {
  private token: string | null = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers);
    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }
    if (options.body && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
      throw new Error(error.message || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async signup(name: string, email: string): Promise<{ token: string; user: User }> {
    const res = await this.request<{ token: string; user: User }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email }),
    });
    this.setToken(res.token);
    return res;
  }

  async login(email: string): Promise<{ token: string; user: User }> {
    const res = await this.request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    this.setToken(res.token);
    return res;
  }

  logout() {
    this.setToken(null);
  }

  // Feature Requests
  async getFeatureRequests(page = 1, perPage = 20): Promise<{ items: FeatureRequest[]; total: number }> {
    return this.request<{ items: FeatureRequest[]; total: number }>(`/api/feature-requests?page=${page}&per_page=${perPage}`);
  }

  async getFeatureRequest(id: string): Promise<FeatureRequest> {
    return this.request<FeatureRequest>(`/api/feature-requests/${id}`);
  }

  async createFeatureRequest(title: string, description: string): Promise<FeatureRequest> {
    return this.request<FeatureRequest>('/api/feature-requests', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    });
  }

  async toggleVote(id: string): Promise<{ vote_count: number; has_voted: boolean }> {
    return this.request<{ vote_count: number; has_voted: boolean }>(`/api/feature-requests/${id}/vote`, {
      method: 'POST',
    });
  }

  // Admin
  async updateFeatureRequest(id: string, updates: Partial<FeatureRequest>): Promise<FeatureRequest> {
    return this.request<FeatureRequest>(`/api/feature-requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }
}

export const api = new ApiClient();
