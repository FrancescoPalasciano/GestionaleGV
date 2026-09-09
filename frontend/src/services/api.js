/**
 * API Service for Gestionale GV
 * In development, Vite dev server proxies /api requests to http://localhost:8080.
 * In production, relative path /api automatically routes through reverse proxy or same-origin.
 */

const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '') + '/api/v1';
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('sslip.io')) {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    return `${protocol}//api-gestionale.51.38.98.213.sslip.io/api/v1`;
  }
  return '/api/v1';
};

const API_BASE = getApiBase();

export const tokenStorage = {
  get: () => localStorage.getItem('gv_token'),
  set: (token) => localStorage.setItem('gv_token', token),
  remove: () => localStorage.removeItem('gv_token'),
  getUser: () => {
    const raw = localStorage.getItem('gv_user');
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  setUser: (user) => localStorage.setItem('gv_user', JSON.stringify(user)),
  removeUser: () => localStorage.removeItem('gv_user'),
  clear: () => {
    localStorage.removeItem('gv_token');
    localStorage.removeItem('gv_user');
  }
};

async function request(endpoint, options = {}) {
  const token = tokenStorage.get();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      // Backend returns ErrorResponseDTO: { status, error, message, timestamp, details }
      const errorMsg = data && typeof data === 'object' && data.message 
        ? data.message 
        : (typeof data === 'string' ? data : `Errore HTTP: ${response.status}`);
      
      const error = new Error(errorMsg);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      const netError = new Error('NETWORK_ERROR');
      netError.isNetworkError = true;
      throw netError;
    }
    throw err;
  }
}

export const api = {
  // Auth endpoints
  login: async (credentials) => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (res.token) {
      tokenStorage.set(res.token);
      tokenStorage.setUser(res);
    }
    return res;
  },

  register: async (tabacchinoData) => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(tabacchinoData),
    });
    return res;
  },

  getCurrentUser: async () => {
    return await request('/tabacchini/me');
  },

  // Health check
  checkHealth: async () => {
    return await request('/health');
  },

  logout: () => {
    tokenStorage.clear();
  },

  // Gratta e Vinci endpoints
  gv: {
    getPriceTiers: async () => {
      return await request('/gv/price-tiers');
    },
    addPriceTier: async (price) => {
      return await request('/gv/price-tiers', {
        method: 'POST',
        body: JSON.stringify({ price }),
      });
    },
    removePriceTier: async (price) => {
      return await request(`/gv/price-tiers/${price}`, {
        method: 'DELETE',
      });
    },
    getSalesToday: async () => {
      return await request('/gv/sales/today');
    },
    updateSale: async (price, delta) => {
      return await request('/gv/sales', {
        method: 'POST',
        body: JSON.stringify({ price, delta }),
      });
    },
    resetSalesToday: async () => {
      return await request('/gv/sales/reset', {
        method: 'POST',
      });
    },
    getWinningsToday: async () => {
      return await request('/gv/winnings/today');
    },
    addWinning: async (data) => {
      return await request('/gv/winnings', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    deleteWinning: async (id) => {
      return await request(`/gv/winnings/${id}`, {
        method: 'DELETE',
      });
    },
    getTransactionsToday: async () => {
      return await request('/gv/transactions/today');
    },
    logTransaction: async (data) => {
      return await request('/gv/transactions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    deleteTransaction: async (id) => {
      return await request(`/gv/transactions/${id}`, {
        method: 'DELETE',
      });
    },
    getPurchases: async (period) => {
      const query = period ? `?period=${encodeURIComponent(period)}` : '';
      return await request(`/gv/purchases${query}`);
    },
    addPurchase: async (data) => {
      return await request('/gv/purchases', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateStecca: async (price, delta) => {
      return await request('/gv/purchases/stecca', {
        method: 'POST',
        body: JSON.stringify({ price, delta }),
      });
    },
    deletePurchase: async (id) => {
      return await request(`/gv/purchases/${id}`, {
        method: 'DELETE',
      });
    },
    getStatistics: async (period = 'day', date = null) => {
      const params = new URLSearchParams();
      if (period) params.append('period', period);
      if (date) params.append('date', date);
      const query = params.toString() ? `?${params.toString()}` : '';
      return await request(`/gv/statistics${query}`);
    },
  },

  // Dashboard endpoints
  dashboard: {
    getStats: async (period = 'today') => {
      return await request(`/dashboard/stats?period=${encodeURIComponent(period)}`);
    },
  },
};
