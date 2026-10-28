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
  get: () => localStorage.getItem('gv_token') || sessionStorage.getItem('gv_token'),
  set: (token, persistent = true) => {
    const target = persistent ? localStorage : sessionStorage;
    const other = persistent ? sessionStorage : localStorage;
    other.removeItem('gv_token');
    target.setItem('gv_token', token);
  },
  remove: () => {
    localStorage.removeItem('gv_token');
    sessionStorage.removeItem('gv_token');
  },
  getUser: () => {
    const raw = localStorage.getItem('gv_user') || sessionStorage.getItem('gv_user');
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  setUser: (user, persistent = true) => {
    const target = persistent ? localStorage : sessionStorage;
    const other = persistent ? sessionStorage : localStorage;
    other.removeItem('gv_user');
    target.setItem('gv_user', JSON.stringify(user));
  },
  removeUser: () => {
    localStorage.removeItem('gv_user');
    sessionStorage.removeItem('gv_user');
  },
  clear: () => {
    localStorage.removeItem('gv_token');
    localStorage.removeItem('gv_user');
    sessionStorage.removeItem('gv_token');
    sessionStorage.removeItem('gv_user');
  }
};

// Emesso a ogni chiamata API fallita per problemi di rete (backend irraggiungibile, timeout)
export const NETWORK_ERROR_EVENT = 'api:network-error';

async function request(endpoint, { timeoutMs, ...options } = {}) {
  const token = tokenStorage.get();
  // Con FormData il browser imposta da solo Content-Type multipart con il boundary
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const controller = timeoutMs ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  const config = {
    ...options,
    headers,
    ...(controller ? { signal: controller.signal } : {}),
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
      if (response.status === 401 && token) {
        tokenStorage.clear();
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
      throw error;
    }

    return data;
  } catch (err) {
    // TypeError: fetch fallita (rete giù, DNS, CORS); AbortError: timeout scaduto
    if (err.name === 'AbortError' || (err.name === 'TypeError' && /fetch|network|load failed/i.test(err.message))) {
      const netError = new Error('NETWORK_ERROR');
      netError.isNetworkError = true;
      if (endpoint !== '/health' && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(NETWORK_ERROR_EVENT));
      }
      throw netError;
    }
    throw err;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export const api = {
  // Auth endpoints
  login: async (credentials, rememberMe = true) => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (res.token) {
      tokenStorage.set(res.token, rememberMe);
      const profile = await request('/tabacchini/me');
      const authenticatedUser = { ...res, ...profile };
      tokenStorage.setUser(authenticatedUser, rememberMe);
      return authenticatedUser;
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
    return await request('/health', { timeoutMs: 5000 });
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
    updateSaleAndLog: async (price, delta, timeRecorded) => {
      return await request('/gv/sales/transaction', {
        method: 'POST',
        body: JSON.stringify({ price, delta, timeRecorded }),
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
    addWinningAndLog: async (data) => {
      return await request('/gv/winnings/transaction', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    getTransactionsToday: async () => {
      return await request('/gv/transactions/today');
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
    updateStecca: async (price, delta) => {
      return await request('/gv/purchases/stecca', {
        method: 'POST',
        body: JSON.stringify({ price, delta }),
      });
    },
    addSingles: async (data) => {
      return await request('/gv/purchases/singles', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    deletePurchase: async (id) => {
      return await request(`/gv/purchases/${id}`, {
        method: 'DELETE',
      });
    },
    previewInvoice: async (file) => {
      const body = new FormData();
      body.append('file', file);
      return await request('/gv/purchases/invoice/preview', {
        method: 'POST',
        body,
      });
    },
    importInvoice: async (data) => {
      return await request('/gv/purchases/invoice/import', {
        method: 'POST',
        body: JSON.stringify(data),
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
