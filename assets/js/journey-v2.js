/*
  AARK V2 — Learning Journey scroll progress.
  Two independent compositions (desktop horizontal path / mobile vertical
  rail) share the same progress math: how far the viewport's reading line
  has moved between the first and last stage dot. Reduced-motion users get
  the same end-state instantly, without a smooth scroll-driven transition.
*/
(function(){
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Static per-stage gold→terracotta gradient, matching the approved Figma
  // Learning Journey palette (color/gold/500 → color/terracotta/500).
  var GOLD = [250, 200, 3], TERRACOTTA = [217, 101, 58];
  function lerpColor(a, b, t){
    return 'rgb(' + Math.round(a[0] + (b[0]-a[0])*t) + ',' + Math.round(a[1] + (b[1]-a[1])*t) + ',' + Math.round(a[2] + (b[2]-a[2])*t) + ')';
  }
  function colorStages(selector){
    var stops = [].slice.call(document.querySelectorAll(selector));
    stops.forEach(function(s, i){
      var t = stops.length > 1 ? i / (stops.length - 1) : 0;
      s.style.setProperty('--stage-color', lerpColor(GOLD, TERRACOTTA, t));
    });
  }
  colorStages('.v2-journey-stop');
  colorStages('.v2-journey-stop-m');

  function setupPath(opts){
    var wrap = document.getElementById(opts.wrapId);
    var fill = document.getElementById(opts.fillId);
    if(!wrap || !fill) return null;
    var stops = [].slice.call(wrap.querySelectorAll(opts.stopSelector));
    if(!stops.length) return null;

    function update(){
      if(wrap.offsetParent === null) return; // hidden by the responsive breakpoint
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var firstRect = stops[0].getBoundingClientRect();
      var lastRect = stops[stops.length - 1].getBoundingClientRect();
      var readLine = vh * 0.62;
      // Progress is driven by how far the section has scrolled past the viewport
      // read line, measured against the vertical span of the stop list — this
      // works for both the desktop horizontal path and the mobile vertical rail
      // since the scroll axis itself is always vertical.
      var spanTop = firstRect.top, spanBottom = lastRect.top;
      var p = (readLine - spanTop) / Math.max(1, (spanBottom - spanTop));
      p = Math.max(0, Math.min(1, p));

      if(opts.vertical){ fill.style.height = (p * 100) + '%'; }
      else { fill.style.width = (p * 100) + '%'; }

      var activeIndex = Math.round(p * (stops.length - 1));
      stops.forEach(function(s, i){ s.classList.toggle('is-active', i <= activeIndex); });
    }
    return update;
  }

  var updateDesktop = setupPath({ wrapId:'journeyStopsDesktop', fillId:'journeyRailFillDesktop', stopSelector:'.v2-journey-stop', vertical:false });
  var updateMobile = setupPath({ wrapId:'journeyStopsMobile', fillId:'journeyRailFillMobile', stopSelector:'.v2-journey-stop-m', vertical:true });

  if(!updateDesktop && !updateMobile) return;

  function updateAll(){
    if(updateDesktop) updateDesktop();
    if(updateMobile) updateMobile();
  }

  if(reduceMotion){
    // Show the completed state once, no scroll-linked animation.
    updateAll();
    return;
  }

  var ticking = false;
  function requestUpdate(){
    if(ticking) return;
    ticking = true;
    requestAnimationFrame(function(){ updateAll(); ticking = false; });
  }
  window.addEventListener('scroll', requestUpdate, { passive:true });
  window.addEventListener('resize', requestUpdate, { passive:true });
  window.addEventListener('load', updateAll);
  requestAnimationFrame(updateAll);
})();
