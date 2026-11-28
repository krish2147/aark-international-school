// Click-to-edit mode for signed-in admins (loaded by site-edits.js on ?edit=1).
// Click any text to rewrite it in place, any photo to replace it; nothing goes
// live until Publish. Layout, styles and code are never editable here.
(function(){
  const E = window.AARKEdits;
  if (!E || document.querySelector('.aark-ed-bar')) return;
  const { state } = E;
  const PAGE = state.PAGE;

  const PAGES = [
    ['index', 'Home'], ['about', 'About'], ['curriculum', 'Curriculum'], ['admissions', 'Admissions'],
    ['student-life', 'Student Life'], ['campus-detail', 'Campus'],
    ['campus-detail?area=classrooms', 'Campus · Classrooms'], ['campus-detail?area=robotics', 'Campus · AI & Robotics'],
    ['campus-detail?area=swimming', 'Campus · Swimming & Sports'], ['campus-detail?area=arts', 'Campus · Arts & Culture'],
    ['gallery', 'Gallery'], ['staff', 'Our Staff'], ['careers', 'Careers'], ['circulars', 'Calendar & Circulars'],
    ['disclosures', 'Public Disclosure'], ['policies', 'Policies'], ['transport', 'Transport'], ['privacy', 'Privacy Notice'],
  ];
  const urlFor = page => {
    const [file, query] = page.split('?');
    return `${file}.html?${query ? query + '&' : ''}edit=1`;
  };

  const TEXT_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'LI', 'FIGCAPTION', 'DT', 'DD', 'TD', 'TH', 'A', 'SPAN', 'STRONG', 'SMALL', 'LABEL', 'SUMMARY', 'B', 'EM', 'BLOCKQUOTE', 'CAPTION', 'LEGEND']);
  const BREAK_TAGS = new Set(['P', 'LI', 'DD', 'TD', 'BLOCKQUOTE', 'FIGCAPTION']);
  const SAFE_HREF = /^(#[\w-]+|[a-z0-9][a-z0-9\-/]*\.html(\?[\w=&-]+)?(#[\w-]+)?|https:\/\/[^\s"'<>]+|tel:\+?[0-9 ()-]+|mailto:[^\s"'<>]+)$/i;

  const root = document.documentElement;
  root.classList.add('aark-editing');

  // Working copies: this page's edits, and the site-wide header/footer edits.
  const work = { page: { ...(state.pages[PAGE] || {}) }, global: { ...(state.pages._global || {}) } };
  const setFor = key => key.startsWith('main:') ? work.page : work.global;
  const undo = [];
  let changes = 0;

  // ---------- which elements can be edited ----------
  const skip = el => E.isCopy(el) || !!el.closest('.aark-ed-ui,[class^="ac-"],[class*=" ac-"],.lb,.to-top,[data-admin-photo],button,select,textarea,option,script,style,noscript,svg,video');
  const isLeafText = el => (el.textContent || '').trim() && [...el.querySelectorAll('*')].every(d => E.INLINE.includes(d.tagName));
  function mark(){
    for (const r of Object.values(E.roots())) {
      if (!r) continue;
      for (const el of r.querySelectorAll('*')) {
        if (el.dataset.ed || skip(el)) continue;
        if (el.tagName === 'IMG') { el.dataset.ed = 'img'; continue; }
        if (TEXT_TAGS.has(el.tagName) && isLeafText(el) && !el.parentElement.closest('[data-ed="text"]')) el.dataset.ed = 'text';
      }
    }
  }
  mark();

  // ---------- UI ----------
  const el = (tag, attrs = {}, text) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    if (text !== undefined) n.textContent = text;
    return n;
  };
  const bar = el('div', { class: 'aark-ed-ui aark-ed-bar', role: 'toolbar', 'aria-label': 'Website editor' });
  const title = el('strong', { class: 'aark-ed-title' }, 'Edit mode');
  const pick = el('select', { 'aria-label': 'Page to edit' });
  PAGES.forEach(([key, label]) => { const o = el('option', { value: key }, label); if (key === PAGE) o.selected = true; pick.appendChild(o); });
  if (!PAGES.some(p => p[0] === PAGE)) pick.prepend(el('option', { value: PAGE, selected: '' }, PAGE));
  const count = el('span', { class: 'aark-ed-count', 'aria-live': 'polite' });
  const bUndo = el('button', { type: 'button' }, 'Undo');
  const bDiscard = el('button', { type: 'button' }, 'Discard');
  const bPublish = el('button', { type: 'button', class: 'is-primary' }, 'Publish');
  const bExit = el('button', { type: 'button' }, 'Exit');
  const bAdd = el('button', { type: 'button' }, 'Add photos');
  bar.append(title, pick, count, bUndo, bDiscard, bPublish, bExit);
  if (PAGE === 'gallery') bar.insertBefore(bAdd, bUndo);
  document.body.appendChild(bar);

  const toast = el('div', { class: 'aark-ed-ui aark-ed-toast', role: 'status', 'aria-live': 'polite' });
  document.body.appendChild(toast);
  let toastTimer;
  function say(msg, kind = ''){
    toast.textContent = msg;
    toast.className = `aark-ed-ui aark-ed-toast is-shown ${kind}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.className = 'aark-ed-ui aark-ed-toast'; }, kind === 'is-error' ? 7000 : 4000);
  }

  function refresh(){
    count.textContent = changes ? `${changes} unpublished change${changes > 1 ? 's' : ''}` : 'No unpublished changes';
    bUndo.disabled = !undo.length;
    bDiscard.disabled = bPublish.disabled = !changes;
  }
  refresh();
  say('Click any text or photo to change it. Nothing goes live until you press Publish.');

  // ---------- recording changes ----------
  const textOf = n => (n.textContent || n.getAttribute('alt') || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  function stateOf(n){
    return n.tagName === 'IMG'
      ? { src: n.getAttribute('src'), srcset: n.getAttribute('srcset'), sizes: n.getAttribute('sizes'), alt: n.getAttribute('alt') }
      : { html: n.innerHTML, href: n.getAttribute('href') };
  }
  function setState(n, s){
    for (const [k, v] of Object.entries(s)) {
      if (k === 'html') n.innerHTML = v;
      else if (v === null) n.removeAttribute(k);
      else n.setAttribute(k, v);
    }
  }
  const scratch = document.createElement('div');
  const cleaned = html => { E.cleanInto(scratch, html.replace(/&nbsp;/g, ' ')); return scratch.innerHTML; };
  function record(n, before){
    const key = n.dataset.editKey || E.keyOf(n);
    if (!key) return;
    const o = E.snapshot(n);
    const set = setFor(key);
    const prev = set[key];
    const rec = { tag: n.tagName, fp: o.fp, label: textOf(n) || o.alt || 'photo' };
    if (n.tagName === 'IMG') {
      if (n.getAttribute('src') !== o.src) rec.src = n.getAttribute('src');
      if (n.getAttribute('alt') !== o.alt) rec.alt = n.getAttribute('alt') || '';
    } else {
      if (n.innerHTML.trim() !== cleaned(o.html).trim()) rec.html = n.innerHTML;
      if (n.tagName === 'A' && n.getAttribute('href') !== o.href) rec.href = n.getAttribute('href') || '';
    }
    const changed = 'src' in rec || 'alt' in rec || 'html' in rec || 'href' in rec;
    if (changed) { set[key] = rec; n.dataset.editKey = key; n.dataset.editFp = o.fp; n.dataset.edDirty = '1'; }
    else { delete set[key]; delete n.dataset.editKey; delete n.dataset.editFp; n.dataset.edDirty = '1'; }
    undo.push({ n, key, prev, before });
    changes++;
    refresh();
  }

  bUndo.addEventListener('click', () => {
    const u = undo.pop();
    if (!u) return;
    finishText();
    setState(u.n, u.before);
    const set = setFor(u.key);
    if (u.prev) { set[u.key] = u.prev; u.n.dataset.editKey = u.key; } else delete set[u.key];
    changes = Math.max(0, changes - 1);
    refresh();
  });
  bDiscard.addEventListener('click', () => {
    if (confirm('Discard all unpublished changes on this page?')) { changes = 0; location.reload(); }
  });
  bExit.addEventListener('click', () => {
    if (changes && !confirm('You have unpublished changes. Leave without publishing them?')) return;
    changes = 0;
    const p = new URLSearchParams(location.search); p.delete('edit');
    location.href = location.pathname + (p.toString() ? `?${p}` : '');
  });
  pick.addEventListener('change', () => {
    if (changes && !confirm('You have unpublished changes. Leave this page without publishing them?')) { pick.value = PAGE; return; }
    changes = 0;
    location.href = urlFor(pick.value);
  });
  addEventListener('beforeunload', e => { if (changes) { e.preventDefault(); e.returnValue = ''; } });

  bPublish.addEventListener('click', async () => {
    finishText();
    bPublish.disabled = true;
    bPublish.textContent = 'Publishing…';
    try {
      const res = await fetch('/api/site/edits', {
        method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseVersion: state.version, pages: { [PAGE]: work.page, _global: work.global } }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Publishing failed. Please try again.');
      state.version = data.version;
      state.pages = data.pages;
      undo.length = 0;
      changes = 0;
      document.querySelectorAll('[data-ed-dirty]').forEach(n => delete n.dataset.edDirty);
      try { localStorage.removeItem('aark-site-edits'); } catch {}
      say('Published. Visitors will see the changes within a minute.', 'is-ok');
    } catch (err) {
      say(err.message, 'is-error');
    } finally {
      bPublish.textContent = 'Publish';
      refresh();
    }
  });

  // ---------- text editing ----------
  const tools = el('div', { class: 'aark-ed-ui aark-ed-tools', role: 'toolbar', 'aria-label': 'Text tools' });
  const tB = el('button', { type: 'button', title: 'Bold' }, 'B');
  const tI = el('button', { type: 'button', title: 'Italic' }, 'I');
  const tL = el('button', { type: 'button', title: 'Link' }, 'Link');
  const tO = el('button', { type: 'button', title: 'Go back to the original text' }, 'Original');
  const tD = el('button', { type: 'button', class: 'is-primary' }, 'Done');
  tools.append(tB, tI, tL, tO, tD);
  document.body.appendChild(tools);
  tools.addEventListener('mousedown', e => e.preventDefault()); // keep the text selection

  let active = null;
  let activeBefore = null;
  function placeTools(){
    if (!active) return;
    const r = active.getBoundingClientRect();
    const top = Math.max(8, r.top + scrollY - tools.offsetHeight - 8);
    tools.style.top = `${top}px`;
    tools.style.left = `${Math.max(8, Math.min(r.left + scrollX, scrollX + innerWidth - tools.offsetWidth - 8))}px`;
  }
  function startText(n){
    if (active === n) return;
    finishText();
    active = n;
    activeBefore = stateOf(n);
    E.snapshot(n);
    n.contentEditable = 'true';
    n.spellcheck = true;
    n.focus();
    tools.classList.add('is-shown');
    tL.textContent = n.tagName === 'A' ? 'Link address' : 'Link';
    placeTools();
  }
  function finishText(cancel){
    if (!active) return;
    const n = active;
    active = null;
    n.removeAttribute('contenteditable');
    tools.classList.remove('is-shown');
    if (cancel) { setState(n, activeBefore); return; }
    // keep only allowed formatting, exactly as the server and visitors will see it
    E.cleanInto(n, n.innerHTML.replace(/&nbsp;/g, ' '));
    const now = stateOf(n);
    if (now.html !== cleaned(activeBefore.html) || now.href !== activeBefore.href) record(n, activeBefore);
    else setState(n, activeBefore); // nothing really changed: put back the exact original markup
  }
  tB.addEventListener('click', () => document.execCommand('bold'));
  tI.addEventListener('click', () => document.execCommand('italic'));
  tD.addEventListener('click', () => finishText());
  tO.addEventListener('click', () => {
    if (!active) return;
    const o = E.snapshot(active);
    setState(active, { html: o.html, href: o.href });
    finishText();
  });
  tL.addEventListener('click', () => {
    if (!active) return;
    const sel = getSelection();
    const inner = sel.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement).closest('a');
    const target = active.tagName === 'A' ? active : (inner && active.contains(inner) ? inner : null);
    const current = target ? target.getAttribute('href') || '' : '';
    const value = prompt('Link to (a page like admissions.html, a full https:// address, tel:… or mailto:…). Leave empty to remove the link.', current);
    if (value === null) return;
    const href = value.trim();
    if (!href) {
      if (target && target !== active) target.replaceWith(...target.childNodes);
      else if (target === active) say('A button always needs a link. Type the page it should open.', 'is-error');
      return;
    }
    if (!SAFE_HREF.test(href)) { say('That link is not allowed. Use a page on this site (like admissions.html), https://…, tel: or mailto:.', 'is-error'); return; }
    if (target) target.setAttribute('href', href);
    else if (!sel.isCollapsed) document.execCommand('createLink', false, href);
    else say('Select the words to turn into a link first.', 'is-error');
  });
  addEventListener('scroll', placeTools, { passive: true });
  addEventListener('resize', placeTools);

  document.addEventListener('keydown', e => {
    if (!active || !active.contains(e.target)) return;
    if (e.key === 'Escape') { e.preventDefault(); finishText(true); return; }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey || BREAK_TAGS.has(active.tagName)) document.execCommand('insertLineBreak');
      else finishText();
    }
  }, true);
  document.addEventListener('paste', e => {
    if (!active || !active.contains(e.target)) return;
    e.preventDefault();
    document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text/plain'));
  }, true);

  // ---------- photos ----------
  const panel = el('div', { class: 'aark-ed-ui aark-ed-panel', role: 'dialog', 'aria-modal': 'false', 'aria-label': 'Change photo', hidden: '' });
  panel.innerHTML = '<h3>Change photo</h3><img class="aark-ed-preview" alt=""><label class="aark-ed-file">Replace photo<input type="file" accept="image/jpeg,image/png,image/webp,image/avif"></label><p class="aark-ed-hint">JPG, PNG or WebP. Large photos are resized for the web automatically.</p><label class="aark-ed-alt">Description for screen readers and Google<textarea rows="2" maxlength="300"></textarea></label><div class="aark-ed-row"><button type="button" data-act="original">Use original photo</button><button type="button" class="is-primary" data-act="done">Done</button></div>';
  document.body.appendChild(panel);
  const pPreview = panel.querySelector('.aark-ed-preview');
  const pFile = panel.querySelector('input[type=file]');
  const pAlt = panel.querySelector('textarea');
  let photo = null;
  let photoBefore = null;
  function openPhoto(img){
    finishText();
    closePhoto();
    photo = img;
    photoBefore = stateOf(img);
    E.snapshot(img);
    pPreview.src = img.currentSrc || img.src;
    pAlt.value = img.getAttribute('alt') || '';
    panel.hidden = false;
    img.dataset.edActive = '1';
  }
  function closePhoto(){
    if (!photo) return;
    const img = photo;
    photo = null;
    panel.hidden = true;
    delete img.dataset.edActive;
    if (pAlt.value.trim() !== (img.getAttribute('alt') || '')) img.setAttribute('alt', pAlt.value.trim());
    const now = stateOf(img);
    if (now.src !== photoBefore.src || now.alt !== photoBefore.alt) record(img, photoBefore);
  }
  panel.querySelector('[data-act=done]').addEventListener('click', closePhoto);
  panel.querySelector('[data-act=original]').addEventListener('click', () => {
    if (!photo) return;
    const o = E.snapshot(photo);
    setState(photo, { src: o.src, srcset: o.srcset, sizes: o.sizes, alt: o.alt });
    photo.closest('picture')?.querySelectorAll('source').forEach(s => { if (s.dataset.aarkSrcset) s.setAttribute('srcset', s.dataset.aarkSrcset); });
    pPreview.src = photo.currentSrc || photo.src;
    pAlt.value = o.alt || '';
  });

  async function shrink(file){
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
  pFile.addEventListener('change', async () => {
    const file = pFile.files && pFile.files[0];
    pFile.value = '';
    if (!file || !photo) return;
    const img = photo;
    say('Uploading photo…');
    try {
      const dataUrl = await shrink(file);
      const res = await fetch('/api/admin/upload', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl, filename: file.name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Upload failed.');
      img.setAttribute('src', data.url);
      img.removeAttribute('srcset');
      img.removeAttribute('sizes');
      img.closest('picture')?.querySelectorAll('source').forEach(s => { s.dataset.aarkSrcset = s.getAttribute('srcset') || ''; s.removeAttribute('srcset'); });
      pPreview.src = data.url;
      say('Photo uploaded. Press Done, then Publish.', 'is-ok');
    } catch (err) {
      say(err.message, 'is-error');
    }
  });

  // ---------- gallery: add or remove photos (live straight away) ----------
  const gPanel = el('div', { class: 'aark-ed-ui aark-ed-panel', role: 'dialog', 'aria-modal': 'false', 'aria-label': 'Add photos to the gallery', hidden: '' });
  gPanel.innerHTML = '<h3>Add photos to the gallery</h3><label class="aark-ed-file">Choose photos<input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif"></label><p class="aark-ed-hint" data-g-files>You can pick several photos at once. They are resized for the web automatically.</p><label class="aark-ed-alt">Event name (required)<input type="text" maxlength="120" data-g="event" placeholder="e.g. Annual Sports Day"></label><label class="aark-ed-alt">Date<input type="text" maxlength="60" data-g="date" placeholder="e.g. 30 Jan 2027"></label><label class="aark-ed-alt">Caption<input type="text" maxlength="240" data-g="caption" placeholder="Optional"></label><p class="aark-ed-hint">Photos go live as soon as they are added: no need to press Publish. To remove one later, click it here in edit mode.</p><div class="aark-ed-row"><button type="button" data-act="cancel">Cancel</button><button type="button" class="is-primary" data-act="add">Add to gallery</button></div>';
  document.body.appendChild(gPanel);
  const gFile = gPanel.querySelector('input[type=file]');
  const gFiles = gPanel.querySelector('[data-g-files]');
  const gField = k => gPanel.querySelector(`[data-g="${k}"]`);
  const gAdd = gPanel.querySelector('[data-act=add]');
  let gBusy = false;
  const reloadGallery = () => window.AARKGallery && window.AARKGallery.reload();
  bAdd.addEventListener('click', () => { finishText(); closePhoto(); gPanel.hidden = false; gField('event').focus(); });
  gPanel.querySelector('[data-act=cancel]').addEventListener('click', () => { if (!gBusy) gPanel.hidden = true; });
  gFile.addEventListener('change', () => {
    const n = gFile.files ? gFile.files.length : 0;
    gFiles.textContent = n ? `${n} photo${n > 1 ? 's' : ''} chosen.` : 'You can pick several photos at once.';
  });
  async function postJson(url, method, body){
    const res = await fetch(url, { method, credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  }
  gAdd.addEventListener('click', async () => {
    if (gBusy) return;
    const files = [...(gFile.files || [])];
    const info = { event: gField('event').value.trim(), date: gField('date').value.trim(), caption: gField('caption').value.trim() };
    if (!files.length) { say('Choose at least one photo first.', 'is-error'); return; }
    if (!info.event) { say('Please give the event a name.', 'is-error'); gField('event').focus(); return; }
    gBusy = true; gAdd.disabled = true;
    let done = 0;
    try {
      for (const file of files) {
        say(`Adding photo ${done + 1} of ${files.length}…`);
        const up = await postJson('/api/admin/upload', 'POST', { dataUrl: await shrink(file), filename: file.name });
        await postJson('/api/content/gallery', 'POST', { ...info, photoUrl: up.url });
        done++;
      }
      say(`${done} photo${done > 1 ? 's' : ''} added to the gallery.`, 'is-ok');
      gFile.value = ''; gFiles.textContent = 'You can pick several photos at once.';
      gPanel.hidden = true;
    } catch (err) {
      say(`${done ? `${done} added, then: ` : ''}${err.message}`, 'is-error');
    } finally {
      gBusy = false; gAdd.disabled = false;
      reloadGallery();
    }
  });
  async function removeGalleryPhoto(fig){
    if (!confirm('Remove this photo from the gallery? It can be brought back from Content History in the admin.')) return;
    try {
      await postJson(`/api/content/gallery?id=${encodeURIComponent(fig.dataset.adminPhoto)}`, 'DELETE');
      fig.remove();
      say('Photo removed from the gallery.', 'is-ok');
    } catch (err) { say(err.message, 'is-error'); }
  }

  // ---------- clicks: edit, never navigate ----------
  addEventListener('click', e => {
    const t = e.target;
    if (!(t instanceof Element) || t.closest('.aark-ed-ui')) return;
    const added = t.closest('[data-admin-photo]');
    if (added) { e.preventDefault(); e.stopImmediatePropagation(); finishText(); removeGalleryPhoto(added); return; }
    const ed = t.closest('[data-ed]');
    const inActive = active && active.contains(t);
    if (t.closest('a,summary,label,button') || ed) e.preventDefault();
    if (inActive) return;
    e.stopImmediatePropagation();
    if (photo && !panel.contains(t)) closePhoto();
    if (!ed) { finishText(); return; }
    if (ed.dataset.ed === 'img') openPhoto(ed);
    else startText(ed);
  }, true);
  addEventListener('submit', e => e.preventDefault(), true);
  document.addEventListener('aark:edits-applied', mark);
})();
