import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { contactsApi } from './api.js';

const emptyForm = { name: '', email: '', phone: '', company: '' };

function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';
}

function App() {
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadContacts() {
    setLoading(true);
    setError('');
    try {
      setContacts(await contactsApi.list());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadContacts();
  }, []);

  const filteredContacts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return contacts;
    return contacts.filter((contact) =>
      [contact.name, contact.email, contact.phone, contact.company]
        .some((value) => value?.toLowerCase().includes(needle)),
    );
  }, [contacts, query]);

  function beginEdit(contact) {
    setEditingId(contact._id);
    setForm({
      name: contact.name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      company: contact.company || '',
    });
    setError('');
    document.getElementById('contact-name')?.focus();
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value.trim()]),
    );
    try {
      if (editingId) {
        const updated = await contactsApi.update(editingId, payload);
        setContacts((current) => current.map((contact) => contact._id === editingId ? updated : contact));
      } else {
        const created = await contactsApi.create(payload);
        setContacts((current) => [created, ...current]);
      }
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(contact) {
    if (!window.confirm(`Delete ${contact.name}? This cannot be undone.`)) return;
    setError('');
    try {
      await contactsApi.remove(contact._id);
      setContacts((current) => current.filter((item) => item._id !== contact._id));
      if (editingId === contact._id) resetForm();
    } catch (err) {
      setError(err.message);
    }
  }

  const isEditing = Boolean(editingId);

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Contact Desk home">
          <span className="brand-mark" aria-hidden="true">c.</span>
          <span>contact<span className="brand-light">desk</span></span>
        </a>
        <span className="topbar-note"><span className="status-dot" /> Your address book</span>
      </header>

      <main id="top" className="page-content">
        <section className="page-intro">
          <div>
            <p className="eyebrow">PEOPLE, IN ONE PLACE</p>
            <h1>Your contacts</h1>
            <p className="intro-copy">A little more organized, one person at a time.</p>
          </div>
          <div className="contact-total" aria-live="polite">
            <span className="total-number">{contacts.length.toString().padStart(2, '0')}</span>
            <span className="total-label">{contacts.length === 1 ? 'contact saved' : 'contacts saved'}</span>
          </div>
        </section>

        {error && (
          <div className="notice" role="alert">
            <span>{error}</span>
            {!contacts.length && !loading && <button className="text-button" onClick={loadContacts}>Try again</button>}
            <button className="notice-close" onClick={() => setError('')} aria-label="Dismiss error">×</button>
          </div>
        )}

        <section className="workspace-grid">
          <div className="list-panel panel">
            <div className="list-heading">
              <div>
                <h2>All people</h2>
                <p>{loading ? 'Loading your address book…' : `${filteredContacts.length} ${filteredContacts.length === 1 ? 'person' : 'people'}`}</p>
              </div>
              <label className="search-box">
                <span className="search-icon" aria-hidden="true">⌕</span>
                <input
                  type="search"
                  placeholder="Search contacts"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  aria-label="Search contacts"
                />
                {query && <button className="clear-search" onClick={() => setQuery('')} aria-label="Clear search">×</button>}
              </label>
            </div>

            <div className="contact-list" aria-live="polite">
              {loading ? (
                <div className="list-state"><span className="spinner" /> Getting things ready…</div>
              ) : filteredContacts.length ? (
                filteredContacts.map((contact, index) => (
                  <article className={`contact-row ${editingId === contact._id ? 'is-selected' : ''}`} key={contact._id}>
                    <div className={`avatar avatar-${index % 5}`} aria-hidden="true">{initials(contact.name)}</div>
                    <div className="contact-details">
                      <h3>{contact.name}</h3>
                      <a href={`mailto:${contact.email}`}>{contact.email}</a>
                      <div className="contact-meta">
                        {contact.company && <span>{contact.company}</span>}
                        {contact.company && contact.phone && <span className="meta-divider">·</span>}
                        {contact.phone && <span>{contact.phone}</span>}
                        {!contact.company && !contact.phone && <span className="muted">No extra details</span>}
                      </div>
                    </div>
                    <div className="row-actions">
                      <button className="icon-button" onClick={() => beginEdit(contact)} aria-label={`Edit ${contact.name}`} title="Edit contact">✎</button>
                      <button className="icon-button delete-button" onClick={() => handleDelete(contact)} aria-label={`Delete ${contact.name}`} title="Delete contact">⌫</button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-icon" aria-hidden="true">◎</div>
                  <h3>{query ? 'No matches found' : 'It’s quiet in here'}</h3>
                  <p>{query ? 'Try a different name, email, company, or phone.' : 'Add your first person with the form.'}</p>
                  {query && <button className="text-button" onClick={() => setQuery('')}>Clear search</button>}
                </div>
              )}
            </div>
            <div className="list-footer"><span className="footer-sparkle" aria-hidden="true">✳</span> Keep the good people close.</div>
          </div>

          <aside className="form-panel panel">
            <div className="form-heading">
              <div className="form-icon" aria-hidden="true">{isEditing ? '✎' : '+'}</div>
              <div>
                <p className="eyebrow">{isEditing ? 'MAKE A CHANGE' : 'GROW YOUR CIRCLE'}</p>
                <h2>{isEditing ? 'Edit contact' : 'Add someone'}</h2>
              </div>
            </div>
            <p className="form-copy">{isEditing ? 'Update the details below and save your changes.' : 'Save the people you want to stay in touch with.'}</p>
            <form onSubmit={handleSubmit} className="contact-form">
              <label className="field-label" htmlFor="contact-name">Full name <span>*</span></label>
              <input id="contact-name" name="name" autoComplete="name" placeholder="e.g. Jordan Lee" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required maxLength={100} />

              <label className="field-label" htmlFor="contact-email">Email address <span>*</span></label>
              <input id="contact-email" name="email" type="email" autoComplete="email" placeholder="jordan@example.com" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required maxLength={254} />

              <div className="field-pair">
                <div>
                  <label className="field-label" htmlFor="contact-company">Company</label>
                  <input id="contact-company" name="company" autoComplete="organization" placeholder="Studio North" value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} maxLength={100} />
                </div>
                <div>
                  <label className="field-label" htmlFor="contact-phone">Phone</label>
                  <input id="contact-phone" name="phone" type="tel" autoComplete="tel" placeholder="+1 555 010 2030" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} maxLength={40} />
                </div>
              </div>

              <button className="submit-button" type="submit" disabled={saving}>
                <span>{saving ? 'Saving…' : isEditing ? 'Save changes' : 'Add contact'}</span>
                {!saving && <span aria-hidden="true">→</span>}
              </button>
              {isEditing && <button className="cancel-button" type="button" onClick={resetForm} disabled={saving}>Cancel editing</button>}
            </form>
            <div className="form-hint"><span aria-hidden="true">✦</span> Just the essentials. You can update details anytime.</div>
          </aside>
        </section>
      </main>

      <footer className="page-footer"><span>CONTACT DESK</span><span>Simple things, thoughtfully kept.</span></footer>
    </div>
  );
}

export default App;
