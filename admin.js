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
      multiPhoto: true,
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
      label: 'Popups',
      singular: 'popup',
      intro: 'A popup shows once per visit on every page of the website, a moment after it opens. Only the newest popup marked "Show" appears. Use it for admissions, schemes, events or notices.',
      hasPhoto: true,
      photoLabel: 'Photo (optional, shown at the top of the popup)',
      fields: [
        { key: 'kind', label: 'Type', type: 'select', options: [['admission', 'Admissions'], ['scheme', 'Scheme / offer'], ['event', 'Event'], ['notice', 'Notice']] },
        { key: 'title', label: 'Popup title', type: 'text', required: true, placeholder: 'e.g. Admissions Open for 2026–27' },
        { key: 'message', label: 'Message', type: 'textarea', required: true },
        { key: 'buttonText', label: 'Button text (optional)', type: 'text', placeholder: 'e.g. Apply now' },
        { key: 'link', label: 'Button link (optional)', type: 'text', placeholder: 'e.g. admissions.html or https://…' },
        { key: 'signup', label: 'Include the "Get updates" sign-up form in the popup', type: 'checkbox' },
        { key: 'active', label: 'Show this popup on the site now', type: 'checkbox' },
      ],
      title: i => i.title,
      subtitle: i => [({ admission: 'Admissions', scheme: 'Scheme', event: 'Event', notice: 'Notice' })[i.kind] || 'Notice', i.message].join(' · '),
      pill: i => (i.active ? 'Live on site' : 'Hidden'),
      preview: true,
    },
    schemes: {
      label: 'Schemes',
      singular: 'scheme',
      intro: 'Live schemes are listed on the Admissions page. To announce one in a popup as well, add it under Popups with the type "Scheme / offer".',
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

  // Phone photos are often 5–10 MB: shrink to at most 1920px and re-encode
  // (WebP where the browser can) so every upload fits the 3 MB limit.
  async function fileToDataUrl(file) {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1920 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * scale);
    c.height = Math.round(bmp.height * scale);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    let q = 0.86;
    let url = c.toDataURL('image/webp', q);
    const type = url.startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg';
    if (type === 'image/jpeg') url = c.toDataURL(type, q);
    while (url.length > 3.8e6 && q > 0.45) { q -= 0.1; url = c.toDataURL(type, q); }
    return url;
  }

  async function uploadPhoto(file) {
    const dataUrl = await fileToDataUrl(file);
    const res = await api('/api/admin/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, dataUrl }),
    });
    return res.url;
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
      if (f.type === 'select') {
        return `<label>${escapeHtml(f.label)}<select name="${f.key}">${f.options.map(([v, l]) => `<option value="${v}" ${val === v ? 'selected' : ''}>${escapeHtml(l)}</option>`).join('')}</select></label>`;
      }
      if (f.type === 'checkbox') {
        return `<label class="checkline"><input type="checkbox" name="${f.key}" ${val ? 'checked' : ''}> ${escapeHtml(f.label)}</label>`;
      }
      return `<label>${escapeHtml(f.label)}<input name="${f.key}" type="text" placeholder="${escapeHtml(f.placeholder || '')}" ${f.required ? 'required' : ''} value="${escapeHtml(val || '')}"></label>`;
    }).join('');

    const photoHtml = cfg.hasPhoto
      ? (cfg.multiPhoto && !editing
        ? `<label>Photos (choose one or several; each becomes its own gallery photo)<input type="file" name="photo" multiple accept="image/jpeg,image/png,image/webp,image/avif"></label>`
        : `<label>${escapeHtml(cfg.photoLabel || 'Photo')} ${editing && editing.photoUrl ? '(leave empty to keep current photo)' : ''}<input type="file" name="photo" accept="image/jpeg,image/png,image/webp,image/avif"></label>${editing && editing.photoUrl && cfg.photoLabel ? '<label class="checkline"><input type="checkbox" name="removePhoto"> Remove the current photo</label>' : ''}`)
      : '';

    panel.innerHTML = `
      <h2>${escapeHtml(cfg.label)}</h2>
      ${cfg.intro ? `<p class="hint">${escapeHtml(cfg.intro)}</p>` : ''}
      <p class="hint">${editing ? 'Editing an existing entry.' : `Add a new ${cfg.singular || cfg.label.toLowerCase() + ' entry'}.`}</p>
      <form class="admin-form" data-resource="${key}">
        ${fieldsHtml}
        ${photoHtml}
        <div class="admin-form-actions">
          <button class="admin-btn" type="submit">${editing ? 'Save changes' : 'Add entry'}</button>
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
            ${cfg.preview ? `<a class="small-btn" style="text-decoration:none;display:inline-flex;align-items:center" href="index.html?popup=${encodeURIComponent(item.id)}" target="_blank" rel="noopener">Preview</a>` : ''}
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

      const files = cfg.hasPhoto && form.elements.photo ? [...(form.elements.photo.files || [])] : [];
      if (cfg.multiPhoto && !s.editingId && files.length > 1) {
        for (let i = 0; i < files.length; i++) {
          statusEl.textContent = `Adding photo ${i + 1} of ${files.length}…`;
          const photoUrl = await uploadPhoto(files[i]);
          await api(`/api/content/${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Object.assign({}, payload, { photoUrl })),
          });
        }
        await loadResource(key);
        return;
      }

      if (cfg.hasPhoto) {
        if (files[0]) {
          statusEl.textContent = 'Uploading photo…';
          payload.photoUrl = await uploadPhoto(files[0]);
        } else if (s.editingId && form.elements.removePhoto && form.elements.removePhoto.checked) {
          payload.photoUrl = '';
        } else if (s.editingId) {
          const existing = s.items.find(i => i.id === s.editingId);
          if (existing && existing.photoUrl) payload.photoUrl = existing.photoUrl;
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
    if (!confirm('Delete this entry? You can bring it back later from Content History.')) return;
    try {
      await api(`/api/content/${key}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      await loadResource(key);
    } catch (err) {
      alert(err.message);
    }
  }

  async function loadResource(key) {
    const res = await api(`/api/content/${key}?fresh=1`);
    state[key].items = res.items || [];
    renderPanel(key);
  }

  function switchTab(key) {
    document.querySelectorAll('.panel').forEach(p => { p.hidden = p.id !== `panel-${key}`; });
    nav.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.tab === key));
    if (key === 'enquiries') return loadEnquiries();
    if (key === 'history') return loadHistory();
    if (key === 'website') return loadWebsite();
    if (!state[key].items.length) loadResource(key);
  }

  // ---- Enquiries (stored by /api/enquiry; read-only except status + email retry) ----
  const enquiryState = { month: new Date().toISOString().slice(0, 7), items: [], type: '' };
  const ENQ_TYPES = { admission: 'Admission', visit: 'Campus visit', career: 'Job application', updates: 'Update sign-up' };
  const NOTIFY_LABEL = { sent: 'Emailed', failed: 'Email failed', pending: 'Email pending', not_configured: 'Email not set up', skipped_duplicate: 'Duplicate' };

  async function loadEnquiries() {
    const panel = document.getElementById('panel-enquiries');
    panel.innerHTML = '<h2>Enquiries</h2><p class="hint">Loading…</p>';
    try {
      const res = await api(`/api/admin/enquiries?month=${encodeURIComponent(enquiryState.month)}`);
      enquiryState.items = res.items || [];
      renderEnquiries();
    } catch (err) {
      panel.innerHTML = `<h2>Enquiries</h2><p class="admin-status err">${escapeHtml(err.message)}</p>`;
    }
  }

  function renderEnquiries() {
    const panel = document.getElementById('panel-enquiries');
    const m = enquiryState.month;
    const t = enquiryState.type;
    const shown = enquiryState.items.filter(i => !t || i.type === t);
    const rows = shown.map(i => {
      const n = (i.notification && i.notification.status) || 'pending';
      const when = new Date(i.receivedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
      return `<tr data-id="${escapeHtml(i.id)}">
        <td>${escapeHtml(when)}<br><span class="hint">${escapeHtml(ENQ_TYPES[i.type] || 'Admission')}</span></td>
        <td><strong>${escapeHtml(i.name)}</strong>${i.child ? `<br>Child: ${escapeHtml(i.child)}` : ''}<br>${i.type === 'career' ? 'Role: ' : i.type === 'updates' ? 'Wants: ' : ''}${escapeHtml(i.grade)}${i.message ? `<details class="enq-msg"><summary>Experience</summary><p>${escapeHtml(i.message)}</p></details>` : ''}</td>
        <td><a href="tel:${escapeHtml(i.phone)}">${escapeHtml(i.phone)}</a>${i.email ? `<br><a href="mailto:${escapeHtml(i.email)}">${escapeHtml(i.email)}</a>` : ''}</td>
        <td><span class="pill ${n === 'sent' ? 'on' : n === 'failed' ? 'warn' : 'off'}">${escapeHtml(NOTIFY_LABEL[n] || n)}</span>${n === 'failed' || n === 'not_configured' ? '<br><button type="button" class="small-btn" data-retry>Retry email</button>' : ''}</td>
        <td><select data-status aria-label="Follow-up status">${['new', 'contacted', 'closed'].map(st => `<option value="${st}" ${i.status === st ? 'selected' : ''}>${st[0].toUpperCase() + st.slice(1)}</option>`).join('')}</select></td>
      </tr>`;
    }).join('');
    panel.innerHTML = `
      <h2>Enquiries</h2>
      <p class="hint">Every campus-visit request, admission enquiry, job application and update sign-up from the website is saved here first, even if the notification email fails. To message parents who asked for updates, choose "Update sign-ups" and download the CSV.</p>
      <div class="enq-toolbar">
        <label>Month <input type="month" value="${escapeHtml(m)}" data-month></label>
        <label>Show <select data-type><option value="">All</option>${Object.entries(ENQ_TYPES).map(([v, l]) => `<option value="${v}" ${t === v ? 'selected' : ''}>${escapeHtml(l === 'Update sign-up' ? 'Update sign-ups' : l + 's')}</option>`).join('')}</select></label>
        <a class="admin-btn secondary" href="/api/admin/enquiries?month=${encodeURIComponent(m)}&format=csv${t ? `&type=${t}` : ''}">Download CSV</a>
        <span class="admin-status" data-enq-status></span>
      </div>
      ${shown.length ? `<div class="table-wrap"><table class="enq-table"><thead><tr><th>Received</th><th>Name</th><th>Contact</th><th>Notification</th><th>Follow-up</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<p class="hint">${t ? 'Nothing of this kind' : 'No enquiries'} in this month.</p>`}`;

    const statusEl = panel.querySelector('[data-enq-status]');
    panel.querySelector('[data-type]').addEventListener('change', e => { enquiryState.type = e.target.value; renderEnquiries(); });
    panel.querySelector('[data-month]').addEventListener('change', e => { if (e.target.value) { enquiryState.month = e.target.value; loadEnquiries(); } });
    panel.querySelectorAll('[data-retry]').forEach(btn => btn.addEventListener('click', async () => {
      btn.disabled = true; statusEl.textContent = 'Sending…'; statusEl.className = 'admin-status';
      try {
        await api('/api/admin/enquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'retry', id: btn.closest('tr').dataset.id, month: m }) });
        await loadEnquiries();
      } catch (err) { statusEl.textContent = err.message; statusEl.className = 'admin-status err'; btn.disabled = false; }
    }));
    panel.querySelectorAll('[data-status]').forEach(sel => sel.addEventListener('change', async () => {
      statusEl.textContent = 'Saving…'; statusEl.className = 'admin-status';
      try {
        await api('/api/admin/enquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'status', id: sel.closest('tr').dataset.id, month: m, status: sel.value }) });
        statusEl.textContent = 'Saved'; statusEl.className = 'admin-status ok';
      } catch (err) { statusEl.textContent = err.message; statusEl.className = 'admin-status err'; }
    }));
  }

  // ---- Content history (every save is kept; restoring adds a new save) ----
  async function loadHistory() {
    const panel = document.getElementById('panel-history');
    panel.innerHTML = '<h2>Content History</h2><p class="hint">Loading…</p>';
    try {
      const res = await api('/api/admin/content-history');
      const items = res.versions.map((v, idx) => `<div class="admin-item" data-version="${v.version}"><div class="noimg"></div><div><h3>Version ${v.version}${idx === 0 ? '<span class="pill on">Live</span>' : ''}</h3><p>Saved ${escapeHtml(new Date(v.savedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }))}</p></div><div class="actions">${idx === 0 ? '' : '<button type="button" data-restore>Restore</button>'}</div></div>`).join('');
      panel.innerHTML = `<h2>Content History</h2><p class="hint">Every save to Gallery, Staff, Popups, Schemes and Fees is kept. Restoring an older version makes a new save; nothing is deleted.</p><p class="admin-status" data-hist-status></p><div class="admin-list">${items || '<p class="hint">No saves yet. The original content from before versioning is kept as version 0.</p>'}</div>`;
      panel.querySelectorAll('[data-restore]').forEach(btn => btn.addEventListener('click', async () => {
        const version = Number(btn.closest('[data-version]').dataset.version);
        if (!confirm(`Restore version ${version}? The current content stays in the history.`)) return;
        const st = panel.querySelector('[data-hist-status]');
        try {
          await api('/api/admin/content-history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ version }) });
          Object.keys(state).forEach(k => { state[k].items = []; });
          await loadHistory();
        } catch (err) { st.textContent = err.message; st.className = 'admin-status err'; }
      }));
    } catch (err) {
      panel.innerHTML = `<h2>Content History</h2><p class="admin-status err">${escapeHtml(err.message)}</p>`;
    }
  }

  // ---- Edit Website: click-to-edit any page (assets/js/site-editor.js) ----
  const SITE_PAGES = [
    ['index', 'Home'], ['about', 'About'], ['curriculum', 'Curriculum'], ['admissions', 'Admissions'],
    ['student-life', 'Student Life'], ['campus-detail', 'Campus'],
    ['campus-detail?area=classrooms', 'Campus · Classrooms'], ['campus-detail?area=robotics', 'Campus · AI & Robotics'],
    ['campus-detail?area=swimming', 'Campus · Swimming & Sports'], ['campus-detail?area=arts', 'Campus · Arts & Culture'],
    ['gallery', 'Gallery'], ['staff', 'Our Staff'], ['careers', 'Careers'], ['circulars', 'Calendar & Circulars'],
    ['disclosures', 'Public Disclosure'], ['policies', 'Policies'], ['transport', 'Transport'], ['privacy', 'Privacy Notice'],
    ['_global', 'Header & footer (every page)'],
  ];
  const pageUrl = (page, edit) => {
    const [file, query] = (page === '_global' ? 'index' : page).split('?');
    const q = [query, edit ? 'edit=1' : ''].filter(Boolean).join('&');
    return `${file}.html${q ? `?${q}` : ''}`;
  };

  async function loadWebsite() {
    const panel = document.getElementById('panel-website');
    panel.innerHTML = '<h2>Edit Website</h2><p class="hint">Loading…</p>';
    try {
      const [edits, hist] = await Promise.all([api('/api/site/edits?fresh=1'), api('/api/site/edits?history=1')]);
      const pages = edits.pages || {};
      const rows = SITE_PAGES.map(([key, label]) => {
        const n = Object.keys(pages[key] || {}).length;
        return `<div class="admin-item"><div class="noimg"></div><div><h3>${escapeHtml(label)}${n ? `<span class="pill on">${n} change${n > 1 ? 's' : ''}</span>` : ''}</h3><p>${key === '_global' ? 'Menu, contact details and footer. Edit them from any page.' : escapeHtml(pageUrl(key))}</p></div><div class="actions"><a class="admin-btn" href="${escapeHtml(pageUrl(key, true))}" target="_blank" rel="noopener">Edit page</a><a class="admin-btn secondary" href="${escapeHtml(pageUrl(key))}" target="_blank" rel="noopener">View</a></div></div>`;
      }).join('');
      const versions = (hist.versions || []).slice(0, 30).map((v, idx) => `<div class="admin-item" data-version="${v.version}"><div class="noimg"></div><div><h3>Version ${v.version}${idx === 0 ? '<span class="pill on">Live</span>' : ''}</h3><p>Published ${escapeHtml(new Date(v.savedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }))}</p></div><div class="actions">${idx === 0 ? '' : '<button type="button" data-site-restore>Restore</button>'}</div></div>`).join('');
      panel.innerHTML = `
        <h2>Edit Website</h2>
        <p class="hint">Open any page in edit mode, click a heading, paragraph, button or photo to change it, then press <strong>Publish</strong>. Changes go live within a minute. The layout and design are protected, so nothing can be broken by accident.</p>
        <div class="admin-list">${rows}</div>
        <h2 style="margin-top:36px">Website history</h2>
        <p class="hint">Every publish is kept. Restoring an older version publishes it again; nothing is deleted.</p>
        <p class="admin-status" data-site-status></p>
        <div class="admin-list">${versions || '<p class="hint">Nothing has been published from edit mode yet.</p>'}</div>`;
      panel.querySelectorAll('[data-site-restore]').forEach(btn => btn.addEventListener('click', async () => {
        const version = Number(btn.closest('[data-version]').dataset.version);
        if (!confirm(`Restore the website to version ${version}? The current version stays in the history.`)) return;
        const st = panel.querySelector('[data-site-status]');
        try {
          await api('/api/site/edits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ restore: version }) });
          await loadWebsite();
        } catch (err) { st.textContent = err.message; st.className = 'admin-status err'; }
      }));
    } catch (err) {
      panel.innerHTML = `<h2>Edit Website</h2><p class="admin-status err">${escapeHtml(err.message)}</p>`;
    }
  }

  nav.addEventListener('click', e => {
    const btn = e.target.closest('button[data-tab]');
    if (btn) switchTab(btn.dataset.tab);
  });

  async function showDashboard() {
    loginScreen.style.display = 'none';
    shell.classList.add('is-active');
    switchTab('enquiries');
  }

  const passwordInput = loginForm.elements.password;
  const eyeBtn = loginForm.querySelector('[data-toggle-password]');
  eyeBtn.addEventListener('click', () => {
    const show = passwordInput.type === 'password';
    passwordInput.type = show ? 'text' : 'password';
    eyeBtn.setAttribute('aria-pressed', String(show));
    eyeBtn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    passwordInput.focus();
  });

  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    loginStatus.textContent = '';
    const data = new FormData(loginForm);
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in…';
    try {
      await api('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: data.get('username'), password: data.get('password') }),
      });
      passwordInput.type = 'password';
      showDashboard();
    } catch (err) {
      loginStatus.textContent = err.message;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign in';
    }
  });

  logoutBtn.addEventListener('click', async () => {
    await api('/api/admin/logout', { method: 'POST' }).catch(() => {});
    shell.classList.remove('is-active');
    loginScreen.style.display = '';
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
