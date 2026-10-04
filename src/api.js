const envUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

const STORAGE_KEY = 'contact_desk_user_id';

export function getUserId() {
  if (typeof window === 'undefined') return 'server';
  let userId = localStorage.getItem(STORAGE_KEY);
  if (!userId) {
    userId = 'usr_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    try {
      localStorage.setItem(STORAGE_KEY, userId);
    } catch {
      // localStorage may fail in restricted environments
    }
  }
  return userId;
}

export function resetUserSession() {
  if (typeof window === 'undefined') return '';
  const newUserId = 'usr_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  try {
    localStorage.setItem(STORAGE_KEY, newUserId);
  } catch {}
  return newUserId;
}

async function request(path, options = {}) {
  let fullPath = path;
  if (envUrl.endsWith('/api') && path.startsWith('/api/')) {
    fullPath = path.slice(4);
  } else if (!envUrl && !path.startsWith('/')) {
    fullPath = `/${path}`;
  }

  const url = `${envUrl}${fullPath}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'X-User-Id': getUserId(),
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.message || `Request failed (${response.status})`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const contactsApi = {
  getUserId,
  resetUserSession,
  list: () => request('/api/contacts'),
  seedSamples: () =>
    request('/api/contacts/seed', {
      method: 'POST',
    }),
  create: (contact) =>
    request('/api/contacts', {
      method: 'POST',
      body: JSON.stringify(contact),
    }),
  update: (id, contact) =>
    request(`/api/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(contact),
    }),
  remove: (id) =>
    request(`/api/contacts/${id}`, {
      method: 'DELETE',
    }),
};
