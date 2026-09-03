// ============================================================
// AARK INTERNATIONAL SCHOOL — shared interactivity
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Accessibility baseline ---------- */
  const mainContent = document.querySelector('main');
  if (mainContent) {
    if (!mainContent.id) mainContent.id = 'main-content';
    const skipLink = document.createElement('a');
    skipLink.href = '#' + mainContent.id;
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to main content';
    document.body.prepend(skipLink);
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Sticky nav + scroll progress ---------- */
  const nav = document.getElementById('site-nav');
  const progress = document.getElementById('scroll-progress');
  const onScroll = () => {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
    if (progress) {
      const h = document.documentElement;
      const scrollable = h.scrollHeight - h.clientHeight;
      const pct = scrollable > 0 ? (h.scrollTop / scrollable) * 100 : 0;
      progress.style.width = pct + '%';
    }
    const backToTop = document.getElementById('back-to-top');
    if (backToTop) backToTop.classList.toggle('opacity-0', window.scrollY < 500);
    if (backToTop) backToTop.classList.toggle('pointer-events-none', window.scrollY < 500);
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Nav dropdowns: explicit toggle button ----------
     The nav label (e.g. "Admissions") is a plain <a> that always
     navigates — no ambiguity on any device. The small chevron button
     next to it is a separate, dedicated target that only opens/closes
     the submenu panel, works identically with mouse or touch, and
     never blocks the label's own click from going through. */
  document.querySelectorAll('[data-dropdown]').forEach(wrap => {
    const toggle = wrap.querySelector('[data-dropdown-toggle]');
    if (!toggle) return;
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const willOpen = !wrap.classList.contains('dropdown-open');
      document.querySelectorAll('[data-dropdown].dropdown-open').forEach(w => {
        w.classList.remove('dropdown-open');
        const t = w.querySelector('[data-dropdown-toggle]');
        if (t) t.setAttribute('aria-expanded', 'false');
      });
      if (willOpen) {
        wrap.classList.add('dropdown-open');
        toggle.setAttribute('aria-expanded', 'true');
      }
    });
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-dropdown]')) {
      document.querySelectorAll('[data-dropdown].dropdown-open').forEach(w => {
        w.classList.remove('dropdown-open');
        const t = w.querySelector('[data-dropdown-toggle]');
        if (t) t.setAttribute('aria-expanded', 'false');
      });
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('[data-dropdown].dropdown-open').forEach(w => {
      w.classList.remove('dropdown-open');
      const toggle = w.querySelector('[data-dropdown-toggle]');
      if (toggle) {
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  });

  /* ---------- Mobile nav toggle ---------- */
  const navToggle = document.getElementById('nav-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('flex');
      mobileMenu.classList.toggle('hidden');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
      mobileMenu.classList.remove('flex');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open menu');
    }));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('flex')) {
        mobileMenu.classList.add('hidden');
        mobileMenu.classList.remove('flex');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Open menu');
        navToggle.focus();
      }
    });
  }

  /* ---------- Site-wide page finder (button or Ctrl/Cmd + K) ---------- */
  const SITE_PAGES = [
    ['Home', 'Overview, highlights and upcoming events', 'index.html'],
    ['About us', 'Our story, values and leadership', 'about.html'],
    ['Faculty', 'Meet our teachers and school leaders', 'faculty.html'],
    ['Achievements', 'Student, academic and sports achievements', 'achievements.html'],
    ['Student life', 'Clubs, arts, sports and wellbeing', 'student-life.html'],
    ['Academics', 'Learning stages and academic approach', 'academics.html'],
    ['Curriculum', 'Subjects, assessment and learning pathways', 'curriculum.html'],
    ['Campus', 'Facilities, classrooms and learning spaces', 'campus.html'],
    ['Gallery', 'Photos from around the school', 'gallery.html'],
    ['Admissions', 'Process, eligibility, fees and FAQs', 'admissions.html'],
    ['Admission registration', 'Register a student for admission', 'admission-registration.html'],
    ['Book a visit', 'Schedule a guided campus tour', 'book-a-tour.html'],
    ['News and events', 'Latest school stories and dates', 'news.html'],
    ['Contact', 'Phone, email, directions and enquiry form', 'contact.html'],
    ['Mandatory disclosure', 'Public school and affiliation information', 'mandatory-disclosure.html']
  ];
  const finder = document.createElement('div');
  finder.id = 'site-finder';
  finder.className = 'site-finder';
  finder.setAttribute('aria-hidden', 'true');
  finder.innerHTML = `
    <div class="site-finder__backdrop" data-finder-close></div>
    <section class="site-finder__panel" role="dialog" aria-modal="true" aria-labelledby="site-finder-title">
      <div class="site-finder__header">
        <div><p class="eyebrow">Quick navigation</p><h2 id="site-finder-title">Where would you like to go?</h2></div>
        <button type="button" class="site-finder__close" data-finder-close aria-label="Close page finder">&times;</button>
      </div>
      <label class="site-finder__search">
        <span class="sr-only">Search school pages</span>
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8"/><path d="m16.5 16.5 4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        <input type="search" autocomplete="off" placeholder="Try “admissions”, “sports” or “visit”…">
        <kbd>ESC</kbd>
      </label>
      <nav class="site-finder__results" aria-label="School pages"></nav>
      <p class="site-finder__empty" hidden>No matching pages. Try a different word.</p>
    </section>`;
  document.body.appendChild(finder);
  const finderInput = finder.querySelector('input');
  const finderResults = finder.querySelector('.site-finder__results');
  const finderEmpty = finder.querySelector('.site-finder__empty');
  let finderOpener = null;

  function renderFinder(query = '') {
    const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const matches = SITE_PAGES.filter(([title, description]) => {
      const haystack = `${title} ${description}`.toLowerCase();
      return terms.every(term => haystack.includes(term));
    });
    finderResults.innerHTML = matches.map(([title, description, href], i) => `
      <a href="${href}" class="site-finder__result${i === 0 ? ' is-first' : ''}">
        <span><strong>${title}</strong><small>${description}</small></span><span aria-hidden="true">&rarr;</span>
      </a>`).join('');
    finderEmpty.hidden = matches.length > 0;
  }
  function openFinder(opener) {
    finderOpener = opener || document.activeElement;
    finder.classList.add('is-open');
    finder.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    renderFinder(finderInput.value);
    requestAnimationFrame(() => finderInput.focus());
  }
  function closeFinder() {
    if (!finder.classList.contains('is-open')) return;
    finder.classList.remove('is-open');
    finder.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (finderOpener && typeof finderOpener.focus === 'function') finderOpener.focus();
  }
  finderInput.addEventListener('input', () => renderFinder(finderInput.value));
  finderInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const first = finderResults.querySelector('a');
      if (first) window.location.href = first.href;
    }
  });
  finder.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusable = [...finder.querySelectorAll('button:not([disabled]), input:not([disabled]), a[href]')]
      .filter(el => el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  finder.querySelectorAll('[data-finder-close]').forEach(el => el.addEventListener('click', closeFinder));
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      finder.classList.contains('is-open') ? closeFinder() : openFinder();
    } else if (e.key === 'Escape') {
      closeFinder();
    }
  });
  const desktopActions = document.querySelector('#site-nav .hidden.lg\\:flex.items-center.gap-3');
  if (desktopActions) {
    const searchButton = document.createElement('button');
    searchButton.type = 'button';
    searchButton.className = 'site-search-button';
    searchButton.setAttribute('aria-label', 'Find a page');
    searchButton.innerHTML = '<svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8"/><path d="m16.5 16.5 4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><span>Find</span><kbd>⌘K</kbd>';
    searchButton.addEventListener('click', () => openFinder(searchButton));
    desktopActions.prepend(searchButton);
  }
  if (mobileMenu) {
    const mobileSearch = document.createElement('button');
    mobileSearch.type = 'button';
    mobileSearch.className = 'mobile-site-search';
    mobileSearch.textContent = '⌕  Find a page';
    mobileSearch.addEventListener('click', () => openFinder(mobileSearch));
    mobileMenu.prepend(mobileSearch);
  }
  renderFinder();

  /* ---------- Social links (from assets/js/config.js) ---------- */
  const socialLinks = window.SOCIAL_LINKS || {};
  document.querySelectorAll('[data-social]').forEach(a => {
    const url = socialLinks[a.dataset.social];
    if (url) {
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
    } else {
      a.removeAttribute('href');
      a.hidden = true;
    }
  });

  /* ---------- Optional keyed Google Maps embed ---------- */
  const mapFrame = document.getElementById('school-map-embed');
  if (mapFrame && window.GOOGLE_MAPS_API_KEY) {
    const query = window.SCHOOL_MAP_QUERY || '';
    mapFrame.src = `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(window.GOOGLE_MAPS_API_KEY)}&q=${query}`;
  }

  /* ---------- Back to top ---------- */
  const backToTop = document.getElementById('back-to-top');
  if (backToTop) backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' }));

  /* ---------- Admissions-open pop-up notice ----------
     Shows once per browser session (sessionStorage), a beat after load
     so it doesn't fight the hero animation for attention. */
  const notice = document.getElementById('admission-notice');
  if (notice) {
    const DISMISS_KEY = 'hg_admission_notice_dismissed';
    if (!sessionStorage.getItem(DISMISS_KEY)) {
      setTimeout(() => {
        notice.classList.remove('translate-y-[140%]', 'opacity-0');
      }, 1400);
    } else {
      notice.remove();
    }
    const closeBtn = document.getElementById('admission-notice-close');
    if (closeBtn) closeBtn.addEventListener('click', () => {
      notice.classList.add('translate-y-[140%]', 'opacity-0');
      sessionStorage.setItem(DISMISS_KEY, '1');
      setTimeout(() => notice.remove(), 500);
    });
  }

  /* ---------- Reveal on scroll (fallback for elements not using AOS) ---------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } });
    }, { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
  }

  /* ---------- Animated counters ---------- */
  const counters = document.querySelectorAll('[data-counter]');
  if (counters.length) {
    const animateCounter = (el) => {
      const target = parseFloat(el.dataset.counter);
      const suffix = el.dataset.suffix || '';
      const dur = 1600;
      const start = performance.now();
      const step = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = target * eased;
        el.textContent = (target % 1 === 0 ? Math.floor(val) : val.toFixed(1)) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { animateCounter(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.5 });
    counters.forEach(el => cio.observe(el));
  }

  /* ---------- Testimonial / story slider ---------- */
  document.querySelectorAll('[data-slider]').forEach(slider => {
    const slides = slider.querySelectorAll('.slide');
    const prev = slider.querySelector('[data-prev]');
    const next = slider.querySelector('[data-next]');
    const dotsWrap = slider.querySelector('[data-dots]');
    let idx = 0;
    if (dotsWrap) {
      slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'w-2 h-2 rounded-full bg-current opacity-30 transition-opacity';
        dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        dot.addEventListener('click', () => show(i));
        dotsWrap.appendChild(dot);
      });
    }
    const show = (i) => {
      slides[idx].classList.remove('active');
      idx = (i + slides.length) % slides.length;
      slides[idx].classList.add('active');
      if (dotsWrap) [...dotsWrap.children].forEach((d, di) => d.classList.toggle('opacity-30', di !== idx) || d.classList.toggle('opacity-100', di === idx));
    };
    if (slides.length) show(0);
    if (prev) prev.addEventListener('click', () => show(idx - 1));
    if (next) next.addEventListener('click', () => show(idx + 1));
    let auto = prefersReducedMotion ? null : setInterval(() => show(idx + 1), 6000);
    slider.addEventListener('mouseenter', () => clearInterval(auto));
    slider.addEventListener('mouseleave', () => { if (!prefersReducedMotion) auto = setInterval(() => show(idx + 1), 6000); });
  });

  /* ---------- Gallery lightbox ----------
     Delegated on document (not bound per-item) so it still works for
     gallery items injected later by cms.js once the CMS API responds.
     Tracks position within whatever's currently visible (respecting
     the active filter), so prev/next, arrow keys, and swipe all stay
     in sync with what filter the user has selected. */
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    const lbImg = lightbox.querySelector('img');
    const lbCaption = lightbox.querySelector('[data-lb-caption]');
    const prevBtn = lightbox.querySelector('[data-lb-prev]');
    const nextBtn = lightbox.querySelector('[data-lb-next]');
    const closeBtn = lightbox.querySelector('[data-lb-close]');
    let currentIndex = -1;
    let lightboxOpener = null;
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Image viewer');

    function visibleItems() {
      return [...document.querySelectorAll('[data-gallery-item]')].filter(el => el.offsetParent !== null);
    }
    function showIndex(i) {
      const items = visibleItems();
      if (!items.length) return;
      currentIndex = (i + items.length) % items.length;
      const item = items[currentIndex];
      const img = item.querySelector('img');
      lbImg.src = item.dataset.full || (img ? img.src : '');
      lbImg.alt = img ? img.alt : '';
      if (lbCaption) lbCaption.textContent = item.dataset.caption || '';
      const showArrows = items.length > 1;
      if (prevBtn) prevBtn.classList.toggle('hidden', !showArrows);
      if (nextBtn) nextBtn.classList.toggle('hidden', !showArrows);
    }

    document.addEventListener('click', (e) => {
      const item = e.target.closest('[data-gallery-item]');
      if (!item) return;
      lightboxOpener = item;
      const items = visibleItems();
      showIndex(items.indexOf(item));
      lightbox.classList.add('open');
      document.body.classList.add('modal-open');
      closeBtn?.focus();
    });
    const closeLightbox = () => {
      lightbox.classList.remove('open');
      document.body.classList.remove('modal-open');
      lightboxOpener?.focus();
    };
    prevBtn?.addEventListener('click', (e) => { e.stopPropagation(); showIndex(currentIndex - 1); });
    nextBtn?.addEventListener('click', (e) => { e.stopPropagation(); showIndex(currentIndex + 1); });
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox || e.target.closest('[data-lb-close]')) closeLightbox(); });
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') showIndex(currentIndex - 1);
      if (e.key === 'ArrowRight') showIndex(currentIndex + 1);
    });

    // Mobile swipe: left = next, right = previous.
    let touchStartX = null;
    lightbox.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
    lightbox.addEventListener('touchend', (e) => {
      if (touchStartX === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 40) showIndex(currentIndex + (dx < 0 ? 1 : -1));
      touchStartX = null;
    }, { passive: true });
  }

  /* ---------- Horizontal-scroll sliders (Faculty, etc.) ----------
     Generic: [data-slider-prev="#id"] / [data-slider-next="#id"] scroll
     the element with that id by roughly one card-width. Native touch
     scrolling (with scroll-snap) already handles mobile for free. */
  document.querySelectorAll('[data-slider-prev], [data-slider-next]').forEach(btn => {
    const targetSel = btn.dataset.sliderPrev || btn.dataset.sliderNext;
    const target = document.querySelector(targetSel);
    if (!target) return;
    const dir = btn.hasAttribute('data-slider-prev') ? -1 : 1;
    btn.addEventListener('click', () => {
      const card = target.querySelector(':scope > *');
      const step = card ? card.getBoundingClientRect().width + 24 : 300; // + gap-6
      target.scrollBy({ left: dir * step * 2, behavior: 'smooth' });
    });
  });

  /* ---------- Info modal (Academics program cards, etc.) ----------
     Generic: any element with data-open-modal="id" opens #info-modal
     populated from that same element's other data-modal-* attributes.
     data-modal-highlights takes a "|"-separated list. */
  const infoModal = document.getElementById('info-modal');
  if (infoModal) {
    const elImg = infoModal.querySelector('[data-modal-image]');
    const elEyebrow = infoModal.querySelector('[data-modal-eyebrow]');
    const elTitle = infoModal.querySelector('[data-modal-title]');
    const elBody = infoModal.querySelector('[data-modal-body]');
    const elHighlights = infoModal.querySelector('[data-modal-highlights]');
    const modalClose = infoModal.querySelector('[data-modal-close]');
    let modalOpener = null;
    infoModal.setAttribute('role', 'dialog');
    infoModal.setAttribute('aria-modal', 'true');
    if (elTitle) {
      if (!elTitle.id) elTitle.id = 'info-modal-title';
      infoModal.setAttribute('aria-labelledby', elTitle.id);
    }

    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-open-modal]');
      if (!trigger) return;
      modalOpener = trigger;
      elImg.src = trigger.dataset.modalImage || '';
      elImg.alt = trigger.dataset.modalTitle || '';
      elEyebrow.textContent = trigger.dataset.modalEyebrow || '';
      elTitle.textContent = trigger.dataset.modalTitle || '';
      elBody.textContent = trigger.dataset.modalBody || '';
      const highlights = (trigger.dataset.modalHighlights || '').split('|').map(s => s.trim()).filter(Boolean);
      elHighlights.replaceChildren(...highlights.map(highlight => {
        const item = document.createElement('li');
        item.className = 'flex gap-3 text-sm text-ink/70';
        const marker = document.createElement('span');
        marker.className = 'text-gold mt-0.5';
        marker.setAttribute('aria-hidden', 'true');
        marker.textContent = '◆';
        item.append(marker, document.createTextNode(highlight));
        return item;
      }));
      infoModal.classList.remove('hidden');
      infoModal.classList.add('flex');
      document.body.classList.add('modal-open');
      modalClose?.focus();
    });
    const closeInfoModal = () => {
      infoModal.classList.add('hidden');
      infoModal.classList.remove('flex');
      document.body.classList.remove('modal-open');
      modalOpener?.focus();
    };
    infoModal.querySelectorAll('[data-modal-close], [data-modal-backdrop]').forEach(el => {
      el.addEventListener('click', closeInfoModal);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !infoModal.classList.contains('hidden')) closeInfoModal();
    });
  }

  /* ---------- Gallery filters ---------- */
  const filterBtns = document.querySelectorAll('[data-filter]');
  if (filterBtns.length) {
    filterBtns.forEach(btn => btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('bg-[var(--navy)]', 'text-white'));
      btn.classList.add('bg-[var(--navy)]', 'text-white');
      const cat = btn.dataset.filter;
      document.querySelectorAll('[data-gallery-item]').forEach(item => {
        item.style.display = (cat === 'all' || item.dataset.category === cat) ? '' : 'none';
      });
    }));
  }

  /* ---------- Multi-step application ---------- */
  document.querySelectorAll('[data-multi-step-form]').forEach(form => {
    const panels = [...form.querySelectorAll('[data-form-step]')];
    const indicators = [...form.querySelectorAll('[data-step-indicator]')];
    let current = 0;

    const fieldValid = field => {
      if (field.type === 'checkbox') return !field.required || field.checked;
      return field.checkValidity();
    };
    const show = index => {
      current = Math.max(0, Math.min(index, panels.length - 1));
      panels.forEach((panel, i) => panel.classList.toggle('hidden', i !== current));
      indicators.forEach((item, i) => {
        item.classList.toggle('is-active', i === current);
        item.classList.toggle('is-complete', i < current);
        item.setAttribute('aria-current', i === current ? 'step' : 'false');
      });
      form.querySelector('[data-step-progress]')?.style.setProperty('--step-progress', `${((current + 1) / panels.length) * 100}%`);
      panels[current]?.querySelector('input, select, textarea')?.focus({ preventScroll: true });
      panels[current]?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'nearest' });
    };

    form.querySelectorAll('[data-step-next]').forEach(button => button.addEventListener('click', () => {
      const invalid = [...panels[current].querySelectorAll('[required]')].find(field => !fieldValid(field));
      if (invalid) {
        invalid.reportValidity();
        invalid.focus();
        return;
      }
      show(current + 1);
    }));
    form.querySelectorAll('[data-step-back]').forEach(button => button.addEventListener('click', () => show(current - 1)));

    const reviewButton = form.querySelector('[data-populate-review]');
    reviewButton?.addEventListener('click', () => {
      form.querySelectorAll('[data-review-field]').forEach(output => {
        const field = form.elements[output.dataset.reviewField];
        output.textContent = field?.value || 'Not provided';
      });
    });
    show(0);
  });

  /* ---------- Forms: validated submission with honest server feedback ---------- */
  document.querySelectorAll('form[data-async-form]').forEach(form => {
    const spamTrap = document.createElement('div');
    spamTrap.className = 'absolute -left-[10000px] w-px h-px overflow-hidden';
    spamTrap.setAttribute('aria-hidden', 'true');
    spamTrap.innerHTML = '<label>Leave this field empty<input name="website" type="text" tabindex="-1" autocomplete="off"></label>';
    form.prepend(spamTrap);
    const successBox = document.querySelector(form.dataset.successTarget || '');
    let statusBox = form.querySelector('.form-status');
    if (!statusBox) {
      statusBox = document.createElement('div');
      statusBox.className = 'form-status hidden';
      statusBox.setAttribute('role', 'alert');
      statusBox.setAttribute('aria-live', 'polite');
      form.appendChild(statusBox);
    }

    function validateField(field) {
      const errorEl = field.parentElement.querySelector('.field-error');
      const value = (field.value || '').trim();
      const isEmpty = field.required && (field.type === 'checkbox' ? !field.checked : !value);
      const isBadEmail = field.type === 'email' && value && !/^\S+@\S+\.\S+$/.test(value);
      const isBadPhone = field.type === 'tel' && value && value.replace(/\D/g, '').length < 10;
      const bad = isEmpty || isBadEmail || isBadPhone;
      field.classList.toggle('border-red-400', bad);
      field.setAttribute('aria-invalid', bad ? 'true' : 'false');
      if (errorEl) errorEl.classList.toggle('hidden', !bad);
      return !bad;
    }
    form.querySelectorAll('[required]').forEach(field => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        if (field.getAttribute('aria-invalid') === 'true') validateField(field);
        statusBox.className = 'form-status hidden';
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Compose a hidden field from several visible ones before validating
      // (e.g. "First / Middle / Surname" -> a single studentName value the
      // API actually expects). Declared as data-compose-name="src1,src2:target".
      if (form.dataset.composeName) {
        const [srcFields, targetField] = form.dataset.composeName.split(':');
        const parts = srcFields.split(',')
          .map(n => (form.querySelector(`[name="${n}"]`) || {}).value)
          .filter(v => v && v.trim());
        const targetInput = form.querySelector(`[name="${targetField}"]`);
        if (targetInput) targetInput.value = parts.join(' ').trim();
      }

      const invalidFields = [...form.querySelectorAll('[required]')].filter(field => !validateField(field));
      if (invalidFields.length) {
        invalidFields[0].focus();
        statusBox.textContent = `Please check ${invalidFields.length === 1 ? 'the highlighted field' : `${invalidFields.length} highlighted fields`} and try again.`;
        statusBox.className = 'form-status form-status--error';
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting…';

      const endpoint = form.dataset.endpoint;
      const finish = (payload = {}) => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        form.classList.add('hidden');
        if (successBox) successBox.classList.remove('hidden');
        if (successBox && form.dataset.referencePrefix) {
          const ref = successBox.querySelector('[data-application-reference]');
          if (ref && payload.reference) ref.textContent = payload.reference;
        }
      };
      if (endpoint) {
        const data = Object.fromEntries(new FormData(form).entries());
        const base = window.ARK_API_BASE || '';
        try {
          const response = await fetch(base + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          let payload = {};
          try { payload = await response.json(); } catch (_) { /* non-JSON server response */ }
          if (!response.ok) throw new Error(payload.error || 'We could not submit the form. Please try again.');
          finish(payload);
          if (successBox) {
            successBox.setAttribute('tabindex', '-1');
            successBox.focus();
          }
        } catch (error) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          statusBox.textContent = error.message || 'We could not reach the school right now. Please try again or contact us directly.';
          statusBox.className = 'form-status form-status--error';
          statusBox.focus?.();
        }
      } else {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        statusBox.textContent = 'This form is not connected to a submission service. Please contact the school office.';
        statusBox.className = 'form-status form-status--error';
      }
    });
  });

  /* ---------- Calendar widget (Book Appointment for Campus Visit) ----------
     Small, self-contained month-view date picker. Not tied to any one
     form — reads/writes whatever hidden input + display element its
     data attributes point to, so it can be reused elsewhere later. */
  const MONTH_NAMES = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
  document.querySelectorAll('[data-calendar]').forEach(cal => {
    const monthLabel = cal.querySelector('[data-cal-month]');
    const grid = cal.querySelector('[data-cal-grid]');
    const prevBtn = cal.querySelector('[data-cal-prev]');
    const nextBtn = cal.querySelector('[data-cal-next]');
    const hiddenInput = document.querySelector(cal.dataset.calTarget || '');
    const displayEl = document.querySelector(cal.dataset.calDisplay || '');
    if (!monthLabel || !grid) return;

    const today = new Date(); today.setHours(0, 0, 0, 0);
    let viewDate = new Date(today.getFullYear(), today.getMonth(), 1);
    let selectedDate = hiddenInput && hiddenInput.value ? new Date(hiddenInput.value) : null;

    function render() {
      monthLabel.textContent = `${MONTH_NAMES[viewDate.getMonth()]} ${viewDate.getFullYear()}`;
      grid.innerHTML = '';
      const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
      const startOffset = (firstOfMonth.getDay() + 6) % 7; // Monday-first
      const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
      const daysInPrevMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 0).getDate();

      const cells = [];
      for (let i = startOffset; i > 0; i--) cells.push({ day: daysInPrevMonth - i + 1, muted: true });
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
        cells.push({ day: d, date, disabled: date < today });
      }
      let nextDay = 1;
      while (cells.length < 42) cells.push({ day: nextDay++, muted: true });

      cells.forEach(cell => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = cell.day;
        const classes = ['cal-day'];
        if (cell.muted) classes.push('cal-day-muted', 'cal-day-disabled');
        if (cell.disabled) classes.push('cal-day-disabled');
        if (cell.date && cell.date.getTime() === today.getTime()) classes.push('cal-day-today');
        if (cell.date && selectedDate && cell.date.toDateString() === selectedDate.toDateString()) classes.push('cal-day-selected');
        btn.className = classes.join(' ');
        if (cell.date && !cell.disabled) {
          btn.addEventListener('click', () => {
            selectedDate = cell.date;
            render();
            // Build the value from local date parts. toISOString() can shift a
            // selected Indian midnight into the previous UTC calendar day.
            const iso = `${cell.date.getFullYear()}-${String(cell.date.getMonth() + 1).padStart(2, '0')}-${String(cell.date.getDate()).padStart(2, '0')}`;
            if (hiddenInput) { hiddenInput.value = iso; hiddenInput.dispatchEvent(new Event('change', { bubbles: true })); }
            if (displayEl) displayEl.textContent = cell.date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
          });
        }
        btn.disabled = Boolean(cell.muted || cell.disabled);
        if (cell.date) btn.setAttribute('aria-label', cell.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }));
        grid.appendChild(btn);
      });

      if (prevBtn) prevBtn.disabled = (viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() === today.getMonth());
    }

    prevBtn?.addEventListener('click', () => { viewDate.setMonth(viewDate.getMonth() - 1); render(); });
    nextBtn?.addEventListener('click', () => { viewDate.setMonth(viewDate.getMonth() + 1); render(); });
    render();
  });

  /* ---------- Enquire Now / Book an Appointment toggle ----------
     When "Book an Appointment" is selected, a calendar date becomes
     required; for "Enquire Now" it's optional. */
  document.querySelectorAll('[data-intent-toggle]').forEach(wrap => {
    const radios = wrap.querySelectorAll('input[type="radio"]');
    const calendarBlock = document.querySelector(wrap.dataset.calendarBlock || '');
    const dateInput = calendarBlock ? calendarBlock.querySelector('input[type="hidden"]') : null;
    function sync() {
      const checked = wrap.querySelector('input[type="radio"]:checked');
      const isAppointment = checked && checked.value === 'appointment';
      if (calendarBlock) calendarBlock.classList.toggle('opacity-50', !isAppointment);
      if (dateInput) dateInput.required = Boolean(isAppointment);
    }
    radios.forEach(r => r.addEventListener('change', sync));
    sync();
  });

});
