// Client-side cache / temporary memory storage
// Each user / browser session only sees the contacts they personally added.

const STORAGE_KEY = 'contact_desk_local_cache_v1';

function getStoredContacts() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Could not read from local cache:', err);
    return [];
  }
}

function saveStoredContacts(contacts) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  } catch (err) {
    console.warn('Could not save to local cache:', err);
  }
}

function generateId() {
  const hex = '0123456789abcdef';
  let id = '';
  for (let i = 0; i < 24; i++) {
    id += hex[Math.floor(Math.random() * 16)];
  }
  return id;
}

// Simulates instant / realistic async cache operations
const delay = (ms = 40) => new Promise((resolve) => setTimeout(resolve, ms));

export const contactsApi = {
  list: async () => {
    await delay(30);
    const contacts = getStoredContacts();
    return contacts.sort(
      (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
    );
  },

  create: async (contactData) => {
    await delay(50);
    const { name, email, phone = '', company = '' } = contactData || {};
    if (!name || !name.trim()) {
      throw new Error('Name is required');
    }
    if (!email || !email.trim()) {
      throw new Error('Email is required');
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email.trim())) {
      throw new Error('Enter a valid email address');
    }

    const now = new Date().toISOString();
    const newContact = {
      _id: generateId(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: String(phone || '').trim(),
      company: String(company || '').trim(),
      createdAt: now,
      updatedAt: now,
    };

    const contacts = getStoredContacts();
    const updated = [newContact, ...contacts];
    saveStoredContacts(updated);
    return newContact;
  },

  update: async (id, contactData) => {
    await delay(50);
    const { name, email, phone = '', company = '' } = contactData || {};
    if (!name || !name.trim()) {
      throw new Error('Name is required');
    }
    if (!email || !email.trim()) {
      throw new Error('Email is required');
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email.trim())) {
      throw new Error('Enter a valid email address');
    }

    const contacts = getStoredContacts();
    const index = contacts.findIndex((c) => c._id === id);
    if (index === -1) {
      throw new Error('Contact not found');
    }

    const updatedContact = {
      ...contacts[index],
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: String(phone || '').trim(),
      company: String(company || '').trim(),
      updatedAt: new Date().toISOString(),
    };

    contacts[index] = updatedContact;
    saveStoredContacts(contacts);
    return updatedContact;
  },

  remove: async (id) => {
    await delay(40);
    const contacts = getStoredContacts();
    const index = contacts.findIndex((c) => c._id === id);
    if (index === -1) {
      throw new Error('Contact not found');
    }
    contacts.splice(index, 1);
    saveStoredContacts(contacts);
    return true;
  },

  seedSamples: async () => {
    await delay(60);
    const samples = [
      { name: 'Jordan Lee', email: 'jordan.lee@example.com', phone: '+1 (555) 234-5678', company: 'Northwind Studio' },
      { name: 'Sarah Chen', email: 'sarah.chen@techcorp.io', phone: '+1 (555) 987-6543', company: 'TechCorp Labs' },
      { name: 'Marcus Brody', email: 'm.brody@designcollective.com', phone: '+1 (555) 345-6789', company: 'Design Collective' },
    ];

    const now = Date.now();
    const newDocs = samples.map((s, idx) => ({
      _id: generateId(),
      name: s.name,
      email: s.email,
      phone: s.phone,
      company: s.company,
      createdAt: new Date(now - (3 - idx) * 60000).toISOString(),
      updatedAt: new Date(now - (3 - idx) * 60000).toISOString(),
    }));

    const current = getStoredContacts();
    const merged = [...newDocs, ...current];
    saveStoredContacts(merged);
    return merged;
  },

  clearAll: async () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
    return [];
  },
};
