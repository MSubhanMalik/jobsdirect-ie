const SESSION_KEY = 'jobsdirect_session';

const getApiBase = () => import.meta.env.VITE_API_URL || '';

const readSession = () => {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
};

const writeSession = (session) => {
  if (typeof window === 'undefined') return;
  if (!session) {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

async function apiFetch(path, options = {}) {
  const session = readSession();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (session?.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }
  const response = await fetch(`${getApiBase()}${path}`, {
    ...options,
    headers,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Request failed');
    error.status = response.status;
    Object.assign(error, data);
    throw error;
  }
  return data;
}

function normalizeEntityListResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

const createEntityApi = (entityName) => ({
  async list(order = '-created_date', limit) {
    const params = new URLSearchParams();
    params.set('order', order);
    if (typeof limit === 'number') params.set('limit', String(limit));
    const data = await apiFetch(`/api/entities/${entityName}?${params.toString()}`);
    return normalizeEntityListResponse(data);
  },
  async filter(filters = {}, order = '-created_date', limit) {
    const params = new URLSearchParams();
    params.set('order', order);
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) params.set(key, String(value));
    });
    if (typeof limit === 'number') params.set('limit', String(limit));
    const data = await apiFetch(`/api/entities/${entityName}?${params.toString()}`);
    return normalizeEntityListResponse(data);
  },
  async create(payload = {}) {
    return apiFetch(`/api/entities/${entityName}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async update(id, updates = {}) {
    return apiFetch(`/api/entities/${entityName}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },
});

const auth = {
  async isAuthenticated() {
    const session = readSession();
    if (!session?.token) return false;
    try {
      await apiFetch('/api/auth/me');
      return true;
    } catch {
      writeSession(null);
      return false;
    }
  },
  async me() {
    const user = await apiFetch('/api/auth/me');
    const session = readSession();
    writeSession({ ...session, user });
    return user;
  },
  async login({ email, password }) {
    const result = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    writeSession(result);
    return result.user;
  },
  async register({ full_name, email, password, role }) {
    return apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ full_name, email, password, role }),
    });
  },
  async verifyEmail({ email, code }) {
    const result = await apiFetch('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
    writeSession(result);
    return result.user;
  },
  async resendVerification({ email }) {
    return apiFetch('/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
  async forgotPassword({ email }) {
    return apiFetch('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
  async resetPassword({ token, password }) {
    return apiFetch('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  },
  async logout(redirectTo = '/') {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    writeSession(null);
    if (typeof window !== 'undefined' && redirectTo) {
      window.location.assign(redirectTo);
    }
  },
  redirectToLogin(returnTo) {
    if (typeof window === 'undefined') return;
    const target = `/auth${returnTo ? `?redirect=${encodeURIComponent(returnTo)}` : ''}`;
    window.location.assign(target);
  },
};

const functions = {
  async invoke(name, payload = {}) {
    const result = await apiFetch(`/api/functions/${name}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { data: { data: result.data || result } };
  },
};

export const digify = {
  auth,
  entities: {
    Job: createEntityApi('Job'),
    Employer: createEntityApi('Employer'),
    Employee: createEntityApi('Employee'),
    Application: createEntityApi('Application'),
    ContactMessage: createEntityApi('ContactMessage'),
  },
  functions,
  utils: {
    reset() {
      writeSession(null);
    },
    readSession,
  },
};
