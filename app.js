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
  /* Slide-to-start (or the 5s auto-advance) leaves the intro logo screen and
     drops the "pick your dream" bubbles on top of the hero, which becomes
     the base layer underneath (game-on pins it + hides the deck chrome;
     enterDeck later dissolves the overlay to reveal the site). */
  function startExperience() {
    if (experienceStarted) return;
    experienceStarted = true;
    clearTimeout(introAutoAdvance);
    intro.classList.add('is-leaving');
    setTimeout(() => { intro.style.display = 'none'; }, 1100);
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    document.documentElement.classList.add('game-on');
    deck.classList.add('is-on');
    deck.setAttribute('aria-hidden', 'false');
    excuses.classList.add('is-on');
    excuses.setAttribute('aria-hidden', 'false');
    /* Wait for a real layout before scattering the chips (app.min.js is
       deferred and can run before the stylesheet applies → field measures
       0×0 → chips bunch in a corner). */
    (function buildWhenSized() {
      if (excusesField.clientWidth > 0 && excusesField.clientHeight > 0) {
        buildExcuses();
      } else {
        requestAnimationFrame(buildWhenSized);
      }
    })();
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
    // Drop the first-screen game overlay: the hero underneath is already
    // painted, so removing these classes dissolves the overlay to reveal it
    // and fades the deck chrome (topbar / rail / mark) back in.
    document.documentElement.classList.remove('game-on', 'first-screen');
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
  const EXCUSES_ALL = [
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
  const EXCUSES_ALL_DE = [
    "Ich arbeite im besten aller Teams",
    "Unsere Entscheidungen sind sicher, fundiert und schnell",
    "Wir gewinnen die klügsten Talente",
    "Ich bin der beste Chef aller Zeiten",
    "Unsere Unternehmenskultur fördert Höchstleistungen",
    "Wir sind Führungspersönlichkeiten und Vorbilder",
    "Wir sind eine lernende Organisation",
    "Die Konkurrenz beneidet uns",
    "Wir sind ein erfolgreiches, neugieriges und innovatives Team",
    "Ich bin stolz auf mein Unternehmen",
    "Ich bin eine authentische Führungskraft mit natürlicher Autorität",
    "Wir geben uns ehrliches Feedback",
  ];
  /* On phones the field is too small to fit all 12 chips comfortably —
     drop the longest / lowest-priority ones so the rest can breathe,
     and shorten a couple more so they wrap better. */
  const EXCUSES_MOBILE_HIDE = new Set([
    "I am working in the best of all teams",
    "We are leaders and role models",
    "I am an authentic leader with natural authority",
    "We give each other candid feedback",
  ]);
  const EXCUSES_MOBILE_HIDE_DE = new Set([
    "Ich arbeite im besten aller Teams",
    "Wir sind Führungspersönlichkeiten und Vorbilder",
    "Ich bin eine authentische Führungskraft mit natürlicher Autorität",
    "Wir geben uns ehrliches Feedback",
  ]);
  const EXCUSES_MOBILE_REWRITE = {
    "We are a winning team, curious and innovative": "We are a winning team",
    "Our company culture fosters best performance": "Our culture fosters best performance",
  };
  const EXCUSES_MOBILE_REWRITE_DE = {
    "Wir sind ein erfolgreiches, neugieriges und innovatives Team": "Wir sind ein Siegerteam",
    "Unsere Unternehmenskultur fördert Höchstleistungen": "Unsere Kultur fördert Höchstleistungen",
  };
  const isMobileExcuse = window.matchMedia && window.matchMedia('(max-width: 640px)').matches;
  function getExcuses() {
    const de = document.documentElement.lang === 'de';
    const all    = de ? EXCUSES_ALL_DE          : EXCUSES_ALL;
    const hide   = de ? EXCUSES_MOBILE_HIDE_DE  : EXCUSES_MOBILE_HIDE;
    const rewrite = de ? EXCUSES_MOBILE_REWRITE_DE : EXCUSES_MOBILE_REWRITE;
    return isMobileExcuse
      ? all.filter((t) => !hide.has(t)).map((t) => rewrite[t] || t)
      : all;
  }

  let chipsState = [];
  let chipsRAF = null;
  let chipsCleared = 0;
  let revealed = false;

  function buildExcuses() {
    if (chipsState.length) return;
    measureField();
    const W = fieldW;
    const H = fieldH;

    getExcuses().forEach((text, i) => {
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

  /* Field size is measured once (and on resize) instead of inside the rAF
     loop. Reading clientWidth/Height every frame forced a layout flush on
     each tick, which is what made the chips stutter on slower phones. */
  let fieldW = 0, fieldH = 0;
  function measureField() {
    fieldW = excusesField.clientWidth;
    fieldH = excusesField.clientHeight;
  }
  window.addEventListener('resize', measureField);

  function driftChips() {
    if (revealed) return;
    const W = fieldW, H = fieldH;

    for (const c of chipsState) {
      if (c.dead) continue;
      c.x += c.vx;
      c.y += c.vy;
      if (c.x <= 0)            { c.x = 0;            c.vx = Math.abs(c.vx); }
      if (c.y <= 0)            { c.y = 0;            c.vy = Math.abs(c.vy); }
      if (c.x + c.w >= W)      { c.x = W - c.w;      c.vx = -Math.abs(c.vx); }
      if (c.y + c.h >= H)      { c.y = H - c.h;      c.vy = -Math.abs(c.vy); }
      /* Sub-pixel on purpose: the chips drift at well under 1px/frame, so
         rounding to whole pixels makes them sit still then jump a pixel —
         visible stepping. The chip is its own compositor layer (will-change),
         so the GPU interpolates fractional offsets smoothly. */
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

  function rebuildBubbles() {
    if (revealed) return;
    if (chipsRAF) { cancelAnimationFrame(chipsRAF); chipsRAF = null; }
    chipsState = [];
    chipsCleared = 0;
    excusesField.innerHTML = '';
    buildExcuses();
  }
  window.MLG = Object.assign(window.MLG || {}, { rebuildBubbles });

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
  /* Cached layout metrics — re-read only when layout actually changes,
     not per frame. Reading document.body.scrollHeight / window.innerHeight
     per frame forces a synchronous reflow on mobile and is a major source
     of scroll jank. We refresh them on resize, sync events, and image
     load (where they can legitimately change). */
  let cachedVH = window.innerHeight || 800;
  let cachedMaxScroll = 1;
  function refreshScrollMetrics() {
    cachedVH = window.innerHeight || 800;
    cachedMaxScroll = Math.max(1, document.body.scrollHeight - cachedVH);
  }

  /* Mobile scroll-jitter fix: the per-frame transform that tracks native
     scroll must stay at 60fps, but the read-heavy updates (nav highlight,
     in-view + reveal triggers) call getBoundingClientRect right after the
     transform write — forcing a synchronous reflow every frame. On touch
     devices we run those every 3rd frame instead, cutting forced reflows
     ~66% during scroll while the slide transform stays buttery. */
  const TOUCH = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || window.innerWidth <= 640;
  let tickFrame = 0;

  function syncHeight() {
    // On touch/mobile we scroll natively (see "NATIVE SCROLL ON MOBILE" in
    // styles.css): the deck flows in normal document order, so the body's
    // natural height already drives the scrollbar. Locking body height to a
    // snapshot of slidesEl.scrollHeight is what caused black gaps when the
    // mobile address bar resized the viewport — so skip it on touch and let
    // the content define its own height.
    if (!TOUCH) {
      // Set body height = slides content height so the native scrollbar is real
      document.body.style.height = slidesEl.scrollHeight + 'px';
    } else if (document.body.style.height) {
      document.body.style.height = '';
    }
    // Slide offsets shift when the content height changes — refresh cache
    if (typeof recomputeSlideOffsets === 'function') recomputeSlideOffsets();
    refreshScrollMetrics();
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
  const topbarEl = document.querySelector('.topbar');

  /* Drive the topbar's past-hero (visible glass header) state straight
     off the REAL scroll position. On mobile the smooth-scroll lerp's
     scrollCurrent can lag window.scrollY — most visibly on a cold
     deep-link (#slide=N): you land on a content slide but the header
     stays in its hero look until you scroll. Reading window.scrollY
     here (cheap, no layout flush) keeps the header correct the instant
     you jump. Call it on every jump and on scroll. */
  function syncTopbar() {
    if (!topbarEl) return;
    const pos = TOUCH ? window.scrollY : scrollCurrent;
    const want = pos >= (cachedVH || window.innerHeight) * 0.5;
    if (topbarEl.classList.contains('topbar--past-hero') !== want) {
      topbarEl.classList.toggle('topbar--past-hero', want);
    }
  }
  if (TOUCH) window.addEventListener('scroll', syncTopbar, { passive: true });

  /* Resize listener — debounced via rAF */
  let resizeRaf = 0;
  window.addEventListener('resize', () => {
    if (resizeRaf) return;
    resizeRaf = requestAnimationFrame(() => {
      lastTickScroll = -1;          // force tickSmooth to recompute
      resizeRaf = 0;
    });
  });

  /* Section-sticky helpers — each <div class="section-sticky"> has a
     data-section selector that points at the in-slide section it tracks.
     Cached on init for perf — we re-resolve target lazily. */
  const sectionStickies = Array.from(document.querySelectorAll('.section-sticky'))
    .map((el) => ({ el, sel: el.dataset.section, target: null, _opacity: -1, _transform: '' }));
  function updateSectionStickies() {
    /* Section stickies are disabled: the fixed-background parallax
       (position:fixed + a per-frame JS transform) flickered and lagged on
       iOS momentum scroll. Each section now shows its own in-flow image
       (see styles.css) that scrolls natively. Keep the sticky elements
       hidden and skip the per-frame getBoundingClientRect entirely. */
    sectionStickies.forEach((s) => {
      if (s._opacity !== 0) { s.el.style.opacity = 0; s._opacity = 0; }
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
    /* NB: lastTickScroll is deliberately NOT recorded here — see the doHeavy
       gate below. Marking the position processed at this point strands the
       heavy work whenever the frame that reaches here isn't a heavy frame. */

    /* translate3d (instead of translateY) keeps the slides container on a
       dedicated GPU compositor layer on iOS/Android Safari, so the per-
       frame transform becomes a pure compositor update (no paint, no
       layout). Significantly reduces scroll jitter on mobile.

       On touch/mobile we DON'T hijack: the deck flows and the browser
       scrolls it natively (see "NATIVE SCROLL ON MOBILE" in styles.css),
       so writing this transform would double-move the slides. Skip it
       and clear any stale transform left from a desktop→mobile resize.
       scrollCurrent still tracks window.scrollY, so the remaining
       scroll-driven effects below (nav, rail, reveal, in-view) keep
       working off the real native scroll position. */
    if (!TOUCH) {
      slidesEl.style.transform = `translate3d(0, ${-scrollCurrent}px, 0)`;
    } else if (slidesEl.style.transform) {
      slidesEl.style.transform = '';
    }

    const vh = cachedVH;
    tickFrame++;
    const doHeavy = !TOUCH || (tickFrame % 3 === 0);

    /* Only now is this scroll position genuinely "processed", so only now may
       we record it for the early-out above. Recording it before this gate was
       a real bug: on touch doHeavy is true just one frame in three, so after
       an instant jump (anchor link, nav jump, deep link) the single frame that
       cleared the early-out was a light frame two times in three. It recorded
       the position anyway, the scroll then never moved again, and every later
       frame bailed at the early-out — so updateInView()/updateActiveNav() never
       ran for the section you landed on. Its images stayed parked in their
       entrance-animation start state until you nudged the page and unstuck the
       loop. Deferring the record costs at most two extra light frames after
       motion stops, and the loop still idles out immediately afterwards. */
    if (doHeavy) lastTickScroll = scrollCurrent;

    /* Section stickies (challenges, why-mlg) on mobile — must run EVERY
       frame, not on the doHeavy throttle. Native scroll runs at 60fps+
       on touch; if the sticky's transform updates only every 3rd frame
       (~20fps) the user sees the image jitter strongly while the rest
       of the page scrolls smoothly. The cost is small: one
       getBoundingClientRect read + one transform/opacity write per
       sticky (2 stickies total). Both stickies are on their own
       compositor layer via will-change, so the writes are GPU-only. */
    updateSectionStickies();

    /* Hero sticky: stays in place during slides 0+1, then scrolls up
       on the slide 1→2 transition, then disappears. Skip entirely once
       past slide 2 (writes a no-op every frame otherwise). */
    if (heroSticky && scrollCurrent < 2.1 * vh) {
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
      heroSticky.style.transform = `translate3d(0, ${translate}px, 0)`;
      heroSticky.style.opacity = opacity;
    }

    /* Scroll-driven hero logo: shrinks from heroMaxScale → 1× as the
       user scrolls through the first 35 % of slide 0. Once past the
       transition point, the logo is locked at 1× — stop writing the CSS
       var every frame (was a constant style invalidation while scrolling
       through slides 2+). past-hero class toggle is idempotent. */
    syncTopbar();

    // Rail progress — uses CACHED maxScroll (refreshed on resize/syncHeight)
    // so we no longer read document.body.scrollHeight per frame.
    if (railFill) {
      railFill.style.height = `${Math.min(100, (scrollCurrent / cachedMaxScroll) * 100)}%`;
    }

    if (doHeavy) {
      // Active nav highlight
      updateActiveNav();

      // Trigger is-in-view for image entrance animations
      updateInView();

      // Scroll-driven reveal
      if (revealEls.length) {
        revealEls = revealEls.filter((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.top < vh * 0.88) {
            el.classList.add('is-visible');
            return false;
          }
          return true;
        });
      }
    }

    requestAnimationFrame(tickSmooth);
  }

  /* =====================================================
     Navigation
     ===================================================== */
  const serviceLinks = [
    { label: 'Leadership Development',  de: 'Führungskräfteentwicklung',  href: 'leadership-development.html' },
    { label: 'Coaching & Sparring',     de: 'Coaching & Sparring',        href: 'coaching-sparring.html' },
    { label: 'Audits & Assessments',    de: 'Audits & Assessments',       href: 'audits-assessments.html' },
    { label: 'Cultural Transformation', de: 'Kulturelle Transformation',   href: 'cultural-transformation.html' },
  ];

  /* Build the top nav in a FIXED order that mirrors the actual deck
     slide order (Welcome → Services → Clients → Approach → … →
     Contact). Keep in sync with subnav.js. */
  const NAV_ORDER = [
    'Services',
    'Clients',
    'Approach',
    'Why MLG',
    'Team',
    'Book',
    'FAQ',
    'Contact',
  ];
  // FAQ is a standalone page, not a slide — rendered as a plain link by
  // both nav builders below (it has no titleIndex entry).
  const PAGE_LINKS = { 'FAQ': 'faq.html' };
  // German labels for the nav titles. Keys stay English (they double as the
  // slide.dataset.title lookup); only the displayed text is localized. The
  // language switcher swaps each generated element via its data-de attribute.
  const NAV_DE = {
    'Services': 'Leistungen',
    'Clients':  'Kunden',
    'Approach': 'Ansatz',
    'Why MLG':  'Warum MLG',
    'Team':     'Team',
    'Book':     'Buch',
    'FAQ':      'FAQ',
    'Contact':  'Kontakt',
  };

  if (slideNav) {
    slideNav.innerHTML = '';
    // Build a title → index lookup from the actual slides in the DOM
    const titleIndex = {};
    slides.forEach((slide, i) => {
      const t = slide.dataset.title;
      if (t && !(t in titleIndex)) titleIndex[t] = i;
    });

    NAV_ORDER.forEach((title) => {
      if (PAGE_LINKS[title]) {
        const a = document.createElement('a');
        a.className = 'slide-nav__btn';
        a.href = PAGE_LINKS[title];
        a.textContent = title;
        if (NAV_DE[title]) a.dataset.de = NAV_DE[title];
        slideNav.appendChild(a);
        return;
      }
      const i = titleIndex[title];
      if (i === undefined) return;  // slide not present on this page

      if (title === 'Services') {
        const wrap = document.createElement('div');
        wrap.className = 'slide-nav__dropdown-wrap';

        const btn = document.createElement('a');
        btn.className = 'slide-nav__btn slide-nav__btn--has-drop';
        btn.href = '#';
        btn.dataset.slideIdx = i;
        btn.innerHTML = `<span data-de="${NAV_DE[title] || title}">${title}</span><svg class="slide-nav__chevron" viewBox="0 0 10 6" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 1l4 4 4-4"/></svg>`;
        btn.addEventListener('click', (e) => { e.preventDefault(); scrollToSlide(i); });

        const drop = document.createElement('div');
        drop.className = 'slide-nav__dropdown';
        serviceLinks.forEach(({ label, de, href }) => {
          const a = document.createElement('a');
          a.className = 'slide-nav__dropdown-item';
          a.href = href;
          a.textContent = label;
          if (de) a.dataset.de = de;
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
        if (NAV_DE[title]) btn.dataset.de = NAV_DE[title];
        btn.addEventListener('click', () => scrollToSlide(i));
        slideNav.appendChild(btn);
      }
    });
    const navLi = document.createElement('a');
    navLi.className = 'slide-nav__btn slide-nav__linkedin';
    navLi.href = 'https://www.linkedin.com/company/munich-leadership-group/';
    navLi.target = '_blank';
    navLi.rel = 'noopener';
    navLi.setAttribute('aria-label', 'MLG on LinkedIn');
    navLi.style.display = 'inline-flex';
    navLi.style.alignItems = 'center';
    navLi.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.55C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/></svg>';
    slideNav.appendChild(navLi);
  }

  /* Compute the Y position to scroll to when jumping to a slide. On
     mobile (native scroll, see "NATIVE SCROLL ON MOBILE" in
     styles.css) the .topbar is position:fixed and 70-90 px tall, so
     scrolling to the raw slide.offsetTop puts the slide's top edge
     UNDER the topbar — visibly clipped. Subtract the topbar height
     so the slide lands flush below it. Desktop uses the hijacked
     scroll (deck:fixed) where the topbar doesn't push into the
     scroll container, so no offset is needed there.

     slide.offsetTop is reliable because calibrateIntrinsicSizes()
     (in recomputeSlideOffsets) pins each slide's contain-intrinsic-size
     to its REAL height, so content-visibility:auto collapses off-screen
     slides to the exact space they render at — no offset drift. */
  function getJumpY(idx) {
    if (idx < 0 || idx >= slides.length) return 0;
    let y = slides[idx].offsetTop;
    if (TOUCH && topbarEl) {
      y = Math.max(0, y - topbarEl.getBoundingClientRect().height);
    }
    return y;
  }

  function scrollToSlide(idx) {
    if (idx < 0 || idx >= slides.length) return;
    const y = getJumpY(idx);
    // Snap both targets so the smooth-scroll lerp doesn't animate the
    // deck through every intermediate slide. The transform is updated
    // on the next tick using these values, and 'instant' on window.scrollTo
    // keeps the native scroll position in sync without a smooth scroll.
    scrollTarget  = y;
    scrollCurrent = y;
    window.scrollTo({ top: y, behavior: 'instant' });
    const vh = window.innerHeight;
    if (topbarEl) {
      topbarEl.classList.toggle('topbar--past-hero', y >= vh * 0.5);
    }
    if (heroSticky) {
      if (y >= 2.1 * vh) {
        heroSticky.style.opacity = '0';
      } else if (y <= vh) {
        heroSticky.style.opacity = '1';
        heroSticky.style.transform = 'translate3d(0,0,0)';
      }
    }
    // On mobile, tickSmooth's early-return guard (lastTickScroll === scrollCurrent)
    // fires immediately after the instant jump and updateInView never runs,
    // leaving the target slide content invisible. Force it synchronously here.
    lastTickScroll = -1;
    updateInView();
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

  /* Calibrate each slide's contain-intrinsic-size to its REAL rendered
     height. The CSS gives every .slide `content-visibility:auto;
     contain-intrinsic-size:100vh` to skip painting off-screen slides.
     But several slides (Vision, Team, Book) are far taller than 100vh,
     so the 100vh placeholder makes them collapse to ~1 viewport while
     off-screen — and every slide BELOW a collapsed tall slide then
     reports a wrong offsetTop. That broke jump buttons + #slide deep
     links (e.g. Feedback landed in black space, miles off target).

     Fix: measure each slide's true height (forcing it momentarily
     visible) and pin contain-intrinsic-size to that height. Now a
     collapsed slide reserves exactly the space it renders at, so
     offsetTop is identical whether the slide is painted or skipped —
     jumps are pixel-accurate AND the paint-skipping perf win is kept.
     Runs only on load / resize / layout-settle, never per frame. */
  function calibrateIntrinsicSizes() {
    // 1. Force every slide to render so offsetHeight is the real height
    //    (a collapsed slide would otherwise report its 100vh placeholder).
    slides.forEach((s) => { s.style.contentVisibility = 'visible'; });
    // 2. Measure (this read flushes layout with all slides rendered).
    const heights = slides.map((s) => s.offsetHeight);
    // 3. Pin the intrinsic size to the measured height, then hand
    //    content-visibility back to the CSS `auto`.
    slides.forEach((s, i) => {
      if (heights[i] > 0) s.style.containIntrinsicSize = heights[i] + 'px';
      s.style.contentVisibility = '';
    });
  }

  /* Cache slide offsets so we don't force a layout on every frame.
     Recompute on resize / images-loaded / when slidesEl height changes. */
  let slideOffsets = [];
  function recomputeSlideOffsets() {
    calibrateIntrinsicSizes();
    slideOffsets = slides.map((s) => ({
      top: s.offsetTop,
      bot: s.offsetTop + s.offsetHeight,
    }));
  }
  // Initial + on resize
  recomputeSlideOffsets();
  window.addEventListener('resize', recomputeSlideOffsets, { passive: true });

  function updateInView() {
    const viewTop    = scrollCurrent - 80;
    const viewBottom = scrollCurrent + window.innerHeight + 80;
    slides.forEach((slide, i) => {
      if (slide.classList.contains('is-in-view')) return;
      const o = slideOffsets[i];
      if (!o) return;
      if (o.bot > viewTop && o.top < viewBottom) slide.classList.add('is-in-view');
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
    { label: 'Leadership Development',  de: 'Führungskräfteentwicklung',  href: 'leadership-development.html' },
    { label: 'Coaching & Sparring',     de: 'Coaching & Sparring',        href: 'coaching-sparring.html' },
    { label: 'Audits & Assessments',    de: 'Audits & Assessments',       href: 'audits-assessments.html' },
    { label: 'Cultural Transformation', de: 'Kulturelle Transformation',   href: 'cultural-transformation.html' },
  ];

  if (burgerBtn && mobileNav) {
    // Build mobile nav in the SAME fixed order as the desktop nav.
    const titleIndex = {};
    slides.forEach((slide, i) => {
      const t = slide.dataset.title;
      if (t && !(t in titleIndex)) titleIndex[t] = i;
    });
    NAV_ORDER.forEach((title) => {
      if (PAGE_LINKS[title]) {
        const a = document.createElement('a');
        a.className = 'mobile-nav__item';
        a.href = PAGE_LINKS[title];
        a.textContent = title;
        if (NAV_DE[title]) a.dataset.de = NAV_DE[title];
        mobileNav.appendChild(a);
        return;
      }
      const i = titleIndex[title];
      if (i === undefined) return;
      const item = document.createElement('button');
      item.className = 'mobile-nav__item';
      item.textContent = title;
      if (NAV_DE[title]) item.dataset.de = NAV_DE[title];
      item.addEventListener('click', () => { closeMobileNav(); scrollToSlide(i); });
      mobileNav.appendChild(item);
      if (title === 'Services') {
        const sub = document.createElement('div');
        sub.className = 'mobile-nav__sub';
        serviceSubLinks.forEach(({ label, de, href }) => {
          const a = document.createElement('a');
          a.className = 'mobile-nav__sub-item';
          a.href = href;
          a.textContent = label;
          if (de) a.dataset.de = de;
          sub.appendChild(a);
        });
        mobileNav.appendChild(sub);
      }
    });
    const mLi = document.createElement('a');
    mLi.className = 'mobile-nav__item';
    mLi.href = 'https://www.linkedin.com/company/munich-leadership-group/';
    mLi.target = '_blank';
    mLi.rel = 'noopener';
    mLi.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true" style="vertical-align:middle;margin-right:10px"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.55C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/></svg>LinkedIn';
    mobileNav.appendChild(mLi);

    function openMobileNav() {
      burgerBtn.classList.add('is-open');
      burgerBtn.setAttribute('aria-expanded', 'true');
      mobileNav.classList.add('is-open');
      mobileNav.setAttribute('aria-hidden', 'false');
      document.body.classList.add('has-mobile-nav-open');
      document.body.style.overflow = 'hidden';
    }
    function closeMobileNav() {
      burgerBtn.classList.remove('is-open');
      burgerBtn.setAttribute('aria-expanded', 'false');
      mobileNav.classList.remove('is-open');
      mobileNav.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('has-mobile-nav-open');
      document.body.style.overflow = '';
    }
    burgerBtn.addEventListener('click', () => {
      mobileNav.classList.contains('is-open') ? closeMobileNav() : openMobileNav();
    });
    // Close on Escape
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMobileNav(); });
  }

  /* Has the visitor taken over scrolling themselves?
     reAnchorToTarget() below re-asserts the deep-link position on a
     600ms/1600ms safety timer to correct for late layout shifts. If the
     visitor has already started scrolling by then, that correction yanks
     them back to the target — which reads as the page "jumping back to
     the hero" a second after you start scrolling down. (Team-page back
     links point at index.html#slide=0, so the hero is the common case.)
     We listen for genuine INPUT rather than the `scroll` event, because
     our own programmatic window.scrollTo fires scroll too and would mark
     itself as user activity. */
  let userTookOverScroll = false;
  ['wheel', 'touchstart', 'touchmove', 'keydown'].forEach((ev) => {
    window.addEventListener(ev, () => { userTookOverScroll = true; },
      { passive: true, once: true });
  });

  // Deep-link: #slide=N or #<name> skips intro and scrolls to the right section.
  // Prefer named anchors (e.g. #services) — they don't drift when slides are
  // reordered. #slide=N is kept for backward-compat with older links.
  function jumpFromHash() {
    const raw = location.hash;
    if (!raw) return false;
    let idx = -1;
    const m = raw.match(/^#slide=(\d+)$/);
    if (m) {
      idx = parseInt(m[1], 10);
    } else {
      const name = raw.replace(/^#/, '');
      const el = name && document.getElementById(name);
      if (el && el.classList.contains('slide')) {
        idx = slides.indexOf(el);
      }
    }
    if (idx < 0) return false;
    idx = Math.max(0, Math.min(slides.length - 1, idx));
    /* We're committing to the deck, so disarm the intro's 5s auto-advance.
       Without this it still fires five seconds after a deep link and runs
       startExperience(), which re-applies `game-on` — pinning the deck to
       the hero, hiding the chrome and locking scroll, so the page looks
       like it lost all its content and stops responding. Any
       index.html#slide=N link (the team pages' back-links, for one) lands
       on exactly this path. */
    experienceStarted = true;
    clearTimeout(introAutoAdvance);
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
      const y = getJumpY(idx);
      scrollTarget  = y;
      scrollCurrent = y;
      window.scrollTo({ top: y, behavior: 'instant' });
      /* Force the past-hero state immediately when deep-linking to a
         non-hero slide. tickSmooth + checkHero both update the class
         on a real scroll event, but the programmatic 'instant' jump
         above does not always fire a scroll listener before the next
         paint — leaving the topbar in its hero state (dark red/black
         logo + transparent menu) for a visible frame on top of the
         dark deep-linked slide. */
      if (idx > 0) {
        const tb = document.querySelector('.topbar');
        if (tb) tb.classList.add('topbar--past-hero');
      }
      startSmoothScroll();
      setTimeout(buildGlobe, 16);
      setTimeout(initReveal, 300);
    });
    /* Coming from a subpage (cold load), the target slide's offsetTop
       can shift after images decode + fonts settle. The initial scroll
       lands at a stale Y (often = 0, i.e. the Welcome slide) before
       layout finalises. Re-anchor on window.load and a couple of safety
       timeouts so the user reliably ends up ON the target slide rather
       than at the hero on first navigation. */
    function reAnchorToTarget() {
      if (!document.body.classList.contains('deck-active')) return;
      // Never fight the visitor: once they have scrolled themselves, the
      // deep-link target is no longer where they want to be.
      if (userTookOverScroll) return;
      syncHeight();
      const yy = getJumpY(idx);
      if (Math.abs(window.scrollY - yy) > 4) {
        scrollTarget  = yy;
        scrollCurrent = yy;
        window.scrollTo({ top: yy, behavior: 'instant' });
      }
      // Re-assert the header state from the (now-settled) real scroll
      // position — on mobile scrollCurrent can still be stale here.
      syncTopbar();
    }
    window.addEventListener('load', reAnchorToTarget, { once: true });
    setTimeout(reAnchorToTarget, 600);
    setTimeout(reAnchorToTarget, 1600);
    history.replaceState(null, '', location.pathname + location.search);
    return true;
  }

  /* Enter the deck immediately at the top (slide 0), skipping the intro
     and the excuses/bubbles screen. Used for returning visitors. */
  function enterDeckDirect() {
    experienceStarted = true;          // block the 5s intro auto-advance
    clearTimeout(introAutoAdvance);
    intro.classList.add('is-leaving');
    intro.style.display = 'none';
    if (excuses) excuses.style.display = 'none';
    deck.classList.add('is-on');
    deck.setAttribute('aria-hidden', 'false');
    document.body.classList.add('deck-active');
    syncHeight();
    requestAnimationFrame(() => {
      syncHeight();
      scrollTarget  = 0;
      scrollCurrent = 0;
      window.scrollTo({ top: 0, behavior: 'instant' });
      startSmoothScroll();
      setTimeout(buildGlobe, 16);
      setTimeout(initReveal, 300);
    });
  }

  /* First-visit gate: the intro (logo + slide-to-start) → bubbles flow is
     shown only to first-time visitors. Returning visitors (flag in
     localStorage) go straight to the website. The flag is set on every load
     so any subsequent visit — including reloads — skips the intro. */
  const VISITED_KEY = 'mlg.visited';
  let hasVisited = false;
  try { hasVisited = localStorage.getItem(VISITED_KEY) === '1'; } catch (e) {}
  try { localStorage.setItem(VISITED_KEY, '1'); } catch (e) {}

  if (!jumpFromHash()) {
    if (hasVisited) enterDeckDirect();
    // first-time visitor → the intro (logo + slide-to-start) shows by
    // default; the slider / 5s auto-advance drive startExperience() →
    // dreams bubbles over the hero → enterDeck().
  }

  // "Straight to website" button
  const websiteCtaBtn = document.querySelector('.website-cta');
  if (websiteCtaBtn) {
    websiteCtaBtn.addEventListener('click', (e) => {
      e.preventDefault();
      document.documentElement.classList.remove('game-on', 'first-screen');
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
    { name: 'Microsoft',        logo: 'microsoft.png',           services: ['Leadership Development', 'Team Development', 'Coaching'],                                          meta: 'If you are looking for ambitious, future-oriented leadership experts who understand your market, your culture and your leaders, contact MLG. We can highly recommend MLG as a partner of choice!' },
    { name: 'BMW Group',        logo: 'bmw.png',                 services: ['Leadership Development', 'Coaching', 'Team Development', 'Keynotes'],            meta: 'We collaborate with the MLG on different leadership projects and cultural initiatives. They deliver excellent work! MLG enjoys a great reputation at Munich RE.' },
    { name: 'Munich Re',        logo: 'munich-re.png',           services: ['Team Development', 'Team Workshops on Diagnostics'],                                             meta: 'We collaborate with the MLG on different leadership projects and cultural initiatives. They deliver excellent work! MLG enjoys a great reputation at Munich RE.' },
    { name: 'Bayer',            logo: 'bayer.png',               services: ['Leadership Development', 'Management Days', 'Coaching', 'Team Development', 'Keynotes'], meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Hannover Re',      logo: 'hannover-re.png',         services: ['Leadership Development', 'Coaching'],                                                             meta: 'For our Top Leadership Program, MLG is our partner of choice. The collaboration with the experts from MLG is amazing — they definitely go the extra mile!' },
    { name: 'Strabag',          logo: 'strabag.png',             services: ['Leadership Development', 'Team Development', 'Coaching'],                                         meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'BCG',              logo: 'bcg.png',                 services: ['Leadership Development', 'Coaching'],                                                             meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Knorr-Bremse',    logo: 'knorr-bremse.png',        services: ['Team Development', 'Coaching'],                                                                   meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'KUKA',             logo: 'kuka.png',                services: ['Leadership Development', 'Team Development', 'Coaching'],                                         meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'ADAC',             logo: 'adac.png',                services: ['Workshops', 'Leadership Development'],                                                            meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Montblanc',        logo: 'montblanc.png',           services: ['Cultural Transformation', 'Leadership Development', 'Team Development', 'Coaching'],             meta: 'MLG supported our ExCo to discover and align on the most relevant future leadership topics. Together with MLG, we fostered discussions on these topics on all leadership levels within Montblanc. We co-designed and deployed a process that ignited curiosity and movement within Montblanc. I can highly recommend working with MLG.' },
    { name: 'ZEISS',            logo: 'zeiss.png',               services: ['Learning Journeys'],                                                                             meta: 'MLG designed and delivered a tailor-made Learning Journey for leaders at ZEISS.' },
    { name: 'FC Bayern',        logo: 'fc-bayern.png',           services: ['Team Development', 'Coaching'],                                                                   meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Isar Aerospace',   logo: 'isar-aerospace.png',      services: ['Team Development', 'Coaching'],                                                                   meta: 'We are a fast growing company in a very dynamic, future-oriented market environment. We need speed, innovative ideas and directly applicable leadership concepts — MLG is our partner of choice.' },
    { name: 'Rohde & Schwarz',  logo: 'rohde-schwarz.png',       services: ['Leadership Development', 'Team Development', 'Coaching'],                                         meta: 'MLG trains our talents in Singapore and Germany to become ready for new leadership roles as soon as possible. While the participants celebrate the facilitators and the great learning atmosphere, the performance improvements are remarkable.' },
    { name: 'Osram',            logo: 'osram.png',               services: ['Team Development', 'Coaching'],                                                                   meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Walt Disney',      logo: 'walt-disney.png',         services: ['Team Development', 'Coaching'],                                                                   meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Villeroy & Boch',  logo: 'villeroy-boch.png',       services: ['Management Audits', 'Coaching', 'Team Development'],                                             meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Wella',            logo: 'wella.png',               services: ['Team Development', 'Coaching'],                                                                   meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Bilfinger',        logo: 'bilfinger.png',           services: ['Leadership Development', 'Coaching', 'Team Development', 'Management Audits'],                   meta: 'We are collaborating on top level with the MLG coaches — where the individual sessions are labelled as "sparring" rather than coaching. Our top executives love this approach. The sparring process situationally includes technical experts from the vast MLG network. The feedback is excellent.' },
    { name: 'TÜV Rheinland',    logo: 'tuev-rheinland.png',      services: ['Leadership Development', 'Coaching'],                                                             meta: 'Together with MLG, we designed and delivered an innovative Learning Journey over two years for our more than 100 global Top Executives. This journey is a true game changer for our culture and adds significantly to our overall performance.' },
    { name: 'Deutsche Bahn',    logo: 'deutsche-bahn.png',       services: ['Team Development', 'Coaching'],                                                                   meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Schaeffler',       logo: 'schaeffler.png',          services: ['Leadership Development', 'Coaching'],                                                             meta: 'Continuous change is one of our most challenging topics. MLG helps us to translate our mutual ideas into practical programmes which are really "hands-on" and create value for the global leaders and their teams in our factories.' },
    { name: 'TKE',              logo: 'thyssenkrupp.png',        services: ['Workshops', 'Leadership Development', 'Coaching'],                                                meta: 'Together with the Munich Leadership Group, we have succeeded in setting up a development program which enjoys a high degree of acceptance throughout the company. The trainers and coaches from MLG provide professional and motivating support to ensure that our managers develop a common understanding of successful leadership.' },
    { name: 'Nestlé',           logo: 'nestle.png',              services: ['Keynotes'],                                                                           meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'UniCredit',        logo: 'unicredit.png',           services: ['Coaching'],                                                                                       meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Freudenberg',      logo: 'freudenberg.png',         services: ['Team Development', 'Coaching', 'Leadership Development'],                                         meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Kion Group',       logo: 'kion.png',                services: ['Leadership Development'],                                                                         meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Körber',           logo: 'koerber.png',             services: ['Team Development', 'Coaching'],                                                                   meta: 'MLG is a trusted partner.' },
    { name: 'Siemens Advanta',  logo: 'siemens-advanta.png',     services: ['Leadership Development', 'Team Development', 'Coaching'],                                         meta: 'MLG is flexible, creative, and highly customer oriented. They have extensive leadership knowledge and experience, and they know how to apply this in a pragmatic, creative and memorable setting for participants. The personal collaboration is not only successful, but also fun!' },
    { name: 'Harman',           logo: 'harman.png',              services: ['Keynotes'],                                                                           meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Fraunhofer',       logo: 'fraunhofer.png',          services: ['Team Development', 'Start-up Booster'],                                                          meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'DIHK',             logo: 'dihk.png',                services: ['Leadership Development'],                                                                         meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'DVAG',             logo: 'dvag.png',                services: ['Leadership Development', 'Keynotes'],                                               meta: 'We are in a complex, vibrant business. I can highly recommend working with MLG in all facets of leadership development and transformation. The MLG experts understand our culture and the business we are in — and based on this, they customize successful measures for fostering our leadership performance.' },
    { name: 'HDI',              logo: 'hdi.png',                 services: ['Leadership Development', 'Team Development'],                                                     meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Hexagon',          logo: 'hexagon.png',             services: ['Team Development', 'Coaching'],                                                                   meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Exyte',            logo: 'exyte.png',               services: ['Keynotes', 'Management Days', 'Leadership Development'],                           meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'BCG Platinion',    logo: 'bcg-platinion.png',       services: ['Team Development', 'Coaching'],                                                                   meta: 'Team development on top level is a skill that characterizes the work of the MLG experts. With a unique sense for individual strengths, they are helping to orchestrate the collaboration of leadership teams in a most successful way. Giving candid eye-opening feedback, speaking the truth — MLG works efficiently and straightforward.' },
    { name: 'Sauber',           logo: 'sauber.png',              services: ['Team Development', 'Coaching'],                                                                   meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Knauf',            logo: 'knauf.png',               services: ['Team Development', 'Coaching'],                                                                   meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Deutz',            logo: 'deutz.png',               services: ['Keynotes'],                                                                           meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Vivawest',         logo: 'vivawest.svg',            services: ['Cultural Transformation', 'Leadership Development', 'Team Development', 'Coaching'],             meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Weidmüller',       logo: 'weidmueller.png',         services: ['Management Audits', 'Coaching', 'Team Development'],                                             meta: 'MLG helped us to focus and further develop the professional collaboration on top level. The toolset, the customization and the expertise of the MLG professionals let us remarkably grow our self-awareness.' },
    { name: 'Züblin',           logo: 'zueblin.png',             services: ['Leadership Development', 'Team Development', 'Coaching'],                                         meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Ingenics',         logo: 'ingenics.png',            services: ['Leadership Development', 'Coaching'],                                                             meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Giesecke+Devrient',logo: 'giesecke-devrient.png',  services: ['Coaching'],                                                                                       meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Aqseptence',       logo: 'aqseptence.png',          services: ['Keynotes', 'Leadership Development'],                                               meta: 'The experts of the Munich Leadership Group have been supporting us for years in the consistent further development of our corporate culture. Trainings and workshops are optimally addressed to the respective target group, whether at the factory or at any management level. We have very much benefited from working with the MLG.' },
    { name: 'Eagle Burgmann',   logo: 'eagle-burgmann.png',      services: ['Leadership Development', 'Coaching'],                                                             meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Reply',            logo: 'reply.png',               services: ['Leadership Development', 'Team Development', 'Coaching'],                                         meta: 'The Munich Leadership Group supports us with a tailor-made leadership program that is in place since many years now and is continuously adapted to the new challenges in our vibrant environment. We can highly recommend working with the MLG experts.' },
    { name: 'RSM',              logo: 'rsm.png',                 services: ['Team Development', 'Coaching'],                                                                   meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Golding Capital',  logo: 'golding-capital.png',     services: ['Management Audits', 'Team Development', 'Coaching'],                                             meta: 'MLG helped us gain deep insights into the strengths and particular characteristics of our leadership team. The combination of psychometric tools, the technical expertise of the MLG experts and their facilitation of team workshops is unique and creates great value.' },
    { name: 'Natuvion',         logo: 'natuvion.png',            services: ['Leadership Development', 'Coaching'],                                                             meta: 'The Munich Leadership Group supports us with a tailor-made leadership program and, above all, contributes to transformation and cultural development through conceptual strength, innovative approaches and top facilitators.' },
    { name: 'Trivium',          logo: 'trivium.png',             services: ['Team Development', 'Coaching'],                                                                   meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'TÜV Süd',         logo: 'tuev-sued.png',           services: ['Leadership Development', 'Coaching'],                                                             meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Käfer',            logo: 'kaefer.png',              services: ['Leadership Development', 'Team Development', 'Coaching', 'Management Days'],                     meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Hülskens',         logo: 'huelskens.png',           services: ['Management Days', 'Management Audits', 'Coaching'],                                              meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'SSG',              logo: 'ssg.png',                 services: [],                                                                                                 meta: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
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
      chipImg.src = (location.pathname.indexOf('/de/') > -1 ? '../' : '') + 'assets/clients/' + c.logo;
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
    if (card) card.classList.remove('globe-card--idle');
    cardName.textContent = c.name;
    // Hide the hint/meta text once a client is selected
    if (cardMeta) cardMeta.hidden = true;
    // Service tags
    const svcEl = document.getElementById('globeCardServices');
    if (svcEl) {
      svcEl.innerHTML = '';
      const svcs = c.services || [];
      if (svcs.length) {
        svcs.forEach((s) => {
          const tag = document.createElement('span');
          tag.className = 'globe-card__service-tag';
          tag.textContent = s;
          svcEl.appendChild(tag);
        });
        svcEl.hidden = false;
      } else {
        svcEl.hidden = true;
      }
    }
    const more = document.getElementById('globeCardMore');
    if (more) more.hidden = false;
    if (card) {
      card.classList.remove('is-updating');
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
      if (label) {
        const de = document.documentElement.lang === 'de';
        label.textContent = next ? (de ? 'weniger erfahren' : 'show less') : (de ? 'mehr erfahren' : 'learn more');
      }
    });
  })();

  // ── Shuffle network logos on each load (details follow) ────────
  (function () {
    const wrap     = document.querySelector('.network-logos');
    const details  = document.getElementById('networkDetails');
    if (!wrap) return;
    // Partner order locked to the HTML source order (no shuffle).
  })();

  // ── Stat counter animation ─────────────────────────────────────
  (function () {
    const counters = $$('.stat-item__number[data-count]');
    if (!counters.length) return;
    let fired = false;

    /* Thousands separator follows the page language: the /de/ tree groups
       with a dot (182.000), the English tree with a comma (182,000).
       data-format="dot" now just means "group the thousands". */
    const GROUP_SEP = location.pathname.indexOf('/de/') > -1 ? '.' : ',';

    function formatNum(n, useDot) {
      const s = Math.round(n).toString();
      return useDot ? s.replace(/\B(?=(\d{3})+(?!\d))/g, GROUP_SEP) : s;
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
      /* On mobile the three numbers stack vertically, so firing them
         simultaneously means the lower two count up off-screen. Stagger
         their start so each comes in one after the other as the visitor
         scrolls down. Desktop fires them together as before. */
      const isMobile = window.matchMedia && window.matchMedia('(max-width: 640px)').matches;
      const stagger  = isMobile ? 900  : 0;
      const duration = isMobile ? 1300 : 1800;
      counters.forEach((el, i) => {
        setTimeout(() => animateOne(el, duration, false), i * stagger);
      });
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
        setTimeout(() => { cooldown = false; }, 2400);
      }
    });

    function triggerMlgEgg() {
      const mark = document.getElementById('cornerMark');
      if (mark) {
        mark.classList.remove('mlg-egg-flash');
        void mark.offsetWidth; // restart animation
        mark.classList.add('mlg-egg-flash');
        setTimeout(() => mark.classList.remove('mlg-egg-flash'), 2200);
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
      const count = 40;
      const colors = ['#ffffff', '#ffffff', '#B50034']; // 2 white, 1 red — matches the mark
      // Direction biased toward UPPER-LEFT (following the mark's flight)
      const targetX = -originX * 0.85;   // travel almost the full width to the left
      const targetY = -originY * 0.80;   // travel most of the height upward
      for (let i = 0; i < count; i++) {
        const piece = document.createElement('span');
        piece.className = 'mlg-confetti';
        // Scatter around the upper-left target direction
        const scatterX = (Math.random() - 0.5) * 240;
        const scatterY = (Math.random() - 0.5) * 240;
        const dx = targetX + scatterX;
        const dy = targetY + scatterY;
        const rot = (Math.random() * 1080 - 540) + 'deg';
        const dur = 1400 + Math.random() * 800;
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

  /* ───────────────────────────────────────────────────────────────
     Easter egg #5 — triple-click the client globe → barrel roll
     ─────────────────────────────────────────────────────────────── */
  (function () {
    const stage = document.getElementById('globeStage');
    if (!stage) return;
    let clicks = 0;
    let lastClickTs = 0;
    let rolling = false;
    stage.addEventListener('click', () => {
      const now = performance.now();
      if (now - lastClickTs > 600) clicks = 0;  // reset if too slow
      lastClickTs = now;
      clicks += 1;
      if (clicks >= 3 && !rolling) {
        clicks = 0;
        rolling = true;
        stage.classList.add('globe-egg-roll');
        setTimeout(() => {
          stage.classList.remove('globe-egg-roll');
          rolling = false;
        }, 1400);
      }
    });
  })();

  /* ───────────────────────────────────────────────────────────────
     Easter egg #2 — click corner mark 3× → three triangles burst out
     ─────────────────────────────────────────────────────────────── */
  (function () {
    const mark = document.getElementById('cornerMark');
    if (!mark) return;
    const paths = mark.querySelectorAll('.mark__path');
    if (paths.length !== 3) return;
    let clicks = 0;
    let lastClickTs = 0;
    let busy = false;
    mark.addEventListener('click', (e) => {
      const now = performance.now();
      if (now - lastClickTs > 700) clicks = 0;
      lastClickTs = now;
      clicks += 1;
      if (clicks >= 3 && !busy) {
        e.preventDefault();
        clicks = 0;
        busy = true;
        burstMark();
        setTimeout(() => { busy = false; }, 2200);
      }
    });
    function burstMark() {
      // Cancel ONLY the WAAPI animations from flyMark — leave CSSAnimations
      // (notably `pathIn`, which has fill:forwards holding the path at
      // opacity:1) intact. Cancelling pathIn here used to make the mark
      // vanish after the burst, because the base .mark__path { opacity: 0 }
      // would take over once both pathIn AND .mark-burst were gone.
      mark.getAnimations({ subtree: true }).forEach((a) => {
        if (!(a instanceof CSSAnimation)) a.cancel();
      });
      delete mark.dataset.flying;
      // CSS class approach is more reliable on SVG elements across browsers.
      // Set per-path burst directions as CSS custom properties, then toggle
      // the .mark-burst class to restart the @keyframes markBurst animation.
      const dirs = [
        { x: -180 + (Math.random() * -120), y: -100 + (Math.random() * -100) },
        { x:  100 + Math.random() * 140,    y: -160 + (Math.random() * -80)  },
        { x:  -40 + (Math.random() * 80),   y:  140 + Math.random() * 80     },
      ];
      paths.forEach((p, i) => {
        const d = dirs[i] || dirs[0];
        const rot = (Math.random() * 720 - 360) + 'deg';
        p.style.setProperty('--burst-x', d.x + 'px');
        p.style.setProperty('--burst-y', d.y + 'px');
        p.style.setProperty('--burst-rot', rot);
        // Restart the @keyframes by removing + forcing reflow + re-adding.
        // We DON'T setTimeout-remove the class afterwards — the markBurst
        // animation's fill:both already holds the final keyframe (opacity 1,
        // identity transform) at the original position, and the next
        // triple-click goes through this remove/reflow/add path again to
        // restart cleanly. Removing it on a timer would drop the fill state
        // and let base opacity:0 reassert (the original bug).
        p.classList.remove('mark-burst');
        void p.offsetWidth;
        p.classList.add('mark-burst');
      });
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
  /* Radius the cached per-chip position strings were built for; -1 forces the
     first build. Reset implicitly whenever `radius` changes on resize. */
  let posRadius = -1;
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

  /* The globe used to be capped at 24fps on touch devices because each frame
     rebuilt a full transform string for all 57 chips. That cap is what made
     the spin look choppy on phones. The per-frame work is now cut to roughly
     a quarter (see tickGlobe below), so the loop runs uncapped and follows
     the display refresh rate instead.

     No cap is safe here because the rotation is time-scaled via `fr`: a phone
     that cannot hold 60fps simply advances further per frame, so the globe
     turns at the same SPEED regardless of the frame rate it achieves. */
  let lastGlobeT = performance.now();

  function tickGlobe(now) {
    requestAnimationFrame(tickGlobe);
    now = now || performance.now();
    let dt = now - lastGlobeT;
    lastGlobeT = now;
    if (dt > 100) dt = 16.7;            // clamp after tab-away / stalls
    const fr = dt / 16.7;               // elapsed in 60fps-frame units

    if (built && globeInView) {
      if (radius === 0 && globeStage.clientWidth > 0) {
        radius = Math.min(globeStage.clientWidth, globeStage.clientHeight) / 2 * 0.92;
      }
      if (isAuto) {
        rotY += 0.18 * fr;
      } else {
        rotY += velY * fr;
        velY *= Math.pow(0.94, fr);
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

      /* Two thirds of the old per-frame string work was rebuilding values that
         had not changed:

         - A chip's offset from the globe centre is fixed. Its translate3d()
           only depends on `radius`, so it is built once per radius instead of
           57× per frame.
         - The billboard counter-rotation keeps every chip facing the viewer
           and is therefore identical for all of them — built once per frame,
           not once per chip.

         That takes the per-frame number formatting from ~228 toFixed() calls
         down to ~57, and the concatenated string from five parts to three.
         This is what paid for removing the 24fps cap. */
      if (posRadius !== radius) {
        for (const c of chips) {
          c.pos = 'translate(-50%,-50%) translate3d(' +
                  (c.x * radius).toFixed(1) + 'px,' +
                  (c.y * radius).toFixed(1) + 'px,' +
                  (c.z * radius).toFixed(1) + 'px) ';
        }
        posRadius = radius;
      }
      const billboard = 'rotateX(' + (-rotX).toFixed(1) + 'deg) rotateY(' +
                        (-rotY).toFixed(1) + 'deg) scale(';

      for (let i = 0; i < chips.length; i++) {
        const c = chips[i];
        /* Only the rotated z matters — the chip's screen x/y come from its own
           translate3d, so the rotated x was computed and never used. */
        const z1 = -c.x * sinY + c.z * cosY;
        const z2 =  c.y * sinX + z1 * cosX;

        const t  = (z2 + 1) / 2;        // 0 (back) → 1 (front)
        const sc = 0.78 + t * 0.32;     // small at back, full at front

        /* Depth is conveyed by scale + 3D z-position only.
           - Chip opacity stays at 1.0 always (no opacity layer to get stuck).
           - The dimming "veil" is applied to a ::after overlay via a CSS var.
           - No `filter: blur()` anywhere — blur was the source of stuck dark snapshots. */
        c.el.style.transform = c.pos + billboard + sc.toFixed(2) + ')';

        /* Veil: 0 at front, up to 0.55 at back. Animated via overlay opacity.
           Two decimals rather than three so the unchanged-check below skips
           far more writes without any visible banding. */
        const veil = ((1 - t) * 0.55).toFixed(2);
        if (c._veil !== veil) {
          c.el.style.setProperty('--chip-veil', veil);
          c._veil = veil;
        }

        const zi = Math.round(t * 100);
        if (c._zi !== zi) { c.el.style.zIndex = zi; c._zi = zi; }
        const pe = t < 0.35 ? 'none' : 'auto';
        if (c._pe !== pe) { c.el.style.pointerEvents = pe; c._pe = pe; }
      }
    }
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
  function showStep(idx, opts) {
    steps.forEach((s, i) => s.classList.toggle('is-active', i === idx));
    current = idx;
    setProgress(idx);
    // Focus first interactive element. preventScroll keeps the deck from
    // jumping when we reset the form after routing the visitor elsewhere.
    if (opts && opts.noFocus) return;
    const el = steps[idx].querySelector('input, textarea, .tf__choice');
    if (el) setTimeout(() => el.focus({ preventScroll: true }), 60);
  }

  /* ── Reset form to its initial state ── */
  function resetForm() {
    Object.keys(answers).forEach((k) => delete answers[k]);
    steps.forEach((s) => {
      s.querySelectorAll('.tf__choice.is-selected').forEach((c) => c.classList.remove('is-selected'));
      s.querySelectorAll('input, textarea').forEach((i) => { i.value = ''; });
      s.classList.remove('is-shake');
    });
    // No focus on reset — avoids a programmatic scroll into the Tailor
    // slide right after the user has been routed elsewhere.
    showStep(0, { noFocus: true });
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

  /* Quick-access routing — maps step-1 profile answer to the slide or
     dedicated page that best fits the visitor's intent. Slide indices are
     DOM order: 0 Welcome, 1 Tailor, 2 Clients, 3 Approach, 4 Testimonials,
     5 Services, 6 Why MLG, 7 Tools, 8 Team, 9 Book, 10 Contact. */
  const PROFILE_ROUTES = {
    'general':          { slide: 2 },                                  // Clients / globe
    'clients':          { slide: 2 },                                  // Clients / globe
    'hr':               { page: 'leadership-development.html' },
    'executive':        { page: 'coaching-sparring.html' },
    'curious-culture':  { page: 'cultural-transformation.html' },
    'ambitious':        { page: 'coaching-sparring.html' },
    'alumnus':          { slide: 8 },                                  // Team
  };
  function routeProfile(profile, delay) {
    const target = PROFILE_ROUTES[profile] || { slide: 5 }; // Services fallback
    // For PAGE routes: skip the thank-you delay. The 1200 ms wait used
    // to invite a flash of slide 2 (Approach) if the visitor scrolled
    // even slightly during the dwell. The destination page IS the
    // experience — go straight there.
    const effectiveDelay = target.page ? 0 : delay;
    const fire = () => {
      if (target.page) {
        // Hide the deck FIRST so no intermediate slide can paint after
        // this point. Then snap back to Tailor (so the bfcache restore
        // lands on the right slide), then trigger navigation.
        document.documentElement.style.background = '#000';
        const deck = document.getElementById('deck');
        if (deck) deck.style.visibility = 'hidden';
        if (typeof window.__mlgScrollTo === 'function') {
          const slides = Array.from(document.querySelectorAll('.slide'));
          const tailorIdx = slides.findIndex(s => s.dataset.title === 'Tailor');
          if (tailorIdx >= 0) window.__mlgScrollTo(tailorIdx);
        }
        window.location.href = target.page;
      } else if (typeof window.__mlgScrollTo === 'function') {
        window.__mlgScrollTo(target.slide);
        // Reset AFTER the jump has resolved so the form is fresh on
        // return, but the reset can't push the deck around mid-jump.
        setTimeout(resetForm, 80);
      }
    };
    if (effectiveDelay > 0) setTimeout(fire, effectiveDelay);
    else fire();
  }
  // bfcache restore: when the visitor uses the browser back button to
  // return from a service page, the page is restored from cache with
  // inline styles intact — including the visibility:hidden we set on
  // the deck right before navigation. Clear them every pageshow so the
  // hero image is visible again.
  window.addEventListener('pageshow', () => {
    document.documentElement.style.background = '';
    const deck = document.getElementById('deck');
    if (deck) deck.style.visibility = '';
  });

  /* ── Submit ── At the end of the quick-access form, store answers,
     show the thank-you screen briefly, then route the visitor to the
     section/page that matches the step-1 ("profile") choice. */
  function submitForm() {
    const step = steps[current];
    collect(step);
    storeAnswers('tailor', answers);
    showStep(DONE_IDX);
    routeProfile(answers.profile, 1200);
    // Reset so a return visit shows step 0 (after the route fires).
    setTimeout(resetForm, 1400);
  }

  /* ── Event delegation ── */
  let _advanceTimer = null;
  form.addEventListener('click', (e) => {
    // Choice button
    const choice = e.target.closest('.tf__choice');
    if (choice) {
      const step = choice.closest('.tf__step');
      step.querySelectorAll('.tf__choice').forEach(c => c.classList.remove('is-selected'));
      choice.classList.add('is-selected');
      // Debounce: cancel any pending advance so rapid clicks on different
      // steps can't queue multiple advances and skip over steps.
      // The visitor walks through every question (profile → company size
      // → company type) before submitForm fires the route.
      clearTimeout(_advanceTimer);
      _advanceTimer = setTimeout(() => { _advanceTimer = null; advance(); }, 300);
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

  /* Submissions now go to our own same-origin endpoint, /api/contact, NOT
     straight to Power Automate. That endpoint (a small Node service behind
     Apache) verifies the Cloudflare Turnstile token server-side and only then
     forwards to the Power Automate webhook. The webhook URL used to sit here in
     the client, which meant a bot could read it from the JS and POST spam
     directly, skipping the form; it now lives only on the server. */
  const CONTACT_ENDPOINT = '/api/contact';

  function sendToContactApi(payload) {
    /* Fire-and-forget: a network error is logged but never blocks the UX —
       the thank-you screen always shows. keepalive lets the POST finish even
       if the view changes underneath it. */
    try {
      return fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).then(function (r) {
        if (!r.ok) console.warn('Contact endpoint returned', r.status);
      }).catch(function (err) {
        console.warn('Contact endpoint failed:', err);
      });
    } catch (err) {
      console.warn('Contact endpoint threw:', err);
    }
  }

  /* ── Cloudflare Turnstile ─────────────────────────────────────────
     Rendered explicitly on the email step (the last input step) rather than
     at page load, so the token is fresh when the user reaches Send — tokens
     expire after ~5 min, and this form can sit open a while. Managed mode is
     usually invisible; the token arrives via the callback. */
  const TURNSTILE_SITEKEY = '0x4AAAAAAD6XarEuh2pWg2dK';
  let turnstileToken   = '';
  let turnstileWidget  = null;
  let pendingSubmit    = false;   // Send was clicked before the token arrived
  let submitted        = false;   // guard against a double send
  let tsTimer          = null;    // fallback if the token never arrives

  function tsError(show) {
    const el = document.getElementById('tfTsError');
    if (el) el.hidden = !show;
  }

  function ensureTurnstile() {
    if (turnstileWidget !== null) return;                 // render once
    const host = document.getElementById('tfTurnstile');
    if (!host) return;
    if (!window.turnstile) { setTimeout(ensureTurnstile, 200); return; } // script still loading
    turnstileWidget = window.turnstile.render(host, {
      sitekey: TURNSTILE_SITEKEY,
      callback: function (t) {
        turnstileToken = t;
        clearTimeout(tsTimer);
        tsError(false);
        if (pendingSubmit) { pendingSubmit = false; submitForm(); }
      },
      'expired-callback': function () { turnstileToken = ''; },
      'error-callback':   function () { turnstileToken = ''; },
    });
  }

  function setProgress(idx) {
    if (!fillEl) return;
    const pct = Math.round((idx / DONE_IDX) * 100);
    fillEl.style.width = Math.min(pct, 100) + '%';
  }

  function showStep(idx) {
    steps.forEach((s, i) => s.classList.toggle('is-active', i === idx));
    current = idx;
    setProgress(idx);
    // Render the Turnstile widget as soon as the user reaches the step that
    // carries the Send button, so the token is ready by the time they submit.
    if (steps[idx].querySelector('[data-action="submit"]')) ensureTurnstile();
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

  /* Full submit — validate, then POST to /api/contact (which verifies the
     Turnstile token server-side and forwards to Power Automate), and show the
     thank-you screen. If the token hasn't arrived yet, remember the intent and
     let the Turnstile callback complete the submit; the managed widget usually
     resolves within a moment, so the user rarely notices. */
  function submitForm() {
    if (submitted) return;
    const step = steps[current];
    if (!validate(step)) {
      step.classList.add('is-shake');
      setTimeout(() => step.classList.remove('is-shake'), 500);
      return;
    }
    collect(step);

    if (!turnstileToken) {
      pendingSubmit = true;
      ensureTurnstile();
      // If verification can't load (blocked script, offline), don't leave the
      // user stuck on a dead button — surface a way out after a short wait.
      clearTimeout(tsTimer);
      tsTimer = setTimeout(function () {
        if (pendingSubmit) { pendingSubmit = false; tsError(true); }
      }, 7000);
      return;   // callback will re-enter submitForm once the token lands
    }

    submitted = true;
    storeAnswers('contact', answers);
    sendToContactApi({
      problem:        answers.problem || '',
      role:           answers.role    || '',
      email:          answers.email   || '',
      message:        answers.message || '',
      language:       document.documentElement.lang || 'en',
      timestamp:      new Date().toISOString(),
      turnstileToken: turnstileToken,
    });
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
    if (action === 'submit') submitForm();   // ← only path that opens mailto
  });

  form.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const step = steps[current];
    // Enter on the final step submits, same as clicking Send — so it also
    // goes through Turnstile verification and reaches the CRM. (Previously
    // Enter only showed the thank-you screen and silently skipped the send.)
    if (step.querySelector('[data-action="submit"]')) { e.preventDefault(); submitForm(); }
    else if (!step.querySelector('.tf__choices'))     { e.preventDefault(); advance(); }
  });

  showStep(0);
})();

/* ── Language switcher ──────────────────────────────────────────── */
(function () {
  function applyLang(lang) {
    document.documentElement.lang = lang;
    try { localStorage.setItem('mlg-lang', lang); } catch (e) {}
    document.querySelectorAll('.lang-switch__btn').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.dataset.lang === lang);
    });
    // Translatable content carries only a data-de attribute; the authored
    // English stays as the element's own markup and is captured once as the
    // baseline. innerHTML is used so inline <strong>/<br> survive the swap.
    document.querySelectorAll('[data-de]').forEach(function (el) {
      if (el.__en == null) el.__en = el.innerHTML;
      el.innerHTML = lang === 'de' ? el.dataset.de : el.__en;
    });
    // Input/textarea placeholders translate via data-de-ph.
    document.querySelectorAll('[data-de-ph]').forEach(function (el) {
      if (el.__enph == null) el.__enph = el.getAttribute('placeholder') || '';
      el.setAttribute('placeholder', lang === 'de' ? el.dataset.dePh : el.__enph);
    });
  }

  function initLangSwitch() {
    var urlLang = location.pathname.indexOf('/de/') > -1 ? 'de' : 'en';
    applyLang(urlLang);
    document.querySelectorAll('.lang-switch__btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.dataset.lang === urlLang) return;
        var p = location.pathname;
        var dest = btn.dataset.lang === 'de'
          ? p.replace(/\/([^\/]*)$/, '/de/$1')
          : p.replace('/de/', '/');
        location.href = dest + location.search + location.hash;
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLangSwitch);
  } else {
    initLangSwitch();
  }
})();

