// Homepage "Sunrise over AARK" hero. One continuous shot: the camera sinks
// through dawn clouds, the clouds lift into a golden ceiling, then the sun
// rises off the horizon and comes close, ending as a big sun in mid-sky. The
// sun then becomes the AARK sun (rays burst out of it, the AARK centre forms on
// it) and the closing lines arrive underneath.
// - Computers (fine pointer, wide window): scrolling scrubs the shot.
// - Phones and tablets: scroll-linked animation is never reliably smooth on
//   touch screens, so a light clip shaped like the screen plays once on load
//   (hardware video decoding), and the page scrolls natively.
// - Reduced motion (and phones where autoplay is blocked, e.g. iOS Low Power
//   Mode): the finished scene, still. No video for reduced motion.
(function(){
  const hero = document.querySelector('.sr-hero');
  if (!hero) return;
  const stage = hero.querySelector('.sr-stage');
  const video = hero.querySelector('.sr-video');
  const poster = hero.querySelector('.sr-poster');
  const settleBand = hero.querySelector('.sr-band-settle');
  const bands = [...hero.querySelectorAll('.sr-band')].map(el => ({
    el, a: +el.dataset.a, b: +el.dataset.b, ramp: +(el.dataset.ramp || 0), op: -1, k: -1
  }));

  // Each clip, with where the sun sits in its last frame: centre (x, y) and
  // diameter (d), as fractions of the clip's width / height / width.
  const DESKTOP = { url: 'assets/hero/sunrise.mp4', start: 'assets/hero/sunrise-start.jpg', w: 1920, h: 1072, sun: { x: 0.4994, y: 0.5224, d: 0.1151 } };
  const PLAY_CLIPS = {
    portrait: { url: 'assets/hero/sunrise-m.mp4', start: 'assets/hero/sunrise-m-start.jpg', end: 'assets/hero/sunrise-m-end.jpg', w: 720, h: 1020, sun: { x: 0.4984, y: 0.5223, d: 0.2921 } },
    landscape: { url: 'assets/hero/sunrise-l.mp4', start: 'assets/hero/sunrise-l-start.jpg', end: 'assets/hero/sunrise-l-end.jpg', w: 960, h: 536, sun: { x: 0.4994, y: 0.5224, d: 0.1151 } }
  };
  let clip = DESKTOP;

  const VIDEO_END = 0.83;        // scrub progress at which the shot reaches its last frame
  const FORM = [0.83, 0.93];     // ...then the sun becomes the AARK sun
  const PHONE_SETTLE_AT = 3.4;   // clip seconds: the clouds have cleared, the opening line leaves
  const PHONE_RATE = 1.35;       // phones play the shot a little faster
  const MARK_PER_SUN = 1.9;      // logo width (ray tip to ray tip) per sun diameter
  const MARK_PER_SUN_PLAY = 1.6; // a little smaller on phones, to leave room for the text

  // Must match the media queries in sunrise-hero.css exactly.
  const STATIC_QUERY = '(prefers-reduced-motion: reduce)';
  const TOUCH_QUERY = '(pointer: coarse), (max-width: 820px)';

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const smoothstep = (p, e0, e1) => { const t = clamp((p - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };

  // Split headlines into word spans once, for the entrances.
  hero.querySelectorAll('[data-split]').forEach(el => {
    const text = el.textContent.trim();
    const words = text.split(/\s+/);
    el.setAttribute('aria-label', text);
    el.innerHTML = words.map((w, i) =>
      `<span class="w" aria-hidden="true" style="--th:${(i / words.length * 0.5).toFixed(3)};--i:${i}">${w}</span>`
    ).join(' ');
  });

  // ---- the AARK sun sits on the real sun; the closing lines sit under it ----
  // The footage is drawn object-fit:cover, so map the sun through the same crop.
  function placeMark(){
    const vw = video.videoWidth || clip.w, vh = video.videoHeight || clip.h;
    const w = stage.clientWidth, h = stage.clientHeight;
    const s = Math.max(w / vw, h / vh);
    const x = (w - vw * s) / 2 + clip.sun.x * vw * s;
    const y = (h - vh * s) / 2 + clip.sun.y * vh * s;
    const size = clip.sun.d * vw * s * (playStarted ? MARK_PER_SUN_PLAY : MARK_PER_SUN);
    stage.style.setProperty('--sx', x.toFixed(1) + 'px');
    stage.style.setProperty('--sy', y.toFixed(1) + 'px');
    stage.style.setProperty('--mk', size.toFixed(1) + 'px');
    if (settleBand) {
      const below = y + size * 0.5 + 12;
      const room = h - settleBand.offsetHeight - 14;
      stage.style.setProperty('--below', Math.max(0, Math.min(below, room)).toFixed(1) + 'px');
    }
  }
  let lastW = 0;
  addEventListener('resize', () => { if (innerWidth !== lastW || !playStarted) { lastW = innerWidth; placeMark(); } }, { passive: true });
  video.addEventListener('loadedmetadata', placeMark);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeMark);

  // =================== phones and tablets: play once ===================
  let playStarted = false;
  function startPlay(){
    if (playStarted) return;
    playStarted = true;
    hero.classList.add('is-play');
    // the hero fills exactly the screen left under the header and info bar
    stage.style.setProperty('--hdr', Math.round(stage.getBoundingClientRect().top + scrollY) + 'px');
    clip = stage.clientWidth > stage.clientHeight ? PLAY_CLIPS.landscape : PLAY_CLIPS.portrait;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.preload = 'auto';
    video.poster = clip.start;
    poster.style.backgroundImage = `url('${clip.start}')`;
    const settle = () => hero.classList.add('is-settled');
    const markUp = () => { settle(); hero.classList.add('is-marked'); };
    const giveUp = () => {
      stage.classList.add('video-failed');
      poster.style.backgroundImage = `url('${clip.end}')`;
      markUp();
    };
    video.addEventListener('timeupdate', () => {
      if (video.currentTime >= PHONE_SETTLE_AT) settle();
      if (video.duration && video.currentTime >= video.duration - 0.3) markUp();
    });
    video.addEventListener('ended', markUp, { once: true });
    video.addEventListener('error', giveUp, { once: true });
    video.addEventListener('playing', () => stage.classList.add('video-ready'), { once: true });
    video.src = clip.url;
    video.playbackRate = PHONE_RATE;
    video.addEventListener('loadedmetadata', () => { video.playbackRate = PHONE_RATE; }, { once: true });
    lastW = innerWidth;
    placeMark();
    const p = video.play();
    if (p && p.catch) p.catch(giveUp);          // autoplay blocked: show the finished scene
    setTimeout(() => { if (!stage.classList.contains('video-ready')) giveUp(); }, 7000);
  }

  // =================== computers: scroll scrub ===================
  function heroProgress(){
    const r = hero.getBoundingClientRect();
    const range = r.height - innerHeight;
    return range > 0 ? clamp(-r.top / range, 0, 1) : 0;
  }

  // seeks: one in flight at a time, coalesced to the newest target
  let seekBusy = false, pendingTime = null;
  function requestSeek(t){
    if (!video.duration) return;
    t = Math.min(t, video.duration - 0.01);
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

  // captions and the logo: delta-gated writes only
  let loadK = 0, lastF = -1;
  function updateCaptions(p){
    const f = Math.round(clamp((p - FORM[0]) / (FORM[1] - FORM[0]), 0, 1) * 200) / 200;
    if (f !== lastF) { lastF = f; stage.style.setProperty('--f', f); }
    bands.forEach((band, i) => {
      const { a, b } = band;
      const fr = Math.min(0.02, (b - a) / 3);
      const fadeIn = i === 0 ? 1 : smoothstep(p, a, a + fr);
      const fadeOut = i === bands.length - 1 ? 1 : 1 - smoothstep(p, b - fr, b);
      const op = Math.round(fadeIn * fadeOut * 1000) / 1000;
      let k = clamp((p - a) / (band.ramp || Math.min(0.06, (b - a) * 0.35)), 0, 1);
      if (i === 0) k = Math.max(k, loadK);
      if (op !== band.op) { band.op = op; band.el.style.opacity = op; band.el.style.visibility = op > 0 ? 'visible' : 'hidden'; }
      if (Math.abs(k - band.k) > 0.008 || (k !== band.k && (k === 0 || k === 1))) { band.k = k; band.el.style.setProperty('--k', k.toFixed(3)); }
    });
  }

  // eased drive loop that rests when converged or off-screen
  let target = 0, shown = 0, rafId = null, lastTick = 0, heroOnScreen = true;
  function tick(now){
    if (!scrubOn) { rafId = null; return; }
    const dt = Math.min(100, now - (lastTick || now));
    lastTick = now;
    shown += (target - shown) * (1 - Math.pow(1 - 0.14, dt / 16.667));
    if (Math.abs(target - shown) < 0.0005) { shown = target; rafId = null; lastTick = 0; }
    else rafId = requestAnimationFrame(tick);
    requestSeek(Math.min(1, shown / VIDEO_END) * (video.duration || 0));
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

  // loading: poster first, then the whole video as a Blob
  let initDone = false;
  function initScrubOnce(){
    if (initDone) return;
    initDone = true;
    let started = false;
    const start = () => { if (started) return; started = true; loadVideo().catch(() => stage.classList.add('video-failed')); };
    const img = new Image();
    img.onload = img.onerror = start;
    img.src = DESKTOP.start;
    poster.style.backgroundImage = `url('${DESKTOP.start}')`;
    setTimeout(start, 4000);
  }
  async function loadVideo(){
    const res = await fetch(DESKTOP.url, { priority: 'low' });
    if (!res.ok) throw new Error('video ' + res.status);
    video.muted = true;
    video.src = URL.createObjectURL(await res.blob());
    video.load();
    video.addEventListener('canplay', () => {
      requestSeek(Math.min(1, heroProgress() / VIDEO_END) * video.duration);
      stage.classList.add('video-ready');
    }, { once: true });
  }

  // arm / disarm live as the motion setting changes
  let scrubOn = false;
  function enableScrub(){
    if (scrubOn) return;
    scrubOn = true;
    hero.classList.add('is-scrub');
    initScrubOnce();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll, { passive: true });
    bands.forEach(b => { b.op = -1; b.k = -1; });
    lastF = -1;
    placeMark();
    shown = target = heroProgress();
    updateCaptions(shown);
    onScroll();
  }
  function disableScrub(){
    if (!scrubOn && !hero.classList.contains('is-scrub')) return;
    scrubOn = false;
    hero.classList.remove('is-scrub');
    removeEventListener('scroll', onScroll);
    removeEventListener('resize', onScroll);
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
    bands.forEach(b => { b.el.style.opacity = ''; b.el.style.visibility = ''; b.el.style.removeProperty('--k'); b.op = -1; b.k = -1; });
    stage.style.removeProperty('--f');
  }

  // Phone or computer is decided once per page view; only the motion setting is live.
  const isTouch = matchMedia(TOUCH_QUERY).matches;
  const staticMQ = matchMedia(STATIC_QUERY);
  function applyHeroMode(){
    if (staticMQ.matches) {
      disableScrub();
      if (playStarted) { video.pause(); hero.classList.add('is-settled', 'is-marked'); }
      return;
    }
    if (isTouch) startPlay(); else enableScrub();
  }
  staticMQ.addEventListener ? staticMQ.addEventListener('change', applyHeroMode) : staticMQ.addListener(applyHeroMode);

  // On computers the first line assembles on its own once, then scroll takes over.
  const t0 = performance.now();
  (function loadRamp(now){
    loadK = clamp((now - t0) / 1100, 0, 1);
    loadK = 1 - Math.pow(1 - loadK, 3);
    if (scrubOn) updateCaptions(shown);
    if (loadK < 1) requestAnimationFrame(loadRamp);
  })(t0);

  applyHeroMode();
})();
