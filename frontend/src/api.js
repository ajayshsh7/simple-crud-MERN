const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
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
  list: () => request('/contacts'),
  create: (contact) => request('/contacts', { method: 'POST', body: JSON.stringify(contact) }),
  update: (id, contact) => request(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(contact) }),
  remove: (id) => request(`/contacts/${id}`, { method: 'DELETE' }),
};
