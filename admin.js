(function () {
  'use strict';

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  const RESOURCES = {
    gallery: {
      label: 'Gallery',
      hasPhoto: true,
      fields: [
        { key: 'event', label: 'Event name', type: 'text', required: true, placeholder: 'e.g. Annual Sports Day' },
        { key: 'date', label: 'Date', type: 'text', placeholder: 'e.g. 30 Jan 2027' },
        { key: 'caption', label: 'Caption', type: 'text', placeholder: 'Optional caption' },
      ],
      title: i => i.event || 'Untitled event',
      subtitle: i => [i.date, i.caption].filter(Boolean).join(' · '),
    },
    staff: {
      label: 'Staff',
      hasPhoto: true,
      fields: [
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'role', label: 'Role', type: 'text', required: true, placeholder: 'e.g. Principal, Teacher, Counsellor' },
        { key: 'bio', label: 'Short bio', type: 'textarea' },
      ],
      title: i => i.name,
      subtitle: i => i.role,
    },
    events: {
      label: 'Popup Events',
      hasPhoto: false,
      fields: [
        { key: 'title', label: 'Popup title', type: 'text', required: true, placeholder: 'e.g. Admissions Open for 2026–27' },
        { key: 'message', label: 'Message', type: 'textarea', required: true },
        { key: 'link', label: 'Link (optional)', type: 'text', placeholder: 'e.g. admissions.html' },
        { key: 'active', label: 'Show this popup on the site now', type: 'checkbox' },
      ],
      title: i => i.title,
      subtitle: i => i.message,
      pill: i => (i.active ? 'Live on site' : 'Hidden'),
    },
    schemes: {
      label: 'Schemes',
      hasPhoto: false,
      fields: [
        { key: 'title', label: 'Scheme title', type: 'text', required: true, placeholder: 'e.g. Sibling Fee Concession' },
        { key: 'description', label: 'Description', type: 'textarea', required: true },
        { key: 'active', label: 'Show this scheme on the site now', type: 'checkbox' },
      ],
      title: i => i.title,
      subtitle: i => i.description,
      pill: i => (i.active ? 'Live on site' : 'Hidden'),
    },
    fees: {
      label: 'Fees',
      hasPhoto: false,
      fields: [
        { key: 'className', label: 'Class / Grade', type: 'text', required: true, placeholder: 'e.g. Nursery' },
        { key: 'amount', label: 'Fee amount', type: 'text', required: true, placeholder: 'e.g. ₹45,000' },
      ],
      title: i => i.className,
      subtitle: i => i.amount,
    },
  };

  const state = {}; // resource -> { items: [], editingId: null, pendingPhoto: null }
  Object.keys(RESOURCES).forEach(k => { state[k] = { items: [], editingId: null, pendingPhoto: null }; });

  const loginScreen = document.getElementById('login-screen');
  const shell = document.getElementById('admin-shell');
  const loginForm = document.getElementById('login-form');
  const loginStatus = document.getElementById('login-status');
  const logoutBtn = document.getElementById('logout-btn');
  const nav = document.getElementById('admin-nav');

  async function api(path, opts) {
    const res = await fetch(path, Object.assign({ credentials: 'same-origin' }, opts));
    let body = {};
    try { body = await res.json(); } catch { /* no body */ }
    if (!res.ok || body.ok === false) throw new Error(body.error || `Request failed (${res.status})`);
    return body;
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function renderPanel(key) {
    const cfg = RESOURCES[key];
    const s = state[key];
    const panel = document.getElementById(`panel-${key}`);
    const editing = s.editingId ? s.items.find(i => i.id === s.editingId) : null;

    const fieldsHtml = cfg.fields.map(f => {
      const val = editing ? editing[f.key] : '';
      if (f.type === 'textarea') {
        return `<label>${escapeHtml(f.label)}<textarea name="${f.key}" ${f.required ? 'required' : ''}>${escapeHtml(val || '')}</textarea></label>`;
      }
      if (f.type === 'checkbox') {
        return `<label class="checkline"><input type="checkbox" name="${f.key}" ${val ? 'checked' : ''}> ${escapeHtml(f.label)}</label>`;
      }
      return `<label>${escapeHtml(f.label)}<input name="${f.key}" type="text" placeholder="${escapeHtml(f.placeholder || '')}" ${f.required ? 'required' : ''} value="${escapeHtml(val || '')}"></label>`;
    }).join('');

    const photoHtml = cfg.hasPhoto
      ? `<label>Photo ${editing && editing.photoUrl ? '(leave empty to keep current photo)' : ''}<input type="file" name="photo" accept="image/*"></label>`
      : '';

    panel.innerHTML = `
      <h2>${escapeHtml(cfg.label)}</h2>
      <p class="hint">${editing ? 'Editing an existing entry.' : `Add a new ${cfg.label.toLowerCase()} entry.`}</p>
      <form class="admin-form" data-resource="${key}">
        ${fieldsHtml}
        ${photoHtml}
        <div style="display:flex;gap:10px;align-items:center">
          <button class="admin-btn" type="submit">${editing ? 'Save Changes' : 'Add'}</button>
          ${editing ? '<button class="admin-btn secondary" type="button" data-cancel-edit>Cancel</button>' : ''}
          <span class="admin-status" data-form-status></span>
        </div>
      </form>
      <div class="admin-list" data-list></div>
    `;

    const listEl = panel.querySelector('[data-list]');
    if (!s.items.length) {
      listEl.innerHTML = `<p class="hint">Nothing added yet.</p>`;
    } else {
      listEl.innerHTML = s.items.map(item => `
        <div class="admin-item" data-id="${item.id}">
          ${cfg.hasPhoto
            ? (item.photoUrl ? `<img src="${escapeHtml(item.photoUrl)}" alt="">` : `<div class="noimg"></div>`)
            : `<div class="noimg"></div>`}
          <div>
            <h3>${escapeHtml(cfg.title(item))}${cfg.pill ? `<span class="pill ${item.active ? 'on' : 'off'}">${escapeHtml(cfg.pill(item))}</span>` : ''}</h3>
            <p>${escapeHtml(cfg.subtitle(item) || '')}</p>
          </div>
          <div class="actions">
            <button type="button" data-edit>Edit</button>
            <button type="button" data-delete>Delete</button>
          </div>
        </div>
      `).join('');
    }

    const form = panel.querySelector('form');
    form.addEventListener('submit', e => handleSubmit(e, key));
    const cancelBtn = panel.querySelector('[data-cancel-edit]');
    if (cancelBtn) cancelBtn.addEventListener('click', () => { s.editingId = null; renderPanel(key); });

    listEl.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => {
        s.editingId = btn.closest('.admin-item').dataset.id;
        renderPanel(key);
        panel.querySelector('form').scrollIntoView({ behavior: 'smooth' });
      });
    });
    listEl.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', () => deleteItem(key, btn.closest('.admin-item').dataset.id));
    });
  }

  async function handleSubmit(e, key) {
    e.preventDefault();
    const cfg = RESOURCES[key];
    const s = state[key];
    const form = e.target;
    const statusEl = form.querySelector('[data-form-status]');
    const submitBtn = form.querySelector('button[type="submit"]');
    statusEl.textContent = ''; statusEl.className = 'admin-status';
    submitBtn.disabled = true;

    try {
      const payload = {};
      cfg.fields.forEach(f => {
        const el = form.elements[f.key];
        payload[f.key] = f.type === 'checkbox' ? el.checked : el.value.trim();
      });

      if (cfg.hasPhoto) {
        const fileInput = form.elements.photo;
        if (fileInput && fileInput.files && fileInput.files[0]) {
          statusEl.textContent = 'Uploading photo…';
          const dataUrl = await fileToDataUrl(fileInput.files[0]);
          const uploadRes = await api('/api/admin/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: fileInput.files[0].name, dataUrl }),
          });
          payload.photoUrl = uploadRes.url;
        } else if (s.editingId) {
          const existing = s.items.find(i => i.id === s.editingId);
          if (existing) payload.photoUrl = existing.photoUrl;
        }
      }

      statusEl.textContent = 'Saving…';
      if (s.editingId) {
        await api(`/api/content/${key}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.assign({ id: s.editingId }, payload)),
        });
      } else {
        await api(`/api/content/${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      s.editingId = null;
      await loadResource(key);
    } catch (err) {
      statusEl.textContent = err.message;
      statusEl.className = 'admin-status err';
      submitBtn.disabled = false;
    }
  }

  async function deleteItem(key, id) {
    if (!confirm('Delete this entry? This cannot be undone.')) return;
    try {
      await api(`/api/content/${key}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      await loadResource(key);
    } catch (err) {
      alert(err.message);
    }
  }

  async function loadResource(key) {
    const res = await api(`/api/content/${key}`);
    state[key].items = res.items || [];
    renderPanel(key);
  }

  function switchTab(key) {
    Object.keys(RESOURCES).forEach(k => {
      document.getElementById(`panel-${k}`).hidden = k !== key;
    });
    nav.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.tab === key));
    if (!state[key].items.length) loadResource(key);
  }

  nav.addEventListener('click', e => {
    const btn = e.target.closest('button[data-tab]');
    if (btn) switchTab(btn.dataset.tab);
  });

  async function showDashboard() {
    loginScreen.style.display = 'none';
    shell.classList.add('is-active');
    switchTab('gallery');
    await loadResource('gallery');
  }

  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    loginStatus.textContent = '';
    const data = new FormData(loginForm);
    try {
      await api('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: data.get('username'), password: data.get('password') }),
      });
      showDashboard();
    } catch (err) {
      loginStatus.textContent = err.message;
    }
  });

  logoutBtn.addEventListener('click', async () => {
    await api('/api/admin/logout', { method: 'POST' }).catch(() => {});
    shell.classList.remove('is-active');
    loginScreen.style.display = 'flex';
    loginForm.reset();
  });

  (async function init() {
    try {
      const res = await api('/api/admin/session');
      if (res.authenticated) await showDashboard();
    } catch {
      // stay on login screen
    }
  })();
})();
