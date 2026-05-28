/* =============================================================
   MLG interactive landing — smooth scrollable
   ============================================================= */

(() => {
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // Prevent browser scroll-restoration from fighting our manual jump
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  /* ── Form submission storage ───────────────────────────────────
     POSTs form answers to MLG's backend so they're stored server-side
     (the mailto link only opens the user's mail client with our address
     and subject — the answers are never exposed to the user).

     Configure FORM_ENDPOINT below to point at:
       • a Formspree URL  (e.g. "https://formspree.io/f/xxxxxxxx"), OR
       • a Web3Forms URL  (e.g. "https://api.web3forms.com/submit"), OR
       • your own serverless function / API route.

     If FORM_ENDPOINT is empty, answers are written to localStorage as a
     fallback so they're not lost during development. */
  const FORM_ENDPOINT = '';  // ← set this to your backend URL

  window.storeAnswers = function (formId, data) {
    const payload = {
      form: formId,
      timestamp: new Date().toISOString(),
      page: location.href,
      data,
    };
    if (FORM_ENDPOINT) {
      // Fire-and-forget POST; keepalive lets it complete after navigation.
      try {
        fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
      } catch (_) {}
    } else {
      // Dev fallback — append to a localStorage queue.
      try {
        const key = 'mlg_form_submissions';
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        existing.push(payload);
        localStorage.setItem(key, JSON.stringify(existing));
      } catch (_) {}
    }
  };
  const storeAnswers = window.storeAnswers;

  /* Robust mailto opener — uses an anchor click which most browsers
     (Safari, iOS Mail, Outlook Web) handle better than location.href.
     Adds a single-space body so clients that refuse empty-body mailtos
     (some Outlook configs) still open cleanly. */
  window.openMailto = function (toAddress, subject) {
    const url = `mailto:${toAddress}`
      + `?subject=${encodeURIComponent(subject)}`
      + `&body=${encodeURIComponent(' ')}`;
    const a = document.createElement('a');
    a.href = url;
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 100);
  };
  const openMailto = window.openMailto;

  /* =====================================================
     Intro: static logo + slide-to-start
     ===================================================== */
  const intro    = $('#intro');
  const enterBtn = $('#enterBtn');
  const knob     = $('#enterKnob');
  const fill     = enterBtn.querySelector('.slide-start__fill');
  const excuses       = $('#excuses');
  const excusesField  = $('#excusesField');
  const deck     = $('#deck');

  /* ── Bubble-click logging ───────────────────────────────────────
     Records every excuse-chip click. Persists to localStorage and
     prints to the console. Expose window.__mlgBubbleLog (read) and
     window.__mlgBubbleLogDownload() to grab the full log as JSON.   */
  const BUBBLE_LOG_KEY = 'mlg.bubbleClicks';
  function getBubbleLog() {
    try { return JSON.parse(localStorage.getItem(BUBBLE_LOG_KEY) || '[]'); }
    catch (e) { return []; }
  }
  function logBubbleClick(text) {
    const entry = {
      text: text,
      ts: new Date().toISOString(),
      ua: navigator.userAgent,
      page: location.href,
    };
    const log = getBubbleLog();
    log.push(entry);
    try { localStorage.setItem(BUBBLE_LOG_KEY, JSON.stringify(log)); } catch (e) {}
    console.log('[bubble-click]', entry);
  }
  window.__mlgBubbleLog = getBubbleLog;
  window.__mlgBubbleLogDownload = function () {
    const blob = new Blob([JSON.stringify(getBubbleLog(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mlg-bubble-clicks-' + new Date().toISOString().slice(0,10) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  window.__mlgBubbleLogClear = function () {
    localStorage.removeItem(BUBBLE_LOG_KEY);
    console.log('[bubble-click] log cleared');
  };

  let experienceStarted = false;
  function startExperience() {
    if (experienceStarted) return;
    experienceStarted = true;
    clearTimeout(introAutoAdvance);
    intro.classList.add('is-leaving');
    excuses.classList.add('is-on');
    excuses.setAttribute('aria-hidden', 'false');
    setTimeout(() => { intro.style.display = 'none'; }, 1100);
    setTimeout(buildExcuses, 200);
  }

  /* Auto-advance to bubbles after 5s if the user hasn't slid manually.
     We animate the slider knob across so the visual transition still
     reads as "the slide-to-start completed". */
  const introAutoAdvance = setTimeout(() => {
    if (experienceStarted) return;
    knob.style.transition = 'transform 600ms var(--ease-out)';
    fill.style.transition = 'width 600ms var(--ease-out)';
    setKnob(maxKnobX());
    enterBtn.classList.add('is-done');
    setTimeout(startExperience, 380);
  }, 5000);

  function enterDeck() {
    excuses.classList.add('is-leaving');
    deck.classList.add('is-on');
    deck.setAttribute('aria-hidden', 'false');
    setTimeout(() => { excuses.style.display = 'none'; }, 1100);
    // Enable native scroll + start smooth scroll
    document.body.classList.add('deck-active');
    syncHeight();
    startSmoothScroll();
    setTimeout(buildGlobe, 16);
    setTimeout(initReveal, 400);
  }

  // Slide-to-start drag handler
  let startDrag = null;
  function maxKnobX() {
    return enterBtn.clientWidth - knob.offsetWidth - 8;
  }
  function setKnob(x) {
    const clamped = Math.max(0, Math.min(maxKnobX(), x));
    knob.style.transform = `translateX(${clamped}px)`;
    fill.style.width = `${clamped + knob.offsetWidth / 2}px`;
    enterBtn.classList.toggle('is-armed', clamped >= maxKnobX() * 0.85);
    return clamped;
  }
  function resetKnob() {
    knob.style.transition = 'transform 220ms var(--ease-out)';
    fill.style.transition = 'width 220ms var(--ease-out)';
    knob.style.transform = 'translateX(0)';
    fill.style.width = '0';
    enterBtn.classList.remove('is-armed');
    setTimeout(() => {
      knob.style.transition = '';
      fill.style.transition = '';
    }, 240);
  }

  knob.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    startDrag = { x: e.clientX, id: e.pointerId, kx: parseFloat(getComputedStyle(knob).transform.split(',')[4]) || 0 };
    enterBtn.classList.add('is-dragging');
    try { knob.setPointerCapture(e.pointerId); } catch (_) {}
    document.addEventListener('pointermove', onSlideMove, { passive: false });
    document.addEventListener('pointerup',     onSlideEnd, { once: true });
    document.addEventListener('pointercancel', onSlideEnd, { once: true });
  });

  function onSlideMove(e) {
    if (!startDrag || e.pointerId !== startDrag.id) return;
    e.preventDefault();
    setKnob(startDrag.kx + (e.clientX - startDrag.x));
  }
  function onSlideEnd() {
    if (!startDrag) return;
    const cur = parseFloat(getComputedStyle(knob).transform.split(',')[4]) || 0;
    enterBtn.classList.remove('is-dragging');
    document.removeEventListener('pointermove', onSlideMove);
    if (cur >= maxKnobX() * 0.85) {
      setKnob(maxKnobX());
      enterBtn.classList.add('is-done');
      startExperience();
    } else {
      resetKnob();
    }
    startDrag = null;
  }

  enterBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setKnob(maxKnobX());
      enterBtn.classList.add('is-done');
      startExperience();
    }
  });

  /* Fly animation for the stepped-pyramid mark. */
  function flyMark(markEl) {
    if (!markEl || markEl.dataset.flying === '1') return;
    markEl.dataset.flying = '1';
    const paths = markEl.querySelectorAll('.mark__path');
    const DUR = 1400, STAGGER = 110;
    paths.forEach((p, i) => {
      p.animate(
        [
          { transform: 'translate(0,0) rotate(0deg) scale(1)',                opacity: 1, offset: 0    },
          { transform: 'translate(220px,-260px) rotate(35deg) scale(0.35)',   opacity: 0, offset: 0.38 },
          { transform: 'translate(-220px,260px) rotate(-25deg) scale(0.35)',  opacity: 0, offset: 0.42 },
          { transform: 'translate(0,0) rotate(0deg) scale(1)',                opacity: 1, offset: 1    },
        ],
        { duration: DUR, delay: i * STAGGER, easing: 'cubic-bezier(0.55, 0.05, 0.25, 1)', fill: 'both' }
      );
    });
    setTimeout(() => { delete markEl.dataset.flying; }, DUR + (paths.length - 1) * STAGGER + 50);
  }
  window.MLG = Object.assign(window.MLG || {}, { flyMark });


  /* =====================================================
     Excuses interstitial — drifting chips, pop to burst
     ===================================================== */
  const EXCUSES = [
    "I am working in the best of all teams",
    "Our decisions are safe, sound, and fast",
    "We are attracting the smartest talents",
    "I am the best boss ever",
    "Our company culture fosters best performance",
    "We are leaders and role models",
    "We are a fast learning community",
    "The competition is jealous of us",
    "We are a winning team, curious and innovative",
    "I am proud of my company",
    "I am an authentic leader with natural authority",
    "We give each other candid feedback",
  ];

  let chipsState = [];
  let chipsRAF = null;
  let chipsCleared = 0;
  let revealed = false;

  function buildExcuses() {
    if (chipsState.length) return;
    const W = excusesField.clientWidth;
    const H = excusesField.clientHeight;

    EXCUSES.forEach((text, i) => {
      const chip = document.createElement('button');
      chip.className = 'excuse-chip';
      chip.type = 'button';
      chip.style.animationDelay = `${i * 70}ms`;

      const inner = document.createElement('span');
      inner.className = 'excuse-chip__inner';
      inner.textContent = text;
      inner.style.animationDelay = `${(Math.random() * -4).toFixed(2)}s`;
      chip.appendChild(inner);

      excusesField.appendChild(chip);

      const w = chip.offsetWidth;
      const h = chip.offsetHeight;

      const margin = 24;
      const x = margin + Math.random() * Math.max(0, W - w - margin * 2);
      const y = 100 + Math.random() * Math.max(0, H - h - 200);
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.35 + Math.random() * 0.45;

      chip.style.transform = `translate3d(${x}px, ${y}px, 0)`;

      const c = {
        el: chip, w, h,
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        dead: false,
      };
      chipsState.push(c);
      chip.addEventListener('click', () => {
        logBubbleClick(text);
        popChip(c);
      });
    });

    chipsRAF = requestAnimationFrame(driftChips);
  }

  function driftChips() {
    if (revealed) return;
    const W = excusesField.clientWidth;
    const H = excusesField.clientHeight;

    for (const c of chipsState) {
      if (c.dead) continue;
      c.x += c.vx;
      c.y += c.vy;
      if (c.x <= 0)            { c.x = 0;            c.vx = Math.abs(c.vx); }
      if (c.y <= 0)            { c.y = 0;            c.vy = Math.abs(c.vy); }
      if (c.x + c.w >= W)      { c.x = W - c.w;      c.vx = -Math.abs(c.vx); }
      if (c.y + c.h >= H)      { c.y = H - c.h;      c.vy = -Math.abs(c.vy); }
      c.el.style.transform = `translate3d(${c.x}px, ${c.y}px, 0)`;
    }
    chipsRAF = requestAnimationFrame(driftChips);
  }

  function popChip(c) {
    if (c.dead) return;
    c.dead = true;

    const text = c.el.textContent;
    const r = c.el.getBoundingClientRect();
    const parentR = excusesField.getBoundingClientRect();
    const cx = r.x - parentR.x + r.width / 2;
    const cy = r.y - parentR.y + r.height / 2;

    c.el.style.transition = 'opacity 120ms var(--ease-out), transform 120ms var(--ease-out)';
    c.el.style.opacity = '0';
    c.el.style.pointerEvents = 'none';

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === ' ') continue;
      const frag = document.createElement('span');
      frag.className = 'excuse-frag';
      frag.textContent = ch;
      frag.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      excusesField.appendChild(frag);

      const angle = Math.random() * Math.PI * 2;
      const dist = 50 + Math.random() * 110;
      const tx = cx + Math.cos(angle) * dist;
      const ty = cy + Math.sin(angle) * dist;
      const rot = (Math.random() - 0.5) * 360;
      const dur = 700 + Math.random() * 280;

      frag.animate(
        [
          { transform: `translate3d(${cx}px, ${cy}px, 0) rotate(0deg)`,        opacity: 1 },
          { transform: `translate3d(${tx}px, ${ty}px, 0) rotate(${rot}deg)`,    opacity: 0 },
        ],
        { duration: dur, easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)', fill: 'forwards' }
      );
      setTimeout(() => frag.remove(), dur + 50);
    }

    setTimeout(() => c.el.remove(), 200);

    chipsCleared += 1;
    if (chipsCleared >= 1) {
      triggerReveal();
    }
  }

  function triggerReveal() {
    if (revealed) return;
    revealed = true;
    excuses.classList.add('is-revealing');
    cancelAnimationFrame(chipsRAF);
    setTimeout(enterDeck, 3500);
  }


  // Corner mark
  const cornerMark = $('#cornerMark');
  if (cornerMark) {
    cornerMark.addEventListener('click', () => flyMark(cornerMark));
  }


  /* =====================================================
     Smooth scroll (lerp virtual scroller)
     ===================================================== */
  const slidesEl   = $('#slides');
  const railFill   = $('#railFill');
  const slides     = $$('.slide');
  const slideNav   = document.querySelector('.slide-nav');

  let scrollCurrent = 0;
  let scrollTarget  = 0;
  /* EASE = 1 → instant 1:1 scroll (no lerp lag) */
  const EASE = 1;
  let smoothRunning = false;
  let revealEls = [];

  function syncHeight() {
    // Set body height = slides content height so the native scrollbar is real
    document.body.style.height = slidesEl.scrollHeight + 'px';
  }

  window.addEventListener('scroll', () => {
    scrollTarget = window.scrollY;
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (document.body.classList.contains('deck-active')) syncHeight();
  });
  /* Resync once all deck images have loaded (so layout has settled before
     we lock body height — especially important on mobile where content
     grows taller than 100vh per slide). */
  function resyncWhenImagesLoaded() {
    if (!document.body.classList.contains('deck-active')) return;
    syncHeight();
    const imgs = slidesEl.querySelectorAll('img');
    let pending = imgs.length;
    if (!pending) return;
    imgs.forEach((img) => {
      if (img.complete) { if (--pending === 0) syncHeight(); }
      else img.addEventListener('load', () => { if (--pending === 0) syncHeight(); }, { once: true });
    });
  }
  window.addEventListener('load', resyncWhenImagesLoaded);
  /* Belt-and-braces retriggers for any late layout shifts on mobile */
  setTimeout(() => { if (document.body.classList.contains('deck-active')) syncHeight(); }, 600);
  setTimeout(() => { if (document.body.classList.contains('deck-active')) syncHeight(); }, 1500);
  setTimeout(() => { if (document.body.classList.contains('deck-active')) syncHeight(); }, 3000);
  /* Sync after font/image layout shifts via ResizeObserver on the slides container */
  if ('ResizeObserver' in window) {
    let resizeTimer;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (document.body.classList.contains('deck-active')) syncHeight();
      }, 100);
    });
    ro.observe(slidesEl);
  }

  function startSmoothScroll() {
    if (smoothRunning) return;
    smoothRunning = true;
    requestAnimationFrame(tickSmooth);
  }

  const heroSticky = document.getElementById('heroSticky');

  /* Section-sticky helpers — each <div class="section-sticky"> has a
     data-section selector that points at the in-slide section it tracks.
     Cached on init for perf — we re-resolve target lazily. */
  const sectionStickies = Array.from(document.querySelectorAll('.section-sticky'))
    .map((el) => ({ el, sel: el.dataset.section, target: null, _opacity: -1, _transform: '' }));
  function updateSectionStickies() {
    const isMobile = window.innerWidth <= 480;
    if (!isMobile) {
      sectionStickies.forEach((s) => {
        if (s._opacity !== 0) { s.el.style.opacity = 0; s._opacity = 0; }
      });
      return;
    }
    const vh = window.innerHeight;
    sectionStickies.forEach((s) => {
      if (!s.target) s.target = s.sel && document.querySelector(s.sel);
      if (!s.target) return;
      const rect = s.target.getBoundingClientRect();
      let opacity, transform;
      if (rect.bottom <= 0 || rect.top >= vh) {
        opacity = 0;
        transform = s._transform;
      } else {
        opacity = 1;
        if (rect.top <= 0 && rect.bottom > vh) {
          transform = 'translateY(0)';
        } else if (rect.top > 0) {
          transform = `translateY(${rect.top}px)`;
        } else {
          transform = `translateY(${rect.bottom - vh}px)`;
        }
      }
      if (opacity !== s._opacity) { s.el.style.opacity = opacity; s._opacity = opacity; }
      if (transform !== s._transform) { s.el.style.transform = transform; s._transform = transform; }
    });
  }

  let lastTickScroll = -1;
  function tickSmooth() {
    const diff = scrollTarget - scrollCurrent;
    scrollCurrent = Math.abs(diff) < 0.5 ? scrollTarget : scrollCurrent + diff * EASE;

    /* Skip the heavy work when scroll position hasn't actually changed —
       saves ~16ms/frame of layout reads on idle. */
    if (scrollCurrent === lastTickScroll) {
      requestAnimationFrame(tickSmooth);
      return;
    }
    lastTickScroll = scrollCurrent;

    slidesEl.style.transform = `translateY(${-scrollCurrent}px)`;

    /* Section stickies (challenges, why-mlg) on mobile */
    updateSectionStickies();

    /* Hero sticky: stays in place during slides 0+1, then scrolls up
       on the slide 1→2 transition, then disappears. */
    if (heroSticky) {
      const vh = window.innerHeight;
      let translate, opacity;
      if (scrollCurrent <= vh) {
        translate = 0;            // slide 0: fully visible, anchored
        opacity = 1;
      } else if (scrollCurrent <= 2 * vh) {
        translate = -(scrollCurrent - vh); // slide 1→2: scroll up with the rest
        opacity = 1;
      } else {
        translate = -vh;
        opacity = 0;              // past slide 2: hide
      }
      heroSticky.style.transform = `translateY(${translate}px)`;
      heroSticky.style.opacity = opacity;
    }

    // Rail progress
    const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
    if (railFill) {
      railFill.style.height = `${Math.min(100, (scrollCurrent / maxScroll) * 100)}%`;
    }

    // Active nav highlight
    updateActiveNav();

    // Trigger is-in-view for image entrance animations
    updateInView();

    // Scroll-driven reveal
    if (revealEls.length) {
      const vh = window.innerHeight;
      revealEls = revealEls.filter((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < vh * 0.88) {
          el.classList.add('is-visible');
          return false;
        }
        return true;
      });
    }

    requestAnimationFrame(tickSmooth);
  }

  /* =====================================================
     Navigation
     ===================================================== */
  const serviceLinks = [
    { label: 'Leadership Development',  href: 'leadership-development.html' },
    { label: 'Coaching & Sparring',     href: 'coaching-sparring.html' },
    { label: 'Audits & Assessments',    href: 'audits-assessments.html' },
    { label: 'Cultural Transformation', href: 'cultural-transformation.html' },
  ];

  if (slideNav) {
    slideNav.innerHTML = '';
    slides.forEach((slide, i) => {
      const title = slide.dataset.title || `${i + 1}`;
      if (title === 'Tailor') return;
      if (title === 'Testimonials') return;
      if (title === 'Welcome') return;
      if (title === 'Tools') return;
      if (title === 'Services') {
        const wrap = document.createElement('div');
        wrap.className = 'slide-nav__dropdown-wrap';

        const btn = document.createElement('a');
        btn.className = 'slide-nav__btn slide-nav__btn--has-drop';
        btn.href = '#';
        btn.dataset.slideIdx = i;
        btn.innerHTML = `${title}<svg class="slide-nav__chevron" viewBox="0 0 10 6" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 1l4 4 4-4"/></svg>`;
        btn.addEventListener('click', (e) => { e.preventDefault(); scrollToSlide(i); });

        const drop = document.createElement('div');
        drop.className = 'slide-nav__dropdown';
        serviceLinks.forEach(({ label, href }) => {
          const a = document.createElement('a');
          a.className = 'slide-nav__dropdown-item';
          a.href = href;
          a.textContent = label;
          drop.appendChild(a);
        });

        wrap.appendChild(btn);
        wrap.appendChild(drop);
        slideNav.appendChild(wrap);
      } else {
        const btn = document.createElement('button');
        btn.className = 'slide-nav__btn';
        btn.dataset.slideIdx = i;
        btn.textContent = title;
        btn.addEventListener('click', () => scrollToSlide(i));
        slideNav.appendChild(btn);
      }
    });
  }

  function scrollToSlide(idx) {
    if (idx < 0 || idx >= slides.length) return;
    const y = slides[idx].offsetTop;
    scrollTarget = y;
    window.scrollTo({ top: y, behavior: 'instant' });
  }
  // Expose globally so other IIFEs (tailor form, etc.) can navigate slides
  window.__mlgScrollTo = scrollToSlide;

  function updateActiveNav() {
    if (!slideNav) return;
    const midY = scrollCurrent + window.innerHeight * 0.5;
    let activeIdx = 0;
    slides.forEach((slide, i) => {
      // Skip display:none slides — their offsetTop is 0 which corrupts tracking
      if (i > 0 && slide.offsetParent === null) return;
      if (slide.offsetTop <= midY) activeIdx = i;
    });
    // Find the nav button whose slideIdx is closest to (but not above) activeIdx
    const btns = Array.from(slideNav.querySelectorAll('.slide-nav__btn'));
    let bestBtn = null;
    let bestDiff = Infinity;
    btns.forEach((btn) => {
      const si = parseInt(btn.dataset.slideIdx || '0', 10);
      const diff = activeIdx - si;
      if (diff >= 0 && diff < bestDiff) {
        bestDiff = diff;
        bestBtn = btn;
      }
    });
    btns.forEach((btn) => btn.classList.toggle('is-active', btn === bestBtn));
  }

  function updateInView() {
    const viewTop    = scrollCurrent - 80;
    const viewBottom = scrollCurrent + window.innerHeight + 80;
    slides.forEach((slide) => {
      if (slide.classList.contains('is-in-view')) return;
      const top = slide.offsetTop;
      const bot = top + slide.offsetHeight;
      if (bot > viewTop && top < viewBottom) slide.classList.add('is-in-view');
    });
  }

  // data-jump buttons
  $$('[data-jump]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const idx = parseInt(btn.dataset.jump, 10);
      if (!Number.isNaN(idx)) scrollToSlide(idx);
    });
  });

  // data-jump-title buttons
  $$('[data-jump-title]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const title = btn.dataset.jumpTitle;
      const idx = slides.findIndex((s) => s.dataset.title === title);
      if (idx >= 0) scrollToSlide(idx);
    });
  });

  // Burger menu (mobile)
  const burgerBtn  = $('#burgerBtn');
  const mobileNav  = $('#mobileNav');
  const serviceSubLinks = [
    { label: 'Leadership Development',  href: 'leadership-development.html' },
    { label: 'Coaching & Sparring',     href: 'coaching-sparring.html' },
    { label: 'Audits & Assessments',    href: 'audits-assessments.html' },
    { label: 'Cultural Transformation', href: 'cultural-transformation.html' },
  ];

  if (burgerBtn && mobileNav) {
    // Build mobile nav items
    slides.forEach((slide, i) => {
      const title = slide.dataset.title || String(i + 1);
      if (title === 'Tailor') return;
      if (title === 'Testimonials') return;
      if (title === 'Welcome') return;
      if (title === 'Tools') return;
      const item = document.createElement('button');
      item.className = 'mobile-nav__item';
      item.textContent = title;
      item.addEventListener('click', () => { closeMobileNav(); scrollToSlide(i); });
      mobileNav.appendChild(item);
      if (title === 'Services') {
        const sub = document.createElement('div');
        sub.className = 'mobile-nav__sub';
        serviceSubLinks.forEach(({ label, href }) => {
          const a = document.createElement('a');
          a.className = 'mobile-nav__sub-item';
          a.href = href;
          a.textContent = label;
          sub.appendChild(a);
        });
        mobileNav.appendChild(sub);
      }
    });

    function openMobileNav() {
      burgerBtn.classList.add('is-open');
      burgerBtn.setAttribute('aria-expanded', 'true');
      mobileNav.classList.add('is-open');
      mobileNav.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
    function closeMobileNav() {
      burgerBtn.classList.remove('is-open');
      burgerBtn.setAttribute('aria-expanded', 'false');
      mobileNav.classList.remove('is-open');
      mobileNav.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
    burgerBtn.addEventListener('click', () => {
      mobileNav.classList.contains('is-open') ? closeMobileNav() : openMobileNav();
    });
    // Close on Escape
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMobileNav(); });
  }

  // Deep-link: #slide=N skips intro and scrolls to the right section
  function jumpFromHash() {
    const m = location.hash.match(/^#slide=(\d+)$/);
    if (!m) return false;
    const idx = Math.max(0, Math.min(slides.length - 1, parseInt(m[1], 10)));
    intro.classList.add('is-leaving');
    intro.style.display = 'none';
    if (excuses) excuses.style.display = 'none';
    deck.classList.add('is-on');
    deck.setAttribute('aria-hidden', 'false');
    document.body.classList.add('deck-active');
    syncHeight();
    // Defer scroll to next frame so browser layout is committed before we jump
    requestAnimationFrame(() => {
      syncHeight(); // re-sync after layout pass
      const y = slides[idx]?.offsetTop || 0;
      scrollTarget  = y;
      scrollCurrent = y;
      window.scrollTo({ top: y, behavior: 'instant' });
      startSmoothScroll();
      setTimeout(buildGlobe, 16);
      setTimeout(initReveal, 300);
    });
    history.replaceState(null, '', location.pathname + location.search);
    return true;
  }
  jumpFromHash();

  // "Straight to website" button
  const websiteCtaBtn = document.querySelector('.website-cta');
  if (websiteCtaBtn) {
    websiteCtaBtn.addEventListener('click', (e) => {
      e.preventDefault();
      excuses.classList.add('is-leaving');
      deck.classList.add('is-on');
      deck.setAttribute('aria-hidden', 'false');
      setTimeout(() => { excuses.style.display = 'none'; }, 1100);
      document.body.classList.add('deck-active');
      syncHeight();
      startSmoothScroll();
      setTimeout(buildGlobe, 16);
      setTimeout(initReveal, 300);
    });
  }

  /* =====================================================
     Reveal animations (scroll-triggered)
     ===================================================== */
  function initReveal() {
    if (revealEls.length) return; // already initialized
    const vh = window.innerHeight;
    const selectors = [
      '.slide__copy',
      '.challenge-box',
      '.card-item',
      '.team-head',
      '.globe-side',
      '.globe-stage',
      '.globe-card',
      '.why-mlg__head',           // was .why-mlg__header (fix)
      '.approach-centered__header',
      '.news-card',
      '.news-media',
      '.testimonials-header',
      '.stat-item',
      '.services-split__copy',
      '.approach-ordinals-row',
      '.approach-hero__copy',
      '.network-strip__header',
      '.network-logos',
      '.approach-future__copy',
      '.approach-future__media',
    ];
    selectors.forEach((sel) => {
      $$(sel).forEach((el) => {
        if (el.classList.contains('reveal')) return;
        const rect = el.getBoundingClientRect();
        if (rect.top >= vh * 0.88) {
          // Only off-screen elements animate in; on-screen ones are already visible
          el.classList.add('reveal');
          revealEls.push(el);
        }
      });
    });
  }

  /* =====================================================
     Globe of clients
     ===================================================== */
  const CLIENTS = [
    { name: 'Microsoft',       logo: 'microsoft.png',      meta: 'If you are looking for ambitious, future-oriented leadership experts who understand your market, your culture and your leaders, contact MLG. We can highly recommend MLG as a partner of choice!' },
    { name: 'BMW Group',       logo: 'bmw.png',            meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Munich Re',       logo: 'munich-re.png',      meta: 'We collaborate with the MLG on different leadership projects and cultural initiatives. They deliver excellent work! MLG enjoys a great reputation at Munich RE.' },
    { name: 'Bayer',           logo: 'bayer.png',          meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Hannover Re',     logo: 'hannover-re.png',    meta: 'For our Top Leadership Program, MLG is our partner of choice. The collaboration with the experts from MLG is amazing — they definitely go the extra mile!' },
    { name: 'Strabag',         logo: 'strabag.png',        meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'BCG',             logo: 'bcg.png',            meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Knorr-Bremse',   logo: 'knorr-bremse.png',   meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'KUKA',            logo: 'kuka.png',           meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'ADAC',            logo: 'adac.png',           meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Montblanc',       logo: 'montblanc.png',      meta: 'MLG supported our ExCo to discover and align on the most relevant future leadership topics. Together with MLG, we fostered discussions on these topics on all leadership levels within Montblanc. We co-designed and deployed a process that ignited curiosity and movement within Montblanc. I can highly recommend working with MLG.' },
    { name: 'FC Bayern',       logo: 'fc-bayern.png',      meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Isar Aerospace',  logo: 'isar-aerospace.png', meta: 'We are a fast growing company in a very dynamic, future-oriented market environment. We need speed, innovative ideas and directly applicable leadership concepts — MLG is our partner of choice.' },
    { name: 'Rohde & Schwarz', logo: 'rohde-schwarz.png',  meta: 'MLG trains our talents in Singapore and Germany to become ready for new leadership roles as soon as possible. While the participants celebrate the facilitators and the great learning atmosphere, the performance improvements are remarkable.' },
    { name: 'Osram',           logo: 'osram.png',          meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Walt Disney',     logo: 'walt-disney.png',    meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Villeroy & Boch', logo: 'villeroy-boch.png',  meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Wella',           logo: 'wella.png',          meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Bilfinger',       logo: 'bilfinger.png',      meta: 'We are collaborating on top level with the MLG coaches — where the individual sessions are labelled as "sparring" rather than coaching. Our top executives love this approach. The sparring process situationally includes technical experts from the vast MLG network. The feedback is excellent.' },
    { name: 'TÜV Rheinland',   logo: 'tuev-rheinland.png', meta: 'Together with MLG, we designed and delivered an innovative Learning Journey over two years for our more than 100 global Top Executives. This journey is a true game changer for our culture and adds significantly to our overall performance.' },
    { name: 'Deutsche Bahn',   logo: 'deutsche-bahn.png',  meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Schaeffler',      logo: 'schaeffler.png',     meta: 'Continuous change is one of our most challenging topics. MLG helps us to translate our mutual ideas into practical programmes which are really "hands-on" and create value for the global leaders and their teams in our factories.' },
    { name: 'Thyssenkrupp',    logo: 'thyssenkrupp.png',   meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Nestlé',          logo: 'nestle.png',         meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'UniCredit',       logo: 'unicredit.png',      meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Freudenberg',     logo: 'freudenberg.png',    meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Kion Group',      logo: 'kion.png',           meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Körber',          logo: 'koerber.png',        meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Siemens Advanta', logo: 'siemens-advanta.png',meta: 'MLG is flexible, creative, and highly customer oriented. They have extensive leadership knowledge and experience, and they know how to apply this in a pragmatic, creative and memorable setting for participants. The personal collaboration is not only successful, but also fun!' },
    { name: 'Harman',          logo: 'harman.png',         meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Fraunhofer',      logo: 'fraunhofer.png',     meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'DIHK',            logo: 'dihk.png',           meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'DVAG',            logo: 'dvag.png',           meta: 'We are in a complex, vibrant business. I can highly recommend working with MLG in all facets of leadership development and transformation. The MLG experts understand our culture and the business we are in — and based on this, they customize successful measures for fostering our leadership performance.' },
    { name: 'HDI',             logo: 'hdi.png',            meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Hexagon',         logo: 'hexagon.png',        meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Exyte',           logo: 'exyte.png',          meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'BCG Platinion',   logo: 'bcg-platinion.png',  meta: 'Team development on top level is a skill that characterizes the work of the MLG experts. With a unique sense for individual strengths, they are helping to orchestrate the collaboration of leadership teams in a most successful way. Giving candid eye-opening feedback, speaking the truth — MLG works efficiently and straightforward.' },
    { name: 'Sauber',          logo: 'sauber.png',         meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'BayWa',           logo: 'baywa.png',          meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Knauf',           logo: 'knauf.png',          meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Deutz',           logo: 'deutz.png',          meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Vivawest',        logo: 'vivawest.svg',       meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Weidmüller',      logo: 'weidmueller.png',    meta: 'MLG helped us to focus and further develop the professional collaboration on top level. The toolset, the customization and the expertise of the MLG professionals let us remarkably grow our self-awareness.' },
    { name: 'Züblin',          logo: 'zueblin.png',        meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Ingenics',        logo: 'ingenics.png',       meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Giesecke+Devrient', logo: 'giesecke-devrient.png', meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Aqseptence',      logo: 'aqseptence.png',     meta: 'The experts of the Munich Leadership Group have been supporting us for years in the consistent further development of our corporate culture. Trainings and workshops are optimally addressed to the respective target group, whether at the factory or at any management level. We have very much benefited from working with the MLG.' },
    { name: 'Eagle Burgmann',  logo: 'eagle-burgmann.png', meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Reply',           logo: 'reply.png',          meta: 'The Munich Leadership Group supports us with a tailor-made leadership program that is in place since many years now and is continuously adapted to the new challenges in our vibrant environment. We can highly recommend working with the MLG experts.' },
    { name: 'RSM',             logo: 'rsm.png',            meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Golding Capital', logo: 'golding-capital.png',meta: 'MLG helped us gain deep insights into the strengths and particular characteristics of our leadership team. The combination of psychometric tools, the technical expertise of the MLG experts and their facilitation of team workshops is unique and creates great value.' },
    { name: 'Natuvion',        logo: 'natuvion.png',       meta: 'The Munich Leadership Group supports us with a tailor-made leadership program and, above all, contributes to transformation and cultural development through conceptual strength, innovative approaches and top facilitators.' },
    { name: 'Trivium',         logo: 'trivium.png',        meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'TÜV Süd',        logo: 'tuev-sued.png',      meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Käfer',           logo: 'kaefer.png',         meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Hülskens',        logo: 'huelskens.png',      meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'SSG',             logo: 'ssg.png',            meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
  ];

  const globeEl    = $('#globe');
  const globeStage = $('#globeStage');
  const cardName   = $('#globeCardName');
  const cardMeta   = $('#globeCardMeta');

  let chips  = [];
  let radius = 200;
  let rotY = 0, rotX = -12;
  let velY = 0;
  let isAuto = true;
  let dragG = null;
  let built = false;

  function buildGlobe() {
    if (built) return;
    built = true;

    globeEl.style.animation = 'none';
    radius = Math.min(globeStage.clientWidth, globeStage.clientHeight) / 2 * 0.92;

    const N = CLIENTS.length;
    const phi = Math.PI * (Math.sqrt(5) - 1);

    CLIENTS.forEach((c, i) => {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = phi * i;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;

      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      const chipImg = document.createElement('img');
      chipImg.className = 'chip__logo';
      chipImg.src = 'assets/clients/' + c.logo;
      chipImg.alt = c.name;
      chip.appendChild(chipImg);
      chip.dataset.index = String(i);
      chip.dataset.client = c.logo.replace('.png', '');
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        selectClient(i);
      });
      globeEl.appendChild(chip);
      chips.push({ el: chip, x, y, z });
    });

    globeStage.addEventListener('pointerdown', onGrab);
    window.addEventListener('resize', () => {
      radius = Math.min(globeStage.clientWidth, globeStage.clientHeight) / 2 * 0.92;
    });
  }

  function selectClient(i) {
    chips.forEach((c, j) => c.el.classList.toggle('is-selected', i === j));
    const c = CLIENTS[i];
    const card = document.getElementById('globeCard');
    cardName.textContent = c.name;
    cardMeta.textContent = c.meta;
    const more = document.getElementById('globeCardMore');
    if (more) more.hidden = false;
    if (card) {
      card.classList.remove('is-updating');
      // Force reflow so the animation re-triggers on every selection
      void card.offsetWidth;
      card.classList.add('is-updating');
    }
  }

  document.getElementById('globeCardMore')?.addEventListener('click', (e) => e.preventDefault());

  // ── Network details toggle ─────────────────────────────────────
  (function () {
    const toggle  = document.getElementById('networkToggle');
    const details = document.getElementById('networkDetails');
    const label   = toggle?.querySelector('.network-toggle__label');
    if (!toggle || !details) return;
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      const next     = !expanded;
      toggle.setAttribute('aria-expanded', String(next));
      details.hidden = !next;
      if (label) label.textContent = next ? 'Show less' : 'Learn more';
    });
  })();

  // ── Shuffle network logos on each load (details follow) ────────
  (function () {
    const wrap     = document.querySelector('.network-logos');
    const details  = document.getElementById('networkDetails');
    if (!wrap) return;
    const logos = Array.from(wrap.children);
    for (let i = logos.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [logos[i], logos[j]] = [logos[j], logos[i]];
    }
    logos.forEach((el) => wrap.appendChild(el));

    // Re-order the details panel to mirror the shuffled logos
    if (details) {
      logos.forEach((logo) => {
        const key = logo.dataset.partner;
        const match = details.querySelector(`.network-detail[data-partner="${key}"]`);
        if (match) details.appendChild(match);
      });
    }
  })();

  // ── Stat counter animation ─────────────────────────────────────
  (function () {
    const counters = $$('.stat-item__number[data-count]');
    if (!counters.length) return;
    let fired = false;

    function formatNum(n, useDot) {
      const s = Math.round(n).toString();
      return useDot ? s.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : s;
    }

    /* Animate one number element. If `overshoot` is true, use an ease
       that goes past the target and settles back (Easter-egg click). */
    function animateOne(el, duration, overshoot) {
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      const useDot = el.dataset.format === 'dot';
      const easeQuad = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const easeBack = (t) => { const s = 1.7; return 1 + (--t) * t * ((s + 1) * t + s); };
      const ease  = overshoot ? easeBack : easeQuad;
      const start = performance.now();
      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const value = Math.round(ease(progress) * target);
        el.textContent = formatNum(value, useDot) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = formatNum(target, useDot) + suffix; // ensure final
      }
      requestAnimationFrame(tick);
    }

    function runCounters() {
      if (fired) return;
      fired = true;
      counters.forEach((el) => animateOne(el, 1800, false));
    }

    /* Easter egg #7 — click a stat number to re-run with overshoot. */
    counters.forEach((el) => {
      el.style.cursor = 'pointer';
      el.title = 'Click me';
      el.addEventListener('click', () => animateOne(el, 1200, true));
    });

    const statsSlide = document.querySelector('.stats-strip');
    if (statsSlide && 'IntersectionObserver' in window) {
      new IntersectionObserver((entries, obs) => {
        if (entries[0].isIntersecting) { runCounters(); obs.disconnect(); }
      }, { threshold: 0.3 }).observe(statsSlide);
    }
  })();

  /* ───────────────────────────────────────────────────────────────
     Easter egg #3 — type "mlg" anywhere on the keyboard:
       • the corner mark flashes (3-step rise + red glow)
       • a confetti burst of small triangles erupts from the mark
       • a soft chime plays via Web Audio
     ─────────────────────────────────────────────────────────────── */
  (function () {
    const target = 'mlg';
    let buffer = '';
    let cooldown = false;

    document.addEventListener('keydown', (e) => {
      // Ignore when typing into a field
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k.length !== 1) { buffer = ''; return; }
      buffer = (buffer + k).slice(-target.length);
      if (buffer === target && !cooldown) {
        cooldown = true;
        triggerMlgEgg();
        setTimeout(() => { cooldown = false; }, 1800);
      }
    });

    function triggerMlgEgg() {
      const mark = document.getElementById('cornerMark');
      if (mark) {
        mark.classList.remove('mlg-egg-flash');
        void mark.offsetWidth; // restart animation
        mark.classList.add('mlg-egg-flash');
        setTimeout(() => mark.classList.remove('mlg-egg-flash'), 1600);
      }
      spawnConfetti(mark);
      playChime();
    }

    function spawnConfetti(originEl) {
      let originX = window.innerWidth - 60;
      let originY = window.innerHeight - 60;
      if (originEl) {
        const r = originEl.getBoundingClientRect();
        originX = r.left + r.width / 2;
        originY = r.top + r.height / 2;
      }
      const count = 36;
      const colors = ['#ffffff', '#ffffff', '#B50034']; // 2 white, 1 red — matches the mark
      for (let i = 0; i < count; i++) {
        const piece = document.createElement('span');
        piece.className = 'mlg-confetti';
        const angle = (Math.random() * Math.PI) - Math.PI; // upper hemisphere
        const speed = 8 + Math.random() * 10;
        const dx = Math.cos(angle) * speed * 18 + (Math.random() - 0.5) * 80;
        const dy = Math.sin(angle) * speed * 18 - 100 - Math.random() * 200;
        const rot = (Math.random() * 720 - 360) + 'deg';
        const dur = 1100 + Math.random() * 800;
        const size = 8 + Math.random() * 10;
        const color = colors[i % colors.length];
        piece.style.cssText =
          `left:${originX}px;top:${originY}px;` +
          `width:${size}px;height:${size}px;` +
          `--dx:${dx}px;--dy:${dy}px;--rot:${rot};--dur:${dur}ms;` +
          `background:${color};`;
        document.body.appendChild(piece);
        setTimeout(() => piece.remove(), dur + 100);
      }
    }

    function playChime() {
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        const ctx = new Ctx();
        const notes = [880, 1108.73, 1318.51]; // A5, C#6, E6 — soft A-major chord
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.06);
          gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + i * 0.06 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.06 + 0.9);
          osc.connect(gain).connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.06);
          osc.stop(ctx.currentTime + i * 0.06 + 0.95);
        });
        setTimeout(() => ctx.close(), 1500);
      } catch (e) { /* silent fail */ }
    }
  })();

  // Team slide — tab switching
  const regionFilter = document.querySelector('.region-filter');

  function applyRegion(region) {
    $$('.region-btn').forEach((b) => b.classList.toggle('is-active', b.dataset.region === region));
    $$('.team-grid--associates .member').forEach((m) => {
      m.hidden = region !== 'all' && m.dataset.region !== region;
    });
  }

  $$('.team-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      $$('.team-tab').forEach((t) => t.classList.toggle('is-active', t === tab));
      $$('.team-grid').forEach((g) => {
        g.hidden = g.dataset.pane !== target;
      });
      if (regionFilter) {
        regionFilter.hidden = target !== 'associates';
        if (target === 'associates') applyRegion('all');
      }
      // Sync body height after grid change (associates grid is large)
      setTimeout(syncHeight, 50);
    });
  });

  $$('.region-btn').forEach((btn) => {
    btn.addEventListener('click', () => applyRegion(btn.dataset.region));
  });

  function onGrab(e) {
    /* On a mouse/pen, clicking a chip should select it (no drag). On touch,
       the chips cover most of the visible globe, so always allow drag and
       use a movement threshold to suppress the chip tap if it became a drag. */
    if (e.pointerType !== 'touch' && e.target && e.target.closest('.chip')) return;
    e.preventDefault();
    isAuto = false;
    globeStage.classList.add('is-dragging');
    dragG = { x: e.clientX, y: e.clientY, rx: rotX, ry: rotY, t: performance.now(), lx: e.clientX, id: e.pointerId, moved: 0 };
    try { globeStage.setPointerCapture(e.pointerId); } catch (_) {}
    document.addEventListener('pointermove', onDragG, { passive: false });
    document.addEventListener('pointerup',     onRelease, { once: true });
    document.addEventListener('pointercancel', onRelease, { once: true });
  }
  function onDragG(e) {
    if (!dragG) return;
    if (e.pointerId !== dragG.id) return;
    e.preventDefault();
    const dx = e.clientX - dragG.x;
    const dy = e.clientY - dragG.y;
    dragG.moved = Math.max(dragG.moved, Math.hypot(dx, dy));
    rotY = dragG.ry + dx * 0.5;
    rotX = clamp(dragG.rx - dy * 0.3, -55, 55);
    const now = performance.now();
    if (now - dragG.t > 16) {
      velY = (e.clientX - dragG.lx) * 0.04;
      dragG.t = now; dragG.lx = e.clientX;
    }
  }
  function onRelease() {
    if (dragG) {
      try { globeStage.releasePointerCapture(dragG.id); } catch (_) {}
      /* Suppress the subsequent chip click if this was actually a drag */
      if (dragG.moved > 5) {
        const suppress = (ev) => { ev.stopPropagation(); ev.preventDefault(); };
        globeStage.addEventListener('click', suppress, { capture: true, once: true });
        /* Some browsers don't fire click after capture/release — clear it next tick */
        setTimeout(() => {
          globeStage.removeEventListener('click', suppress, { capture: true });
        }, 50);
      }
    }
    dragG = null;
    globeStage.classList.remove('is-dragging');
    document.removeEventListener('pointermove', onDragG);
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  let chipsPlaced = false;
  /* Skip per-frame globe work when the globe slide isn't on screen.
     Updated via IntersectionObserver below (~30× cheaper at idle). */
  let globeInView = false;
  if (globeStage && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      globeInView = entries[0].isIntersecting;
    }, { threshold: 0 });
    io.observe(globeStage);
  } else {
    globeInView = true;
  }

  function tickGlobe() {
    if (built && globeInView) {
      if (radius === 0 && globeStage.clientWidth > 0) {
        radius = Math.min(globeStage.clientWidth, globeStage.clientHeight) / 2 * 0.92;
      }
      if (isAuto) {
        rotY += 0.18;
      } else {
        rotY += velY;
        velY *= 0.94;
        if (Math.abs(velY) < 0.004) {
          velY = 0;
          if (!dragG) isAuto = true;
        }
      }

      globeEl.style.transform = `rotateY(${rotY}deg) rotateX(${rotX}deg)`;

      if (!chipsPlaced) {
        for (const c of chips) {
          c.el.style.left = '50%';
          c.el.style.top  = '50%';
        }
        chipsPlaced = true;
      }

      const ry = rotY * Math.PI / 180;
      const rx = rotX * Math.PI / 180;
      const cosY = Math.cos(ry), sinY = Math.sin(ry);
      const cosX = Math.cos(rx), sinX = Math.sin(rx);

      for (let i = 0; i < chips.length; i++) {
        const c = chips[i];
        const x1 =  c.x * cosY + c.z * sinY;
        const z1 = -c.x * sinY + c.z * cosY;
        const z2 =  c.y * sinX + z1 * cosX;

        const t  = (z2 + 1) / 2;        // 0 (back) → 1 (front)
        const sc = 0.78 + t * 0.32;     // small at back, full at front

        /* Depth is conveyed by scale + 3D z-position only.
           - Chip opacity stays at 1.0 always (no opacity layer to get stuck).
           - The dimming "veil" is applied to a ::after overlay via a CSS var.
           - No `filter: blur()` anywhere — blur was the source of stuck dark snapshots. */
        c.el.style.transform =
          `translate(-50%, -50%) ` +
          `translate3d(${(c.x * radius).toFixed(2)}px, ${(c.y * radius).toFixed(2)}px, ${(c.z * radius).toFixed(2)}px) ` +
          `rotateX(${(-rotX).toFixed(2)}deg) rotateY(${(-rotY).toFixed(2)}deg) ` +
          `scale(${sc.toFixed(3)})`;

        /* Veil: 0 at front, up to 0.55 at back. Animated via overlay opacity. */
        const veil = ((1 - t) * 0.55).toFixed(3);
        if (c._veil !== veil) {
          c.el.style.setProperty('--chip-veil', veil);
          c._veil = veil;
        }

        c.el.style.zIndex = Math.round(t * 100);
        c.el.style.pointerEvents = t < 0.35 ? 'none' : 'auto';
      }
    }
    requestAnimationFrame(tickGlobe);
  }
  requestAnimationFrame(tickGlobe);
})();

/* ── Testimonials carousel — native scroll-snap with prev/next buttons ── */
(function () {
  const carousel = document.getElementById('testimonialsCarousel');
  const prev     = document.getElementById('testimonialsPrev');
  const next     = document.getElementById('testimonialsNext');
  if (!carousel || !prev || !next) return;

  function step() {
    const card = carousel.querySelector('.testimonial');
    if (!card) return carousel.clientWidth * 0.8;
    // Card width + gap (gap is 20px from CSS)
    return card.getBoundingClientRect().width + 20;
  }

  function updateButtons() {
    const max = carousel.scrollWidth - carousel.clientWidth;
    prev.disabled = carousel.scrollLeft <= 2;
    next.disabled = carousel.scrollLeft >= max - 2;
  }

  prev.addEventListener('click', () => {
    carousel.scrollBy({ left: -step(), behavior: 'smooth' });
  });
  next.addEventListener('click', () => {
    carousel.scrollBy({ left: step(), behavior: 'smooth' });
  });

  carousel.addEventListener('scroll', updateButtons, { passive: true });
  window.addEventListener('resize', updateButtons);

  /* Keyboard navigation */
  carousel.setAttribute('tabindex', '0');
  carousel.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); carousel.scrollBy({ left: -step(), behavior: 'smooth' }); }
    if (e.key === 'ArrowRight') { e.preventDefault(); carousel.scrollBy({ left:  step(), behavior: 'smooth' }); }
  });

  /* Mouse drag-to-scroll for desktop */
  let isDown = false, startX = 0, startScroll = 0;
  carousel.addEventListener('mousedown', (e) => {
    isDown = true;
    startX = e.pageX;
    startScroll = carousel.scrollLeft;
    carousel.style.scrollBehavior = 'auto';
    e.preventDefault();
  });
  document.addEventListener('mouseup', () => {
    if (!isDown) return;
    isDown = false;
    carousel.style.scrollBehavior = 'smooth';
  });
  document.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    carousel.scrollLeft = startScroll - (e.pageX - startX);
  });

  // Initial button state
  updateButtons();

  /* ── Auto-advance — moves through cards every 4s, stops on any
     user interaction (drag, click, keyboard, wheel, touch). */
  let autoTimer = null;
  let userInteracted = false;
  function stopAuto() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    userInteracted = true;
  }
  function startAuto() {
    if (userInteracted || autoTimer) return;
    autoTimer = setInterval(() => {
      const max = carousel.scrollWidth - carousel.clientWidth;
      // Loop back to the start once we hit the end
      if (carousel.scrollLeft >= max - 2) {
        carousel.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        carousel.scrollBy({ left: step(), behavior: 'smooth' });
      }
    }, 4000);
  }
  /* Any of these gestures = user has taken over */
  ['pointerdown', 'wheel', 'keydown', 'touchstart'].forEach((ev) => {
    carousel.addEventListener(ev, stopAuto, { passive: true });
  });
  prev.addEventListener('click', stopAuto);
  next.addEventListener('click', stopAuto);
  /* Start auto-scroll once the carousel scrolls into view */
  const autoObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) startAuto();
    });
  }, { threshold: 0.3 });
  autoObserver.observe(carousel);
})();

/* ── Tailor / Contact multi-step form ── */
(function () {
  const form = document.getElementById('tailorForm');
  if (!form) return;

  const steps     = Array.from(form.querySelectorAll('.tf__step'));
  const fillEl    = document.getElementById('tailorFill');
  const DONE_IDX  = steps.length - 1;   // last step is the "thank you" screen
  let current     = 0;
  const answers   = {};

  /* ── Progress bar ── */
  function setProgress(idx) {
    if (!fillEl) return;
    const pct = Math.round((idx / DONE_IDX) * 100);
    fillEl.style.width = Math.min(pct, 100) + '%';
  }

  /* ── Show a step ── */
  function showStep(idx) {
    steps.forEach((s, i) => s.classList.toggle('is-active', i === idx));
    current = idx;
    setProgress(idx);
    // Focus first interactive element
    const el = steps[idx].querySelector('input, textarea, .tf__choice');
    if (el) setTimeout(() => el.focus(), 60);
  }

  /* ── Validation ── */
  function validate(step) {
    if (!step.dataset.required) return true;
    if (step.querySelector('.tf__choices')) {
      return !!step.querySelector('.tf__choice.is-selected');
    }
    const input = step.querySelector('input, textarea');
    if (!input) return true;
    const val = input.value.trim();
    if (!val) return false;
    if (step.dataset.type === 'email') {
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      const err = step.querySelector('.tf__error');
      if (err) err.hidden = ok;
      return ok;
    }
    return true;
  }

  /* ── Collect current step's value into answers ── */
  function collect(step) {
    const field = step.dataset.field;
    if (!field) return;
    const sel = step.querySelector('.tf__choice.is-selected');
    if (sel) { answers[field] = sel.dataset.value; return; }
    const inp = step.querySelector('input, textarea');
    if (inp) answers[field] = inp.value.trim();
  }

  /* ── Advance ── */
  function advance() {
    const step = steps[current];
    if (!validate(step)) {
      step.classList.add('is-shake');
      setTimeout(() => step.classList.remove('is-shake'), 500);
      return;
    }
    collect(step);
    // After the last question, submit automatically
    if (current + 1 >= DONE_IDX) { submitForm(); }
    else { showStep(current + 1); }
  }

  /* ── Submit ── */
  function submitForm() {
    const step = steps[current];
    collect(step);
    /* Send the answers to MLG's backend (configure the endpoint below).
       The mailto only opens the user's mail client with subject + recipient. */
    storeAnswers('tailor', answers);
    openMailto('info@munichleadership.com', 'Interested in MLG Services');
    showStep(DONE_IDX);
    // After a moment on the thank-you screen, scroll to Services (slide 5)
    setTimeout(() => {
      if (typeof window.__mlgScrollTo === 'function') window.__mlgScrollTo(5);
    }, 1800);
  }

  /* ── Event delegation ── */
  form.addEventListener('click', (e) => {
    // Choice button
    const choice = e.target.closest('.tf__choice');
    if (choice) {
      const step = choice.closest('.tf__step');
      step.querySelectorAll('.tf__choice').forEach(c => c.classList.remove('is-selected'));
      choice.classList.add('is-selected');
      /* Special case: "I want to learn about MLG in general" — don't advance
         the form, scroll the page down to the Clients (globe) slide instead. */
      if (choice.dataset.value === 'general') {
        const clients = document.querySelector('.slide[data-title="Clients"]');
        if (clients) {
          setTimeout(() => {
            window.scrollTo({ top: clients.offsetTop, behavior: 'smooth' });
          }, 280);
          return;
        }
      }
      setTimeout(advance, 280);  // brief pause so user sees the selection
      return;
    }
    // Action buttons
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'next')   advance();
    if (action === 'back')   showStep(Math.max(0, current - 1));
    if (action === 'submit') submitForm();
  });

  // Enter key advances / submits
  form.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const step = steps[current];
    if (step.querySelector('[data-action="submit"]')) { e.preventDefault(); submitForm(); }
    else if (!step.querySelector('.tf__choices'))     { e.preventDefault(); advance(); }
  });

  showStep(0);
})();

/* ── Contact multi-step form ── */
(function () {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const steps    = Array.from(form.querySelectorAll('.tf__step'));
  const fillEl   = document.getElementById('tfFill');
  const DONE_IDX = steps.length - 1;
  let current    = 0;
  const answers  = {};

  function setProgress(idx) {
    if (!fillEl) return;
    const pct = Math.round((idx / DONE_IDX) * 100);
    fillEl.style.width = Math.min(pct, 100) + '%';
  }

  function showStep(idx) {
    steps.forEach((s, i) => s.classList.toggle('is-active', i === idx));
    current = idx;
    setProgress(idx);
    const el = steps[idx].querySelector('input, textarea, .tf__choice');
    if (el) setTimeout(() => el.focus(), 60);
  }

  function validate(step) {
    if (!step.dataset.required) return true;
    if (step.querySelector('.tf__choices')) {
      return !!step.querySelector('.tf__choice.is-selected');
    }
    const input = step.querySelector('input, textarea');
    if (!input) return true;
    const val = input.value.trim();
    if (!val) return false;
    if (step.dataset.type === 'email') {
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      const err = step.querySelector('.tf__error');
      if (err) err.hidden = ok;
      return ok;
    }
    return true;
  }

  function collect(step) {
    const field = step.dataset.field;
    if (!field) return;
    const sel = step.querySelector('.tf__choice.is-selected');
    if (sel) { answers[field] = sel.dataset.value; return; }
    const inp = step.querySelector('input, textarea');
    if (inp) answers[field] = inp.value.trim();
  }

  function advance() {
    const step = steps[current];
    if (!validate(step)) {
      step.classList.add('is-shake');
      setTimeout(() => step.classList.remove('is-shake'), 500);
      return;
    }
    collect(step);
    showStep(current + 1);
  }

  function submitForm() {
    const step = steps[current];
    collect(step);
    /* Send answers to MLG's backend; mailto only opens with subject + recipient. */
    storeAnswers('contact', answers);
    openMailto('info@munichleadership.com', 'Interested in MLG Services');
    showStep(DONE_IDX);
  }

  form.addEventListener('click', (e) => {
    const choice = e.target.closest('.tf__choice');
    if (choice) {
      const step = choice.closest('.tf__step');
      step.querySelectorAll('.tf__choice').forEach(c => c.classList.remove('is-selected'));
      choice.classList.add('is-selected');
      setTimeout(advance, 280);
      return;
    }
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'next')   advance();
    if (action === 'back')   showStep(Math.max(0, current - 1));
    if (action === 'submit') submitForm();
  });

  form.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const step = steps[current];
    if (step.querySelector('[data-action="submit"]')) { e.preventDefault(); submitForm(); }
    else if (!step.querySelector('.tf__choices'))     { e.preventDefault(); advance(); }
  });

  showStep(0);
})();

/* ── Language switcher ──────────────────────────────────────────── */
(function () {
  function applyLang(lang) {
    document.documentElement.lang = lang;
    localStorage.setItem('mlg-lang', lang);
    document.querySelectorAll('.lang-switch__btn').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.dataset.lang === lang);
    });
    // Swap any elements that have data-en / data-de translations
    document.querySelectorAll('[data-en][data-de]').forEach(function (el) {
      el.textContent = lang === 'de' ? el.dataset.de : el.dataset.en;
    });
  }

  function initLangSwitch() {
    var saved = localStorage.getItem('mlg-lang') || 'en';
    applyLang(saved);
    document.querySelectorAll('.lang-switch__btn').forEach(function (btn) {
      btn.addEventListener('click', function () { applyLang(btn.dataset.lang); });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLangSwitch);
  } else {
    initLangSwitch();
  }
})();

