const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface FetchOptions extends RequestInit {
  token?: string;
}

export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Auth API
export const authApi = {
  register: (email: string, password: string) =>
    apiFetch<{ accessToken: string; user: { id: string; email: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  login: (email: string, password: string) =>
    apiFetch<{ accessToken: string; user: { id: string; email: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: (token: string) =>
    apiFetch<{ id: string; email: string }>('/auth/me', { token }),
};

// Symbols API
export const symbolsApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.search) queryParams.set('search', params.search);
    
    const query = queryParams.toString();
    return apiFetch<{
      data: { id: string; ticker: string; name: string; market: string }[];
      total: number;
      page: number;
      limit: number;
    }>(`/symbols${query ? `?${query}` : ''}`);
  },

  history: (ticker: string, limit = 500) =>
    apiFetch<{
      id: string;
      ticker: string;
      timestamp: string;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }[]>(`/symbols/${ticker}/history?limit=${limit}`),
};

// Watchlist API
export const watchlistApi = {
  list: (token: string) =>
    apiFetch<{
      id: string;
      name: string;
      items: { id: string; symbol: string }[];
    }[]>('/watchlists', { token }),

  create: (token: string, name: string) =>
    apiFetch<{ id: string; name: string; items: [] }>('/watchlists', {
      method: 'POST',
      body: JSON.stringify({ name }),
      token,
    }),

  addItem: (token: string, watchlistId: string, symbol: string) =>
    apiFetch<{ id: string; symbol: string }>(`/watchlists/${watchlistId}/items`, {
      method: 'POST',
      body: JSON.stringify({ symbol }),
      token,
    }),

  removeItem: (token: string, watchlistId: string, itemId: string) =>
    apiFetch<void>(`/watchlists/${watchlistId}/items/${itemId}`, {
      method: 'DELETE',
      token,
    }),

  delete: (token: string, watchlistId: string) =>
    apiFetch<void>(`/watchlists/${watchlistId}`, {
      method: 'DELETE',
      token,
    }),
};
