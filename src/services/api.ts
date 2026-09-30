import { Report, AdminStats, HazardCategory, PriorityLevel, ReportStatus, User } from '../types';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('roadsafe_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Auth
  async register(data: any) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Registration failed');
    return result;
  },

  async login(credentials: { email: string; password: string }) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Login failed');
    return result;
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Session expired');
    return result;
  },

  // Reports
  async submitReport(payload: any) {
    const res = await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to submit report');
    return result;
  },

  async getReports(params?: {
    category?: string;
    priority?: string;
    status?: string;
    city?: string;
    mine?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ reports: Report[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          searchParams.append(k, String(v));
        }
      });
    }

    const res = await fetch(`${API_BASE}/reports?${searchParams.toString()}`, {
      headers: getAuthHeaders(),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to fetch reports');
    return result;
  },

  async getReportById(id: string) {
    const res = await fetch(`${API_BASE}/reports/${id}`, {
      headers: getAuthHeaders(),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to fetch report');
    return result;
  },

  async upvoteReport(id: string) {
    const res = await fetch(`${API_BASE}/reports/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: 'upvote' }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to upvote');
    return result;
  },

  async deleteReport(id: string) {
    const res = await fetch(`${API_BASE}/reports/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to delete report');
    return result;
  },

  // AI preview
  async analyzeWithAI(data: { image?: string; mimeType?: string; description?: string; userCategory?: string }) {
    const res = await fetch(`${API_BASE}/ai/analyze`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'AI analysis failed');
    return result;
  },

  // Map
  async getMapReports(params?: { category?: string; priority?: string; status?: string; city?: string }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v && v !== 'all') searchParams.append(k, v);
      });
    }
    const res = await fetch(`${API_BASE}/map/reports?${searchParams.toString()}`);
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to load map data');
    return result.reports;
  },

  // Admin
  async getAdminStats(): Promise<AdminStats> {
    const res = await fetch(`${API_BASE}/admin/statistics`, {
      headers: getAuthHeaders(),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to fetch admin statistics');
    return result;
  },

  async getAdminReports(params?: any): Promise<{ reports: Report[] }> {
    const searchParams = new URLSearchParams(params || {});
    const res = await fetch(`${API_BASE}/admin/reports?${searchParams.toString()}`, {
      headers: getAuthHeaders(),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to fetch admin reports');
    return result;
  },

  async updateReportStatus(id: string, status: ReportStatus, comment?: string) {
    const res = await fetch(`${API_BASE}/admin/reports/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, comment }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update status');
    return result;
  },

  async updateReportPriority(id: string, priority: PriorityLevel, reasoning?: string) {
    const res = await fetch(`${API_BASE}/admin/reports/${id}/priority`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ priority, reasoning }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update priority');
    return result;
  },

  async addAdminNote(id: string, note: string) {
    const res = await fetch(`${API_BASE}/admin/reports/${id}/notes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ note }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to add note');
    return result;
  },

  async assignDepartment(id: string, assignedTo: string) {
    const res = await fetch(`${API_BASE}/admin/reports/${id}/assign`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ assignedTo }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to assign');
    return result;
  },

  async mergeReports(id: string, targetIncidentId?: string, targetReportId?: string) {
    const res = await fetch(`${API_BASE}/admin/reports/${id}/merge`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ targetIncidentId, targetReportId }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to merge report');
    return result;
  },
};
