/* =============================================================
   MLG interactive landing — smooth scrollable
   ============================================================= */

(() => {
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

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

  function startExperience() {
    intro.classList.add('is-leaving');
    excuses.classList.add('is-on');
    excuses.setAttribute('aria-hidden', 'false');
    setTimeout(() => { intro.style.display = 'none'; }, 1100);
    setTimeout(buildExcuses, 200);
  }

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
    "My decisions are safe, sound, and fast",
    "We are attracting the smartest talents",
    "I have become the best boss ever",
    "Our company culture fosters best performance",
    "The leaders in our company are role models",
    "We are a learning community",
    "My team strives, and we outsmart the competition",
    "The competition is jealous of us",
    "We are a winning team, curious and innovative",
    "I am proud of my company",
    "Our engagement is legend",
    "I am an authentic leader with natural authority",
    "We give each other candid feedback",
    "Everyone of us learns from their mistakes",
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
      chip.addEventListener('click', () => popChip(c));
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
  const EASE = 0.085;
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

  function startSmoothScroll() {
    if (smoothRunning) return;
    smoothRunning = true;
    requestAnimationFrame(tickSmooth);
  }

  function tickSmooth() {
    const diff = scrollTarget - scrollCurrent;
    scrollCurrent = Math.abs(diff) < 0.5 ? scrollTarget : scrollCurrent + diff * EASE;

    slidesEl.style.transform = `translateY(${-scrollCurrent}px)`;

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
      if (title === 'Services') {
        const wrap = document.createElement('div');
        wrap.className = 'slide-nav__dropdown-wrap';

        const btn = document.createElement('button');
        btn.className = 'slide-nav__btn slide-nav__btn--has-drop';
        btn.innerHTML = `${title}<svg class="slide-nav__chevron" viewBox="0 0 10 6" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 1l4 4 4-4"/></svg>`;
        btn.addEventListener('click', () => scrollToSlide(i));

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

  function updateActiveNav() {
    if (!slideNav) return;
    const midY = scrollCurrent + window.innerHeight * 0.4;
    let activeIdx = 0;
    slides.forEach((slide, i) => {
      if (slide.offsetTop <= midY) activeIdx = i;
    });
    slideNav.querySelectorAll('.slide-nav__btn').forEach((btn, i) => {
      btn.classList.toggle('is-active', i === activeIdx);
    });
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
    const y = slides[idx]?.offsetTop || 0;
    scrollTarget  = y;
    scrollCurrent = y;
    window.scrollTo({ top: y, behavior: 'instant' });
    startSmoothScroll();
    setTimeout(buildGlobe, 16);
    setTimeout(initReveal, 300);
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
      '.why-mlg__header',
      '.approach-centered__header',
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
    { name: 'Microsoft',      logo: 'microsoft.png',      meta: 'Azure and cloud transformation leadership cohort for EMEA. Three cohorts a year focused on managing high-velocity product cycles and cross-functional alignment at scale.',
      quote: { text: "They understand how to develop leaders who thrive in environments of constant change.", author: "Sarah Müller", role: "VP Talent Development, Microsoft EMEA" } },
    { name: 'BMW Group',      logo: 'bmw.png',            meta: 'Plant leadership academy across the European production network. A six-month track for plant directors and their successors, with rotations through Munich, Leipzig and Regensburg.',
      quote: { text: "We have run plant leadership academies for a decade. MLG is the only partner who pushed us harder than we pushed them.", author: "Stefan Becker", role: "Director Production Network, BMW Group" } },
    { name: 'Nestlé',         logo: 'nestle.png',         meta: 'General manager readiness programme for EMEA zone leaders. A structured 18-month path combining in-person modules with peer coaching between sessions.',
      quote: { text: "The peer coaching structure meant the learning never stopped between modules.", author: "Isabelle Dupont", role: "Zone Talent Lead, Nestlé EMEA" } },
    { name: 'Siemens',        logo: 'siemens.png',        meta: 'Digital industries division — senior cohort, two cohorts annually since 2017. Focused on transition leadership as the legacy industrial business reshapes around software and services.',
      quote: { text: "The cases were uncomfortable on purpose. That's why we keep coming back.", author: "Markus Renner", role: "SVP Digital Industries, Siemens" } },
    { name: 'Munich Re',      logo: 'munich-re.png',      meta: 'Reinsurance leadership track since 2016. We teach the trade, not the textbook — including the Bermuda flight and the syndicate visit.',
      quote: { text: "They taught the trade, not the textbook. That's rare.", author: "Friedrich Mayer", role: "Head of Reinsurance Talent, Munich Re" } },
    { name: 'Bayer',          logo: 'bayer.png',          meta: 'Crop science division — succession programme for general managers. Two-year cycle, paired with a current SVP throughout.',
      quote: { text: "The SVP pairing is what separates this from every other succession programme.", author: "Dr. Elena Fischer", role: "SVP Crop Science, Bayer" } },
    { name: 'Philip Morris',  logo: 'philip-morris.png',  meta: 'Transformation leadership programme spanning global markets. Focused on managing cultural and strategic change as the business reorients around reduced-risk products.',
      quote: { text: "When the business model is changing this fast, leadership development has to keep pace.", author: "Marco Ferretti", role: "Director Leadership Development, PMI" } },
    { name: 'Gilead Sciences', logo: 'gilead.png',        meta: 'Commercial and medical leadership academy for EMEA operations. Annual cohort of senior directors, with an emphasis on cross-functional decision-making in regulated environments.',
      quote: { text: "Science is only half the job. The leadership work they do is the other half.", author: "Dr. Anna Bauer", role: "VP Medical Affairs, Gilead EMEA" } },
    { name: 'Hannover Re',    logo: 'hannover-re.png',    meta: 'Executive development programme for the underwriting leadership. Closed cohorts focused on risk culture, long-cycle decision-making, and leading specialists.',
      quote: { text: "Leading specialists requires a different kind of leadership. They understand that distinction.", author: "Thorsten Wolf", role: "Chief Underwriting Officer, Hannover Re" } },
    { name: 'BayWa',          logo: 'baywa.png',          meta: 'Strategic leadership track for the agricultural and energy divisions. Built around the complexity of managing two distinct business models within one organisation.',
      quote: { text: "Our leaders had to hold both worlds at once. The programme was built for exactly that.", author: "Katharina Lehmann", role: "Head of HR, BayWa" } },
    { name: 'UniCredit',      logo: 'unicredit.png',      meta: 'Pan-European leadership programme for country and segment heads. Designed to build alignment across markets while preserving the local judgment that defines the business.',
      quote: { text: "Central alignment and local judgment — most programmes sacrifice one for the other. This one didn't.", author: "Pietro Romano", role: "Head of Leadership Development, UniCredit" } },
    { name: 'Strabag',        logo: 'strabag.png',        meta: 'Project leadership programme for major infrastructure directors. Cohorts drawn from the largest live projects, with cases built from in-house decisions as they unfold.',
      quote: { text: "We used live cases from our own sites. That made everything count.", author: "Franz Huber", role: "Regional Director Central Europe, Strabag" } },
    { name: 'Schaeffler',     logo: 'schaeffler.png',     meta: 'Precision industries leadership track for R&D and operations executives. A two-year programme bridging the transition from engineering excellence to enterprise leadership.',
      quote: { text: "The step from engineering excellence to enterprise leadership is the hardest one. They map it clearly.", author: "Dr. Petra Haas", role: "VP Engineering Leadership, Schaeffler" } },
    { name: 'Knauf',          logo: 'knauf.png',          meta: 'Family business leadership programme for senior operating executives. Tailored to the complexity of a private global company where ownership, culture and performance intersect.',
      quote: { text: "In a family business, culture is the strategy. They know how to work with that.", author: "Alexander Knauf", role: "Executive Board, Knauf" } },
    { name: 'BCG',            logo: 'bcg.png',            meta: 'Partner development programme for Central European offices. Focused on the distinct leadership demands of a knowledge organisation at partnership level.',
      quote: { text: "We know leadership development well. We came to MLG because they know it differently.", author: "Dr. Julia Berg", role: "Partner & Head of People, BCG DACH" } },
    { name: 'KION Group',     logo: 'kion.png',           meta: 'Industrial transformation leadership track for the KION brand portfolio. Annual cohort focused on post-merger integration, cultural alignment, and scaling leadership capacity.',
      quote: { text: "Post-merger, the leadership question is always the hardest. They helped us answer it.", author: "Rainer Hoffmann", role: "CHRO, KION Group" } },
    { name: 'Harman',         logo: 'harman.png',         meta: 'Connected technologies leadership programme for senior leaders across the JBL, Harman Kardon and connected car divisions. Three cohorts since the Samsung integration.',
      quote: { text: "Post-integration, we needed leaders who could run a global business. That's what this built.", author: "Susanne Park", role: "VP Global Leadership, Harman" } },
    { name: 'Knorr-Bremse',  logo: 'knorr-bremse.png',  meta: 'Safety-critical leadership programme for rail and truck division heads. Built around the specific challenges of leading in a zero-defect culture under commercial pressure.',
      quote: { text: "In safety-critical business, leadership mistakes cost more than money. This programme respects that.", author: "Dr. Heinrich Moll", role: "Division Head, Knorr-Bremse Rail" } },
    { name: 'Hexagon',        logo: 'hexagon.png',        meta: 'Digital reality solutions leadership track for global business unit heads. Annual programme aligned to the acquisition integration cycle and geospatial market expansion.',
      quote: { text: "We acquire fast. This programme helps our leaders integrate even faster.", author: "Lisa Strand", role: "Chief People Officer, Hexagon" } },
    { name: 'KUKA',           logo: 'kuka.png',           meta: 'Robotics and automation leadership programme for plant and product executives. Focused on the leadership dimension of the AI and automation disruption reshaping the industry.',
      quote: { text: "The industry is automating. The leadership challenge is uniquely human. They get the difference.", author: "Dr. Michael Roth", role: "VP People & Organisation, KUKA" } },
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
    cardName.textContent = c.name;
    cardMeta.textContent = c.meta;
    const more = document.getElementById('globeCardMore');
    if (more) more.hidden = false;

    const quote = c.quote;
    const quoteEl = document.getElementById('clientQuote');
    if (quote && quoteEl) {
      document.getElementById('quoteText').textContent   = '"' + quote.text + '"';
      document.getElementById('quoteAuthor').textContent = quote.author;
      document.getElementById('quoteRole').textContent   = quote.role;
      document.getElementById('quoteAvatar').textContent = initialsOf(quote.author);
      quoteEl.hidden = false;
    }
  }

  function initialsOf(name) {
    return String(name)
      .replace(/^(Dr\.|Captain|Mr\.|Mrs\.|Ms\.)\s+/i, '')
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  document.getElementById('globeCardMore')?.addEventListener('click', (e) => e.preventDefault());

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
    if (e.target && e.target.closest('.chip')) return;
    e.preventDefault();
    isAuto = false;
    globeStage.classList.add('is-dragging');
    dragG = { x: e.clientX, y: e.clientY, rx: rotX, ry: rotY, t: performance.now(), lx: e.clientX, id: e.pointerId };
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
    }
    dragG = null;
    globeStage.classList.remove('is-dragging');
    document.removeEventListener('pointermove', onDragG);
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  let chipsPlaced = false;
  function tickGlobe() {
    if (built) {
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

        const t  = (z2 + 1) / 2;
        const op = 0.12 + t * 0.88;
        const sc = 0.78 + t * 0.32;

        c.el.style.transform =
          `translate(-50%, -50%) ` +
          `translate3d(${(c.x * radius).toFixed(2)}px, ${(c.y * radius).toFixed(2)}px, ${(c.z * radius).toFixed(2)}px) ` +
          `rotateX(${(-rotX).toFixed(2)}deg) rotateY(${(-rotY).toFixed(2)}deg) ` +
          `scale(${sc.toFixed(3)})`;
        c.el.style.opacity = op.toFixed(3);
        c.el.style.zIndex = Math.round(t * 100);
        c.el.style.filter = `blur(${((1 - t) * 1.4).toFixed(2)}px)`;
        c.el.style.pointerEvents = t < 0.35 ? 'none' : 'auto';
      }
    }
    requestAnimationFrame(tickGlobe);
  }
  requestAnimationFrame(tickGlobe);
})();
