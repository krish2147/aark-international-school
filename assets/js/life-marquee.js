// Life at AARK: each row of photos drifts sideways in a seamless loop.
// The row's photos are duplicated once (hidden from screen readers), and the
// CSS animation slides the track by half its width, so the copy picks up
// exactly where the original ends. Rows run only while on screen, pause on
// hover or while touched, and stay still with reduced motion.
(function(){
  const box = document.querySelector('.v2-life-marquee');
  if (!box) return;
  const SPEED = 38;   // pixels per second
  const rows = [...box.querySelectorAll('.lm-row')];

  rows.forEach(row => {
    const track = row.querySelector('.lm-track');
    [...track.children].forEach(item => {
      const copy = item.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      copy.querySelectorAll('img').forEach(img => { img.alt = ''; });
      track.appendChild(copy);
    });
    // touch: hold to pause, let go to carry on
    let release = null;
    row.addEventListener('pointerdown', () => { clearTimeout(release); row.classList.add('is-held'); }, { passive: true });
    const let_go = () => { clearTimeout(release); release = setTimeout(() => row.classList.remove('is-held'), 900); };
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => row.addEventListener(t, let_go, { passive: true }));
  });

  // the loop's length depends on the photos' widths, which follow the row height
  function setSpeed(){
    rows.forEach(row => {
      const track = row.querySelector('.lm-track');
      const half = track.scrollWidth / 2;
      if (half > 0) track.style.setProperty('--lm-dur', (half / SPEED).toFixed(1) + 's');
    });
  }
  setSpeed();
  addEventListener('resize', setSpeed, { passive: true });
  box.querySelectorAll('img').forEach(img => img.addEventListener('load', setSpeed, { once: true }));

  if ('IntersectionObserver' in window) {
    // photos further along a row start off-screen, where lazy loading would
    // leave them blank until they slide in: load the lot once the section is near
    let loaded = false;
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !loaded) { loaded = true; box.querySelectorAll('img').forEach(img => { img.loading = 'eager'; }); }
      box.classList.toggle('is-running', e.isIntersecting);
    }, { rootMargin: '400px 0px' }).observe(box);
  } else {
    box.classList.add('is-running');
  }
})();
