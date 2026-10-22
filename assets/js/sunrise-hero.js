// Homepage "Sunrise over AARK" hero: the camera sinks through dawn clouds to
// the sun beneath them.
// - Computers (fine pointer, wide window): scrolling scrubs the video.
// - Phones and tablets: scroll-linked animation is never reliably smooth on
//   touch screens, so a small portrait cut of the shot simply plays once on
//   load (hardware video decoding, smooth everywhere), the closing lines fade
//   in as the sun appears, and the page scrolls natively.
// Either way the scene ends with the AARK sun logo forming on the real sun.
// - Reduced motion (and phones where autoplay is blocked, e.g. iOS Low Power
//   Mode): the static hero over the final frame. No video is downloaded for
//   reduced motion.
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
  // Touch screens get a light clip shaped like the screen: portrait or landscape.
  const PLAY_CLIPS = {
    portrait: { url: 'assets/hero/sunrise-m.mp4', start: 'assets/hero/sunrise-m-start.jpg', end: 'assets/hero/sunrise-m-end.jpg', w: 720, h: 1020 },
    landscape: { url: 'assets/hero/sunrise-l.mp4', start: 'assets/hero/sunrise-l-start.jpg', end: 'assets/hero/sunrise-l-end.jpg', w: 960, h: 536 }
  };
  let clip = null;
  const PHONE_SETTLE_AT = 3.4;   // seconds into the clip when the clouds have cleared
  const PHONE_MARK_AT = 4.3;     // ...and when the AARK sun starts forming on the real sun
  // Where the sun sits in both clips' final frame, as a fraction of the frame.
  const SUN_X = 0.501, SUN_Y = 0.861;
  const mark = hero.querySelector('.sr-mark');

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

  // ---- the AARK sun forms on the real sun: keep it pinned to the sun's spot ----
  // The footage is drawn object-fit:cover, so map the sun through the same crop.
  function placeMark(){
    if (!mark) return;
    const vw = video.videoWidth || (clip ? clip.w : 1920);
    const vh = video.videoHeight || (clip ? clip.h : 1072);
    const w = stage.clientWidth, h = stage.clientHeight;
    const s = Math.max(w / vw, h / vh);
    // honour the video's object-position (short landscape screens anchor it to the bottom)
    const pos = getComputedStyle(video).objectPosition.split(' ');
    const pct = v => (v && v.endsWith('%')) ? parseFloat(v) / 100 : 0.5;
    const x = (w - vw * s) * pct(pos[0]) + SUN_X * vw * s;
    const y = (h - vh * s) * pct(pos[1]) + SUN_Y * vh * s;
    mark.style.setProperty('--sx', x.toFixed(1) + 'px');
    mark.style.setProperty('--sy', y.toFixed(1) + 'px');
  }
  let lastW = 0;
  addEventListener('resize', () => { if (innerWidth !== lastW || !playStarted) { lastW = innerWidth; placeMark(); } }, { passive: true });
  video.addEventListener('loadedmetadata', placeMark);

  // =================== phones and tablets: play once ===================
  let playStarted = false;
  function startPlay(){
    if (playStarted) return;
    playStarted = true;
    hero.classList.add('is-play');
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
      if (video.currentTime >= PHONE_MARK_AT) markUp();
    });
    video.addEventListener('ended', markUp, { once: true });
    video.addEventListener('error', giveUp, { once: true });
    video.addEventListener('playing', () => stage.classList.add('video-ready'), { once: true });
    video.src = clip.url;
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

  // captions: delta-gated writes only
  let loadK = 0, lastM = -1;
  const markA = mark ? +mark.dataset.a : 0, markB = mark ? +mark.dataset.b : 1;
  function updateCaptions(p){
    if (mark) {
      const m = Math.round(clamp((p - markA) / (markB - markA), 0, 1) * 200) / 200;
      if (m !== lastM) { lastM = m; mark.style.setProperty('--m', m); }
    }
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

  // eased drive loop that rests when converged or off-screen
  let target = 0, shown = 0, rafId = null, lastTick = 0, heroOnScreen = true;
  function tick(now){
    if (!scrubOn) { rafId = null; return; }
    const dt = Math.min(100, now - (lastTick || now));
    lastTick = now;
    shown += (target - shown) * (1 - Math.pow(1 - 0.14, dt / 16.667));
    if (Math.abs(target - shown) < 0.0005) { shown = target; rafId = null; lastTick = 0; }
    else rafId = requestAnimationFrame(tick);
    requestSeek(shown * (video.duration || 0));
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
    video.addEventListener('canplay', () => {
      requestSeek(heroProgress() * video.duration);
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
    lastM = -1;
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
    if (mark) mark.style.removeProperty('--m');
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
