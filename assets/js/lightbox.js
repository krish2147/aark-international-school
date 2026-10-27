// Photo viewer: tap a gallery photo to see it large. Arrows, swipe or the
// arrow keys move between photos; Esc, the close button or a tap outside the
// photo closes it. Works on the Gallery page grid (including photos added later
// from the admin) and on the homepage's moving Life at AARK rows.
(function(){
  const GROUPS = [
    { root: '.gallery-grid', item: 'figure' },
    { root: '.v2-life-marquee', item: '.lm-item:not([aria-hidden="true"])', copy: '.lm-item[aria-hidden="true"]' }
  ];

  let box, imgEl, capEl, countEl, prevBtn, nextBtn, closeBtn;
  let list = [], index = 0, opener = null;

  function slides(group){
    const root = document.querySelector(group.root);
    if (!root) return [];
    return [...root.querySelectorAll(group.item)].map(fig => {
      const img = fig.querySelector('img');
      const cap = fig.querySelector('figcaption');
      return img && img.getAttribute('src') ? { src: img.src, alt: img.alt || '', cap: cap ? cap.textContent.trim() : '', fig } : null;
    }).filter(Boolean);
  }

  function build(){
    box = document.createElement('div');
    box.className = 'lb';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Photo viewer');
    box.hidden = true;
    box.innerHTML =
      '<button class="lb-btn lb-close" type="button" aria-label="Close photo">&times;</button>' +
      '<button class="lb-btn lb-prev" type="button" aria-label="Previous photo">&#8249;</button>' +
      '<figure class="lb-stage"><img class="lb-img" alt=""><figcaption class="lb-cap"><span class="lb-text"></span><span class="lb-count"></span></figcaption></figure>' +
      '<button class="lb-btn lb-next" type="button" aria-label="Next photo">&#8250;</button>';
    document.body.appendChild(box);
    imgEl = box.querySelector('.lb-img');
    capEl = box.querySelector('.lb-text');
    countEl = box.querySelector('.lb-count');
    prevBtn = box.querySelector('.lb-prev');
    nextBtn = box.querySelector('.lb-next');
    closeBtn = box.querySelector('.lb-close');
    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', () => show(index - 1));
    nextBtn.addEventListener('click', () => show(index + 1));
    box.addEventListener('click', e => {
      if (swiped) { swiped = false; return; }
      if (e.target === box || e.target.classList.contains('lb-stage')) close();
    });
    document.addEventListener('keydown', e => {
      if (box.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
      else if (e.key === 'Tab') {                       // keep focus inside the viewer
        const f = [closeBtn, prevBtn, nextBtn].filter(b => !b.hidden);
        const i = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(i + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus();
      }
    });
    // swipe between photos
    let x0 = null, y0 = 0, swiped = false;
    box.addEventListener('pointerdown', e => { x0 = e.clientX; y0 = e.clientY; });
    box.addEventListener('pointerup', e => {
      if (x0 === null) return;
      const dx = e.clientX - x0, dy = e.clientY - y0;
      x0 = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) { swiped = true; show(index + (dx < 0 ? 1 : -1)); }
    });
  }

  function show(i){
    if (!list.length) return;
    index = (i + list.length) % list.length;
    const s = list[index];
    box.classList.remove('is-in');
    imgEl.src = s.src;
    imgEl.alt = s.alt;
    capEl.textContent = s.cap;
    countEl.textContent = list.length > 1 ? `${index + 1} / ${list.length}` : '';
    prevBtn.hidden = nextBtn.hidden = list.length < 2;
    requestAnimationFrame(() => box.classList.add('is-in'));
    // warm the neighbours so moving on is instant
    [index + 1, index - 1].forEach(n => { const t = list[(n + list.length) % list.length]; if (t) new Image().src = t.src; });
  }

  function open(group, src, from){
    if (!box) build();
    list = slides(group);
    const at = list.findIndex(s => s.src === src || s.fig.querySelector('img').getAttribute('src') === src);
    opener = from;
    box.hidden = false;
    document.documentElement.classList.add('lb-open');
    show(at < 0 ? 0 : at);
    closeBtn.focus();
  }

  function close(){
    if (!box || box.hidden) return;
    box.hidden = true;
    box.classList.remove('is-in');
    document.documentElement.classList.remove('lb-open');
    if (opener && opener.focus) opener.focus();
  }

  // make each photo a button for keyboard and screen-reader users
  function markItems(){
    GROUPS.forEach(g => {
      const root = document.querySelector(g.root);
      if (!root) return;
      root.querySelectorAll(g.item).forEach(fig => {
        if (fig.dataset.lb) return;
        const cap = fig.querySelector('figcaption');
        fig.dataset.lb = '1';
        fig.tabIndex = 0;
        fig.setAttribute('role', 'button');
        fig.setAttribute('aria-label', 'View larger: ' + (cap ? cap.textContent.trim() : (fig.querySelector('img') || {}).alt || 'photo'));
      });
    });
  }

  function targetOf(e){
    for (const g of GROUPS) {
      const root = e.target.closest(g.root);
      if (!root) continue;
      const fig = e.target.closest(g.item) || (g.copy && e.target.closest(g.copy));
      if (fig) return { g, fig };
    }
    return null;
  }
  document.addEventListener('click', e => {
    const t = targetOf(e);
    if (!t) return;
    const img = t.fig.querySelector('img');
    if (img) open(t.g, img.getAttribute('src'), t.fig.getAttribute('aria-hidden') ? null : t.fig);
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const t = targetOf(e);
    if (!t || e.target !== t.fig) return;
    e.preventDefault();
    open(t.g, t.fig.querySelector('img').getAttribute('src'), t.fig);
  });

  markItems();
  // the Gallery page swaps in admin photos after load; mark those too
  const grid = document.querySelector('.gallery-grid');
  if (grid && 'MutationObserver' in window) new MutationObserver(markItems).observe(grid, { childList: true });
})();
