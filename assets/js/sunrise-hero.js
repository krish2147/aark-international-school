// Homepage "Sunrise over AARK" hero: scrolling down scrubs a short video in
// which the camera sinks through dawn clouds to the sun beneath them.
// Desktop scrubs the video itself. Phones and portrait tablets decode video
// seeks too slowly to keep up with a finger, so they get the same shot as a
// sequence of portrait frames (12 per second of footage, faded into each
// other) drawn to a canvas instead.
// Reduced-motion visitors and landscape phones (no room) get the static hero
// (same text over the final frame) and never download the video.
(function(){
  const hero = document.querySelector('.sr-hero');
  if (!hero) return;
  const stage = hero.querySelector('.sr-stage');
  const video = hero.querySelector('.sr-video');
  const poster = hero.querySelector('.sr-poster');
  const bands = [...hero.querySelectorAll('.sr-band')].map(el => ({
    el, a: +el.dataset.a, b: +el.dataset.b, ramp: +(el.dataset.ramp || 0), op: -1, k: -1
  }));

  const VIDEO_URL = 'assets/hero/sunrise.mp4';
  const POSTER_URL = 'assets/hero/sunrise-start.jpg';
  const FRAME_COUNT = 73;
  const frameUrl = i => `assets/hero/m/f${String(i + 1).padStart(3, '0')}.webp`;
  // Decided once: portrait touch screens and narrow windows use the frames.
  const useFrames = innerHeight > innerWidth && matchMedia('(pointer: coarse), (max-width: 820px)').matches;

  // Must match the static-hero media queries in homepage.css character for character.
  const GATES = [
    '(orientation: landscape) and (pointer: coarse) and (max-height: 560px)',
    '(prefers-reduced-motion: reduce)'
  ];

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const smoothstep = (p, e0, e1) => { const t = clamp((p - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };

  // Split headlines into word spans once, for the scroll-driven entrances.
  hero.querySelectorAll('[data-split]').forEach(el => {
    const text = el.textContent.trim();
    const words = text.split(/\s+/);
    el.setAttribute('aria-label', text);
    el.innerHTML = words.map((w, i) =>
      `<span class="w" aria-hidden="true" style="--th:${(i / words.length * 0.5).toFixed(3)}">${w}</span>`
    ).join(' ');
  });

  function heroProgress(){
    const r = hero.getBoundingClientRect();
    const range = r.height - innerHeight;
    return range > 0 ? clamp(-r.top / range, 0, 1) : 0;
  }

  // ---- seeks: one in flight at a time, coalesced to the newest target ----
  let seekBusy = false, pendingTime = null;
  function requestSeek(t){
    if (!video.duration) return;
    if (seekBusy) { pendingTime = t; return; }
    seekBusy = true;
    video.currentTime = t;
  }
  video.addEventListener('seeked', () => {
    seekBusy = false;
    if (pendingTime !== null) { const t = pendingTime; pendingTime = null; requestSeek(t); }
  });
  video.addEventListener('error', () => {
    seekBusy = false; pendingTime = null;
    stage.classList.add('video-failed');
  });

  // ---- frames: canvas drawing for phones ----
  const frames = new Array(FRAME_COUNT);
  let canvas = null, ctx = null, lastDrawn = -1;
  function sizeCanvas(){
    if (!canvas) return;
    // No sharper than the frames themselves (850px tall): extra canvas pixels add cost, not detail.
    const dpr = Math.max(1, Math.min(devicePixelRatio || 1, 850 / Math.max(1, stage.clientHeight)));
    const w = Math.round(stage.clientWidth * dpr), h = Math.round(stage.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; lastDrawn = -1; }
  }
  function nearestFrame(want){
    for (let d = 0; d < FRAME_COUNT; d++) {             // nearest frame that has arrived
      if (frames[want - d]) return want - d;
      if (frames[want + d]) return want + d;
    }
    return -1;
  }
  function paint(img, alpha){
    const cw = canvas.width, ch = canvas.height;
    const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);   // cover
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }
  // Between two stored frames, the next one is faded over the previous, so the
  // motion stays continuous with only 12 frames per second of footage.
  function drawFrame(p){
    if (!ctx) return;
    const pos = clamp(p, 0, 1) * (FRAME_COUNT - 1);
    const lo = Math.floor(pos), mix = Math.round((pos - lo) * 8) / 8;   // 8 blend steps
    const key = lo * 8 + mix * 8;
    if (key === lastDrawn) return;
    const a = nearestFrame(lo);
    if (a < 0) return;
    lastDrawn = key;
    paint(frames[a], 1);
    const b = lo + 1;
    if (mix > 0 && b < FRAME_COUNT && frames[b] && a === lo) paint(frames[b], mix);
    ctx.globalAlpha = 1;
  }
  function loadFrames(){
    canvas = document.createElement('canvas');
    canvas.className = 'sr-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    video.replaceWith(canvas);
    ctx = canvas.getContext('2d', { alpha: false });
    sizeCanvas();
    // Coarse to fine (every 16th frame, then every 8th, ...) so scrubbing works
    // roughly right away and sharpens as the rest arrive.
    const order = [], seen = new Set();
    for (let step = 8; step >= 1; step = step >> 1)
      for (let i = 0; i < FRAME_COUNT; i += step) if (!seen.has(i)) { seen.add(i); order.push(i); }
    if (!seen.has(FRAME_COUNT - 1)) order.splice(1, 0, FRAME_COUNT - 1);
    let next = 0, failed = 0;
    const pump = () => {
      if (next >= order.length) return;
      const i = order[next++];
      const img = new Image();
      img.decoding = 'async';
      img.src = frameUrl(i);
      (img.decode ? img.decode() : new Promise((ok, bad) => { img.onload = ok; img.onerror = bad; }))
        .then(() => {
          frames[i] = img;
          if (!stage.classList.contains('video-ready')) { drawFrame(heroProgress()); stage.classList.add('video-ready'); }
          else if (Math.abs(i - Math.round(shown * (FRAME_COUNT - 1))) < 8) { lastDrawn = -1; drawFrame(shown); }
        })
        .catch(() => { if (++failed > 8 && !frames.some(Boolean)) stage.classList.add('video-failed'); })
        .then(pump);
    };
    for (let k = 0; k < 6; k++) pump();
  }

  // ---- captions: delta-gated writes only ----
  let loadK = 0;
  function updateCaptions(p){
    bands.forEach((band, i) => {
      const { a, b } = band;
      const f = Math.min(0.02, (b - a) / 3);
      const fadeIn = i === 0 ? 1 : smoothstep(p, a, a + f);
      const fadeOut = i === bands.length - 1 ? 1 : 1 - smoothstep(p, b - f, b);
      const op = Math.round(fadeIn * fadeOut * 1000) / 1000;
      let k = clamp((p - a) / (band.ramp || Math.min(0.06, (b - a) * 0.35)), 0, 1);
      if (i === 0) k = Math.max(k, loadK);
      if (op !== band.op) { band.op = op; band.el.style.opacity = op; band.el.style.visibility = op > 0 ? 'visible' : 'hidden'; }
      if (Math.abs(k - band.k) > 0.008 || (k !== band.k && (k === 0 || k === 1))) { band.k = k; band.el.style.setProperty('--k', k.toFixed(3)); }
    });
  }

  // ---- eased drive loop that rests when converged or off-screen ----
  let target = 0, shown = 0, rafId = null, lastTick = 0, heroOnScreen = true;
  function tick(now){
    if (!scrubOn) { rafId = null; return; }
    const dt = Math.min(100, now - (lastTick || now));
    lastTick = now;
    shown += (target - shown) * (1 - Math.pow(1 - (useFrames ? 0.24 : 0.14), dt / 16.667));
    if (Math.abs(target - shown) < 0.0005) { shown = target; rafId = null; lastTick = 0; }
    else rafId = requestAnimationFrame(tick);
    if (useFrames) drawFrame(shown); else requestSeek(shown * (video.duration || 0));
    updateCaptions(shown);
  }
  function onScroll(){
    if (!scrubOn) return;
    target = heroProgress();
    if (rafId === null && heroOnScreen) rafId = requestAnimationFrame(tick);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { heroOnScreen = e.isIntersecting; if (heroOnScreen) onScroll(); }).observe(hero);
  }

  // ---- loading: poster first, then the whole video as a Blob ----
  let initDone = false;
  function initHeroOnce(){
    if (initDone) return;
    initDone = true;
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      if (useFrames) loadFrames();
      else loadVideo().catch(() => stage.classList.add('video-failed'));
    };
    const img = new Image();
    img.onload = img.onerror = start;
    img.src = POSTER_URL;
    poster.style.backgroundImage = `url('${POSTER_URL}')`;
    setTimeout(start, 4000);
  }
  async function loadVideo(){
    const res = await fetch(VIDEO_URL, { priority: 'low' });
    if (!res.ok) throw new Error('video ' + res.status);
    video.muted = true;
    video.src = URL.createObjectURL(await res.blob());
    video.load();
    let ready = false;
    const onReady = () => {
      if (ready) return;
      ready = true;
      requestSeek(heroProgress() * video.duration);
      stage.classList.add('video-ready');
    };
    video.addEventListener('loadeddata', onReady, { once: true });
    video.addEventListener('canplay', onReady, { once: true });
    // iOS Safari only paints seeked frames once the video has played: a muted
    // inline play-then-pause unlocks it (allowed without a tap).
    const played = video.play();
    if (played && played.then) played.then(() => { video.pause(); onReady(); requestSeek(heroProgress() * video.duration); }).catch(() => {});
  }

  // ---- arm / disarm live as gates change (rotation, resize, motion setting) ----
  let scrubOn = false;
  function enableScrub(){
    if (scrubOn) return;
    scrubOn = true;
    hero.classList.add('is-scrub');
    initHeroOnce();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onResize, { passive: true });
    bands.forEach(b => { b.op = -1; b.k = -1; });
    shown = target = heroProgress();
    updateCaptions(shown);
    onScroll();
  }
  function disableScrub(){
    if (!scrubOn && !hero.classList.contains('is-scrub')) return;
    scrubOn = false;
    hero.classList.remove('is-scrub');
    removeEventListener('scroll', onScroll);
    removeEventListener('resize', onResize);
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
    bands.forEach(b => { b.el.style.opacity = ''; b.el.style.visibility = ''; b.el.style.removeProperty('--k'); b.op = -1; b.k = -1; });
  }
  function onResize(){ sizeCanvas(); drawFrame(shown); onScroll(); }
  function applyHeroMode(){
    if (MQLS.some(m => m.matches)) disableScrub(); else enableScrub();
  }
  const MQLS = GATES.map(q => matchMedia(q));
  MQLS.forEach(m => m.addEventListener ? m.addEventListener('change', applyHeroMode) : m.addListener(applyHeroMode));

  // The first line assembles on its own once, then scroll takes over.
  const t0 = performance.now();
  (function loadRamp(now){
    loadK = clamp((now - t0) / 1100, 0, 1);
    loadK = 1 - Math.pow(1 - loadK, 3);
    if (scrubOn) updateCaptions(shown);
    if (loadK < 1) requestAnimationFrame(loadRamp);
  })(t0);

  applyHeroMode();
})();
