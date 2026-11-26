// Arrival hero: a looping drone reel of the campus and pool. Phones in portrait
// get a vertical cut; the still poster stays for reduced motion, data saver,
// or if the video can't play.
(function(){
  const hero = document.querySelector('.dh-hero');
  const video = hero && hero.querySelector('.dh-video');
  if (!video) return;
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  if (still.matches || (navigator.connection && navigator.connection.saveData)) return;

  const portrait = innerWidth / innerHeight < 0.8;
  video.src = portrait ? video.dataset.srcPortrait : video.dataset.src;
  video.addEventListener('playing', () => video.classList.add('is-playing'));
  const play = () => video.play().catch(() => {});
  play();

  // pause while scrolled away or the tab is hidden, to save battery
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { if (e.isIntersecting) play(); else video.pause(); }).observe(hero);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); else play(); });
  still.addEventListener?.('change', () => { if (still.matches) video.pause(); });
})();
