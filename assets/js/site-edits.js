// Click-to-edit: applies the changes published from the admin's edit mode.
//
// The pages stay as static HTML. Each published change names an element by its
// position under <main>, the header or the footer (e.g. "main:3/0/1") plus a
// fingerprint of what it originally said or showed. If the element at that
// position no longer matches (the page was redesigned), the same element is
// looked for elsewhere in that area; if it can't be found the change is simply
// skipped, so an old edit can never land on the wrong thing.
// With ?edit=1 and a signed-in admin, the editor (site-editor.js) loads on top.
(function(){
  const API = '/api/site/edits';
  const CACHE_KEY = 'aark-site-edits';
  const INLINE = ['A', 'B', 'STRONG', 'I', 'EM', 'BR', 'SPAN', 'SMALL', 'SUP', 'SUB', 'U'];
  const params = new URLSearchParams(location.search);
  const editing = params.has('edit');
  const file = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/i, '').toLowerCase() || 'index';
  const area = params.get('area');
  const PAGE = file === 'campus-detail' && /^[a-z]{1,20}$/.test(area || '') ? `campus-detail?area=${area}` : file;

  const roots = () => ({
    main: document.querySelector('main'),
    header: document.querySelector('.site-header'),
    footer: document.querySelector('.site-footer'),
  });

  // Copies made for looping strips (marquee, filmstrip) are never edited directly.
  const isCopy = el => !!el.closest('[aria-hidden="true"]');

  function hash(str){
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return (h >>> 0).toString(36);
  }
  // Photos are fingerprinted by file (ignoring the -640/-960 size copies), text by
  // its words, so a fingerprint survives changes to markup and attributes.
  function fpOf(el){
    if (el.dataset.editFp) return el.dataset.editFp;
    if (el.tagName === 'IMG') {
      const src = (el.getAttribute('src') || '').split('?')[0].replace(/-(?:640|960)(\.\w+)$/, '$1').replace(/^.*\//, '');
      return hash('IMG|' + src);
    }
    return hash(el.tagName + '|' + (el.textContent || '').replace(/\s+/g, ' ').trim());
  }

  function pathOf(el, root){
    const parts = [];
    for (let n = el; n && n !== root; n = n.parentElement) {
      if (!n.parentElement) return null;
      parts.unshift(Array.prototype.indexOf.call(n.parentElement.children, n));
    }
    return parts.join('/');
  }
  function keyOf(el){
    const r = roots();
    for (const name of ['main', 'header', 'footer']) {
      if (r[name] && r[name].contains(el) && el !== r[name]) return `${name}:${pathOf(el, r[name])}`;
    }
    return null;
  }

  function find(key, rec){
    const [name, path] = key.split(':');
    const root = roots()[name];
    if (!root) return null;
    let el = root;
    for (const i of path.split('/')) { el = el && el.children[Number(i)]; }
    const ok = n => n && n.tagName === rec.tag && !isCopy(n) && fpOf(n) === rec.fp;
    if (ok(el)) return el;
    for (const n of root.getElementsByTagName(rec.tag.toLowerCase())) if (ok(n)) return n;
    return null;
  }

  // Second line of defence (the server already cleaned it): simple inline
  // formatting only, and links only to safe places.
  const SAFE_HREF = /^(#[\w-]+|[a-z0-9][a-z0-9\-/]*\.html(\?[\w=&-]+)?(#[\w-]+)?|https:\/\/[^\s"'<>]+|tel:\+?[0-9 ()-]+|mailto:[^\s"'<>]+)$/i;
  // Same rules as the server: a safe href, a class name, aria-hidden, a new-tab target.
  function keepAttr(c, a){
    if (a.name === 'class') return /^[\w -]{1,120}$/.test(a.value);
    if (a.name === 'aria-hidden') return /^(true|false)$/.test(a.value);
    if (c.tagName !== 'A') return false;
    if (a.name === 'href') return SAFE_HREF.test(a.value);
    if (a.name === 'target') return a.value === '_blank';
    return a.name === 'rel';
  }
  function cleanInto(el, html){
    const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
    const walk = node => {
      for (const c of [...node.childNodes]) {
        if (c.nodeType === 3) continue;
        if (c.nodeType !== 1) { c.remove(); continue; }
        walk(c);
        if (!INLINE.includes(c.tagName)) { c.replaceWith(...c.childNodes); continue; }
        [...c.attributes].forEach(a => { if (!keepAttr(c, a)) c.removeAttribute(a.name); });
        if (c.getAttribute('target')) c.setAttribute('rel', 'noopener');
      }
    };
    const box = doc.body.firstChild;
    walk(box);
    el.innerHTML = box.innerHTML;
  }

  // Remember what an element looked like before any edit, to undo or re-apply.
  function snapshot(el){
    if (!el._aarkOrig) {
      el._aarkOrig = { html: el.innerHTML, href: el.getAttribute('href'), src: el.getAttribute('src'), srcset: el.getAttribute('srcset'), sizes: el.getAttribute('sizes'), alt: el.getAttribute('alt'), fp: fpOf(el) };
    }
    return el._aarkOrig;
  }
  function restore(el){
    const o = el._aarkOrig;
    if (!o) return;
    if (el.tagName === 'IMG') {
      for (const a of ['src', 'srcset', 'sizes', 'alt']) { if (o[a] === null) el.removeAttribute(a); else el.setAttribute(a, o[a]); }
      el.closest('picture')?.querySelectorAll('source').forEach(s => { s.disabled = false; if (s.dataset.aarkSrcset) s.setAttribute('srcset', s.dataset.aarkSrcset); });
    } else {
      el.innerHTML = o.html;
      if (o.href === null) el.removeAttribute('href'); else el.setAttribute('href', o.href);
    }
    delete el.dataset.editKey;
    delete el.dataset.editFp;
  }
  function applyRecord(el, key, rec){
    const o = snapshot(el);
    el.dataset.editKey = key;
    el.dataset.editFp = o.fp;
    if (el.tagName === 'IMG') {
      if (rec.src) {
        el.setAttribute('src', rec.src);
        el.removeAttribute('srcset');
        el.removeAttribute('sizes');
        // a <picture> may offer other files for other screens: hide those too
        el.closest('picture')?.querySelectorAll('source').forEach(s => { s.dataset.aarkSrcset = s.getAttribute('srcset') || ''; s.removeAttribute('srcset'); });
      }
      if (rec.alt !== undefined) el.setAttribute('alt', rec.alt);
      return;
    }
    if (rec.html !== undefined) cleanInto(el, rec.html);
    if (rec.href !== undefined && el.tagName === 'A') el.setAttribute('href', rec.href);
  }

  let applied = [];
  function apply(pages){
    applied.forEach(restore);
    applied = [];
    const sets = [pages[PAGE] || {}, pages._global || {}];
    for (const set of sets) {
      for (const [key, rec] of Object.entries(set)) {
        const el = find(key, rec);
        if (!el) continue;
        applyRecord(el, key, rec);
        applied.push(el);
      }
    }
    document.dispatchEvent(new CustomEvent('aark:edits-applied'));
  }

  const state = { PAGE, version: null, pages: {} };
  window.AARKEdits = { state, roots, keyOf, fpOf, find, snapshot, restore, applyRecord, cleanInto, INLINE, isCopy, apply: () => apply(state.pages) };

  function readCache(){ try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch { return null; } }
  function writeCache(d){ try { localStorage.setItem(CACHE_KEY, JSON.stringify(d)); } catch {} }

  const ready = new Promise(r => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', r, { once: true }) : r());
  const fresh = fetch(API + (editing ? '?fresh=1' : ''), { credentials: 'same-origin', cache: editing ? 'no-store' : 'default' })
    .then(r => r.ok ? r.json() : null).catch(() => null);

  ready.then(() => {
    const cached = !editing && readCache();
    if (cached && cached.pages) { state.pages = cached.pages; state.version = cached.version; apply(state.pages); }
    return fresh;
  }).then(data => {
    if (data && data.ok) {
      const changed = data.version !== state.version;
      state.pages = data.pages || {};
      state.version = data.version;
      if (!editing) writeCache({ version: data.version, pages: state.pages });
      if (changed || editing) apply(state.pages);
    }
    if (editing) loadEditor();
  });

  function loadEditor(){
    fetch('/api/admin/session', { credentials: 'same-origin', cache: 'no-store' })
      .then(r => r.json()).catch(() => ({}))
      .then(s => {
        if (!s.authenticated) {
          const bar = document.createElement('div');
          bar.setAttribute('role', 'status');
          bar.style.cssText = 'position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:5000;background:#1d2340;color:#fff;padding:12px 18px;border-radius:12px;font:600 14px/1.4 system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.3)';
          bar.innerHTML = 'Sign in to edit this page. <a href="admin.html" style="color:#fac803">Open the admin</a>';
          document.body.appendChild(bar);
          return;
        }
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'assets/css/site-editor.css';
        document.head.appendChild(css);
        const js = document.createElement('script');
        js.src = 'assets/js/site-editor.js';
        document.body.appendChild(js);
      });
  }
})();
