// Campus filmstrip: drifts sideways in an endless loop. A swipe (or drag,
// or trackpad scroll) sets the direction it keeps drifting in; while the
// strip is touched, hovered or focused it holds still, and it carries on as
// soon as the visitor lets go. The cards are copied (hidden
// from screen readers and keyboard) so the loop never runs out, and the
// strip stays still with reduced motion.
(function(){
  const strip = document.querySelector('.v2-filmstrip');
  if (!strip) return;
  const SPEED = 52;          // pixels per second
  const GLIDE_GAP = 120;     // ms between a swipe's scroll steps that still counts as the same swipe
  const RESUME_AFTER = 200;  // ms after a swipe's glide ends before drifting again (must exceed GLIDE_GAP)
  const still = matchMedia('(prefers-reduced-motion: reduce)');

  const originals = [...strip.children];
  if (originals.length < 2) return;

  // The strip sits one full loop in, so there is room to scroll either way;
  // copy the set until a loop plus the visible width always fits after that.
  let copies = 0;
  function addCopies(){
    const period = loopPeriod() || strip.scrollWidth;
    const need = 1 + Math.max(1, Math.ceil(strip.clientWidth / Math.max(period, 1)));
    while (copies < need) {
      originals.forEach(item => strip.appendChild(copyOf(item)));
      copies++;
    }
  }
  function copyOf(item){
    const copy = item.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    copy.tabIndex = -1;
    copy.querySelectorAll('img').forEach(img => { img.alt = ''; });
    return copy;
  }
  // website edits (assets/js/site-edits.js) change the originals: refresh the copies
  document.addEventListener('aark:edits-applied', () => {
    [...strip.children].slice(originals.length).forEach((copy, i) => copy.replaceWith(copyOf(originals[i % originals.length])));
  });
  // distance from a card to its first copy: one full turn of the loop
  function loopPeriod(){
    const copy = strip.children[originals.length];
    return copy ? copy.offsetLeft - originals[0].offsetLeft : 0;
  }
  addCopies();
  strip.classList.add('is-looping');

  let period = loopPeriod();
  let pos = period, dir = 1, last = 0, running = false, onScreen = false;
  let held = false, hovered = false, focused = false, dragging = null, lastTouch = -Infinity;
  let inputAt = -Infinity, prevLeft = strip.scrollLeft;
  setLeft(pos);

  // keep the position within the second turn of the loop: [period, 2 × period)
  function wrap(x){
    if (period <= 0) return x;
    while (x >= 2 * period) x -= period;
    while (x < period) x += period;
    return x;
  }
  function setLeft(x){
    pos = wrap(x);
    strip.scrollLeft = pos;
    prevLeft = strip.scrollLeft;
  }

  const paused = () => held || hovered || focused || dragging || document.documentElement.classList.contains('aark-editing') || performance.now() - lastTouch < RESUME_AFTER;

  function frame(now){
    if (!running) return;
    const dt = Math.min(now - (last || now), 50) / 1000;
    last = now;
    if (!paused()) setLeft(pos + dir * SPEED * dt);
    requestAnimationFrame(frame);
  }
  function start(){
    if (running || still.matches || !onScreen || document.hidden) return;
    running = true; last = 0;
    requestAnimationFrame(frame);
  }
  function stop(){ running = false; }

  // A scroll counts as the visitor's only while a finger, mouse drag or
  // trackpad is actually involved (including the glide after a swipe); the
  // rest are the drift's own steps, which can be fractions of a pixel.
  const byVisitor = () => held || dragging || performance.now() - inputAt < GLIDE_GAP;
  strip.addEventListener('scroll', () => {
    if (!byVisitor()) { prevLeft = strip.scrollLeft; return; }
    inputAt = performance.now();
    const left = strip.scrollLeft;
    const moved = left - prevLeft;
    if (Math.abs(moved) > 0.5 && Math.abs(moved) < period / 2) dir = moved > 0 ? 1 : -1;
    lastTouch = performance.now();
    pos = left;
    prevLeft = left;
    if (left >= 2 * period || left < period) setLeft(left);
  }, { passive: true });

  // touch: hold still while a finger is down
  strip.addEventListener('touchstart', () => { held = true; lastTouch = inputAt = performance.now(); }, { passive: true });
  strip.addEventListener('touchmove', () => { lastTouch = inputAt = performance.now(); }, { passive: true });
  const release = () => { held = false; lastTouch = inputAt = performance.now(); };
  strip.addEventListener('touchend', release, { passive: true });
  strip.addEventListener('touchcancel', release, { passive: true });
  strip.addEventListener('wheel', () => { lastTouch = inputAt = performance.now(); }, { passive: true });

  // mouse: hover holds it, and click-and-drag scrolls it
  // (only a real mouse: phones fire hover events on tap and never clear them)
  strip.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') hovered = true; });
  strip.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { hovered = false; lastTouch = performance.now(); } });
  // keyboard focus holds it too (a mouse click also focuses the card, so skip that)
  strip.addEventListener('focusin', e => { focused = e.target.matches(':focus-visible'); });
  strip.addEventListener('focusout', () => { if (focused) lastTouch = performance.now(); focused = false; });
  strip.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    dragging = { x: e.clientX, left: strip.scrollLeft, moved: 0 };
    strip.classList.add('is-dragging');
  });
  addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - dragging.x;
    dragging.moved = Math.max(dragging.moved, Math.abs(dx));
    if (dragging.moved <= 3) return;
    e.preventDefault();
    let to = dragging.left - dx;
    if (to >= 2 * period) { dragging.left -= period; to -= period; }
    if (to < period) { dragging.left += period; to += period; }
    strip.scrollLeft = to;
  });
  addEventListener('pointerup', () => {
    if (!dragging) return;
    const wasDrag = dragging.moved > 3;
    dragging = null;
    strip.classList.remove('is-dragging');
    lastTouch = performance.now();
    // a drag shouldn't also open the card under the pointer
    if (wasDrag) strip.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); }, { capture: true, once: true });
  });
  strip.addEventListener('dragstart', e => e.preventDefault());

  addEventListener('resize', () => { addCopies(); period = loopPeriod(); setLeft(pos); }, { passive: true });
  strip.querySelectorAll('img').forEach(img => img.addEventListener('load', () => { period = loopPeriod(); setLeft(pos); }, { once: true }));
  document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });
  still.addEventListener?.('change', () => { still.matches ? stop() : start(); });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      if (onScreen) { strip.querySelectorAll('img').forEach(img => { img.loading = 'eager'; }); start(); } else stop();
    }, { rootMargin: '200px 0px' }).observe(strip);
  } else { onScreen = true; start(); }
})();
