// "Come see it for yourself": a slow drone glide over the campus plays behind
// the band while it is on screen. The still photo underneath stays as the
// fallback for reduced motion, data-saver connections, or if the video fails.
(function(){
  const video = document.querySelector('.v2-visit-video');
  if (!video || !('IntersectionObserver' in window)) return;
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = navigator.connection && navigator.connection.saveData;
  if (saveData) return;

  let loaded = false;
  function load(){
    if (loaded) return;
    loaded = true;
    video.src = innerWidth < 760 ? video.dataset.srcSmall : video.dataset.src;
    video.addEventListener('playing', () => video.classList.add('is-playing'), { once: true });
  }
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !still.matches) { load(); video.play().catch(() => {}); }
    else if (loaded) video.pause();
  }, { rootMargin: '200px 0px' }).observe(video);
  still.addEventListener?.('change', () => { if (still.matches) video.pause(); });
})();
