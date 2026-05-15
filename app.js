/* =============================================================
   MLG interactive landing — slideshow + globe
   ============================================================= */

(() => {
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* =====================================================
     Intro: static logo + slide-to-start
     ===================================================== */
  const intro    = $('#intro');
  const enterBtn = $('#enterBtn');                    // outer slide-start container
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
    // Build chips after the page has had a frame to lay out at full size
    setTimeout(buildExcuses, 200);
  }

  function enterDeck() {
    excuses.classList.add('is-leaving');
    deck.classList.add('is-on');
    deck.setAttribute('aria-hidden', 'false');
    setTimeout(() => { excuses.style.display = 'none'; }, 1100);
    setTimeout(buildGlobe, 16);
  }

  // Slide-to-start drag handler
  let startDrag = null;
  function maxKnobX() {
    return enterBtn.clientWidth - knob.offsetWidth - 8; // 4px padding each side
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
      // Snap to the end and trigger
      setKnob(maxKnobX());
      enterBtn.classList.add('is-done');
      startExperience();
    } else {
      resetKnob();
    }
    startDrag = null;
  }

  // Keyboard accessibility — Enter or Space starts the deck.
  enterBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setKnob(maxKnobX());
      enterBtn.classList.add('is-done');
      startExperience();
    }
  });

  /* Reusable: fling the three chevrons of a stepped-pyramid mark out to the
     top-right one by one, then back from the bottom-left. The target element
     must contain three `.mark__path` children (separate <svg> roots).
     Exposed on window.MLG for later wiring elsewhere on the site. */
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
      // Stagger the bob so chips don't all rise and fall in unison
      inner.style.animationDelay = `${(Math.random() * -4).toFixed(2)}s`;
      chip.appendChild(inner);

      excusesField.appendChild(chip);

      // Force layout to read width/height
      const w = chip.offsetWidth;
      const h = chip.offsetHeight;

      const margin = 24;
      const x = margin + Math.random() * Math.max(0, W - w - margin * 2);
      const y = 100 + Math.random() * Math.max(0, H - h - 200);
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.35 + Math.random() * 0.45;       // faster drift

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

    // Chip itself fades out fast
    c.el.style.transition = 'opacity 120ms var(--ease-out), transform 120ms var(--ease-out)';
    c.el.style.opacity = '0';
    c.el.style.pointerEvents = 'none';

    // Burst into letter fragments scattering outward
    const fragLifetimes = [];
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
      fragLifetimes.push(setTimeout(() => frag.remove(), dur + 50));
    }

    setTimeout(() => c.el.remove(), 200);

    chipsCleared += 1;
    if (chipsCleared >= 3) {
      triggerReveal();
    }
  }

  function triggerReveal() {
    if (revealed) return;
    revealed = true;
    excuses.classList.add('is-revealing');
    cancelAnimationFrame(chipsRAF);
    // Hold the line on screen, then advance to the deck
    setTimeout(enterDeck, 3500);
  }


  // Bottom-right mark inside the deck — click plays the fly animation.
  const cornerMark = $('#cornerMark');
  if (cornerMark) {
    cornerMark.addEventListener('click', () => flyMark(cornerMark));
  }


  /* =====================================================
     Slideshow
     ===================================================== */
  const slides     = $$('.slide');
  const railFill   = $('#railFill');
  const counterNow = $('#counterNow');
  const counterAll = $('#counterAll');

  let current = 0;
  let transitioning = false;

  counterAll.textContent = String(slides.length).padStart(2, '0');
  updateMeta();

  function goTo(idx) {
    idx = (idx + slides.length) % slides.length;
    if (idx === current || transitioning) return;
    // Lock the deck on the selector slide until the user picks an audience.
    if (current === 0 && !deck.classList.contains('is-armed')) return;
    transitioning = true;

    const outgoing = slides[current];
    const incoming = slides[idx];

    outgoing.classList.add('is-leaving');
    outgoing.classList.remove('is-active');

    void incoming.offsetWidth;          // restart animations
    incoming.classList.add('is-active');

    // Signature flourish: fly the corner mark whenever the deck crosses
    // between the Approach and Team slides (in either direction).
    const fromTitle = outgoing.dataset.title;
    const toTitle   = incoming.dataset.title;
    const crossingTeam =
      (fromTitle === 'Approach' && toTitle === 'Team') ||
      (fromTitle === 'Team' && toTitle === 'Approach');
    if (crossingTeam && cornerMark) {
      flyMark(cornerMark);
    }

    current = idx;
    updateMeta();

    setTimeout(() => {
      outgoing.classList.remove('is-leaving');
      transitioning = false;
    }, 700);
  }

  function updateMeta() {
    counterNow.textContent = String(current + 1).padStart(2, '0');
    railFill.style.height = `${((current + 1) / slides.length) * 100}%`;
  }

  window.addEventListener('keydown', (e) => {
    if (deck.getAttribute('aria-hidden') === 'true') return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); goTo(current + 1); }
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp'   || e.key === 'PageUp')   { e.preventDefault(); goTo(current - 1); }
  });

  // Direct-jump buttons — any element with `data-jump="N"` advances to slide N.
  $$('[data-jump]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.jump, 10);
      if (!Number.isNaN(idx)) goTo(idx);
    });
  });

  // Title-jump buttons — `data-jump-title="Services"` jumps to the slide
  // whose data-title matches. Survives slide reorders better than indices.
  $$('[data-jump-title]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const title = btn.dataset.jumpTitle;
      const idx = slides.findIndex((s) => s.dataset.title === title);
      if (idx >= 0) goTo(idx);
    });
  });

  // Audience state — declared up here so jumpFromHash (below) can read it.
  // The full toggle wiring (click handlers, etc.) sits further down.
  let currentAudience = null;     // null until the user picks on the selector slide
  function selectAudience(aud) {
    currentAudience = aud;
    $$('.audience-tab').forEach((t) => {
      const on = t.dataset.audience === aud;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  // Deep-link from a standalone page (services.html, approach.html, etc.):
  // if the URL has #slide=N, skip the intro + excuses and land on that slide.
  function jumpFromHash() {
    const m = location.hash.match(/^#slide=(\d+)$/);
    if (!m) return false;
    const idx = Math.max(0, Math.min(slides.length - 1, parseInt(m[1], 10)));
    intro.classList.add('is-leaving');
    intro.style.display = 'none';
    if (excuses) excuses.style.display = 'none';
    deck.classList.add('is-on');
    deck.classList.add('is-armed');               // skip the audience-gate too
    if (!currentAudience) selectAudience('senior'); // sensible default for deep links
    deck.setAttribute('aria-hidden', 'false');
    slides[0].classList.remove('is-active');
    slides[idx].classList.add('is-active');
    current = idx;
    updateMeta();
    setTimeout(buildGlobe, 16);
    // Wipe the hash so a refresh starts the experience clean.
    history.replaceState(null, '', location.pathname + location.search);
    return true;
  }
  jumpFromHash();

  let wheelLock = false;
  deck.addEventListener('wheel', (e) => {
    if (wheelLock) return;
    if (Math.abs(e.deltaY) < 14) return;
    wheelLock = true;
    goTo(current + (e.deltaY > 0 ? 1 : -1));
    setTimeout(() => { wheelLock = false; }, 750);
  }, { passive: true });

  let touchStart = null;
  deck.addEventListener('touchstart', (e) => {
    if (e.target.closest('.globe-stage, .team-wrap, .contact-wrap')) { touchStart = null; return; }
    const t = e.touches[0];
    touchStart = { x: t.clientX, y: t.clientY };
  }, { passive: true });
  deck.addEventListener('touchend', (e) => {
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    if (Math.abs(dy) > 50 && Math.abs(dy) > Math.abs(dx)) {
      goTo(current + (dy < 0 ? 1 : -1));
    } else if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      goTo(current + (dx < 0 ? 1 : -1));
    }
    touchStart = null;
  }, { passive: true });


  /* =====================================================
     Globe of clients
     ===================================================== */
  const CLIENTS = [
    { name: 'Allianz',        meta: 'Group-wide leadership pipeline since 2019. Three cohorts a year covering the operating board’s direct reports, with custom modules on regulatory shift and cross-border governance.',
      quote: { text: "MLG didn't give us answers. They gave us a room where we couldn't avoid the hard ones.", author: "Eva Lange", role: "Group Head of Talent, Allianz" } },
    { name: 'Siemens',        meta: 'Digital industries division — senior cohort, two cohorts annually since 2017. Focused on transition leadership as the legacy industrial business reshapes around software and services.',
      quote: { text: "The cases were uncomfortable on purpose. That's why we keep coming back.", author: "Markus Renner", role: "SVP Digital Industries, Siemens" } },
    { name: 'BMW Group',      meta: 'Plant leadership academy across the European production network. A six-month track for plant directors and their successors, with rotations through Munich, Leipzig and Regensburg.',
      quote: { text: "We have run plant leadership academies for a decade. MLG is the only partner who pushed us harder than we pushed them.", author: "Stefan Becker", role: "Director Production Network, BMW Group" } },
    { name: 'Mercedes-Benz',  meta: 'Board practice intensives for next-generation NEDs. Designed with the supervisory board secretariat — eight participants per cohort, all chair-track within five years.',
      quote: { text: "Most board programmes teach optics. This one taught judgment.", author: "Dr. Andrea Vogt", role: "Member, Supervisory Board, Mercedes-Benz" } },
    { name: 'Bosch',          meta: 'Mobility solutions division — strategy intensive over four modules. Built around the difficult middle of the EV transition, with cases from in-house and Tier-1 peers.',
      quote: { text: "We came in with a strategy. We left questioning it — and improved it.", author: "Thomas Krüger", role: "Head of Strategy, Mobility Solutions, Bosch" } },
    { name: 'SAP',            meta: 'Founders-at-scale cohort for the enterprise software ecosystem. Half the room is past unicorn; half is on the way. We don’t smooth the difference.',
      quote: { text: "The mix of veterans and operators in the room is the whole point.", author: "Lena Hofmann", role: "Chief of Staff to the CEO, SAP" } },
    { name: 'BASF',           meta: 'Operating board readiness programme. Ten executives a year, two years to the seat, paired throughout with a current board mentor.',
      quote: { text: "By the time our fellows take the seat, they have lived the decisions ten times.", author: "Dr. Peter Stiehl", role: "CHRO, BASF" } },
    { name: 'Adidas',         meta: 'Brand leadership cohort — cross-functional by design. Marketing, product and ops in one room, working through the same case from three angles each session.',
      quote: { text: "Marketing, product, ops — same case, three answers, one room. That's the magic.", author: "Jana Weiss", role: "VP Global Brand Leadership, Adidas" } },
    { name: 'Lufthansa',      meta: 'Crisis leadership clinic, recurring since the 2020 restart. We bring the cases the press never saw and the decisions the airline still doesn’t discuss publicly.',
      quote: { text: "They worked the cases that never went public. Our team got better fast.", author: "Captain Daniel Roth", role: "Director Crisis Operations, Lufthansa" } },
    { name: 'Deutsche Bank',  meta: 'Risk and culture workshop at MD level. Closed cohorts of fifteen, with personal pre-reading and one regulator in the room each session.',
      quote: { text: "Having a regulator in the room changes every conversation.", author: "Sabine Klein", role: "MD, Risk & Culture, Deutsche Bank" } },
    { name: 'Munich Re',      meta: 'Reinsurance leadership track since 2016. We teach the trade, not the textbook — including the Bermuda flight and the syndicate visit.',
      quote: { text: "They taught the trade, not the textbook. That's rare.", author: "Friedrich Mayer", role: "Head of Reinsurance Talent, Munich Re" } },
    { name: 'Continental',    meta: 'Strategy under transition — closed cohort of twelve. Built when the company was deciding what to keep and what to spin out, with cases from both sides of the line.',
      quote: { text: "We made the spin-out call inside the programme. That tells you everything.", author: "Holger Schneider", role: "EVP Strategy, Continental" } },
    { name: 'Henkel',         meta: 'Consumer brands division — talent track for high-potential GMs. Twelve months, four modules, ending with a board-level recommendation each fellow defends.',
      quote: { text: "Each cohort closes with a board-level recommendation. Three of ours have shipped.", author: "Tanja Brandt", role: "Head of Talent, Consumer Brands, Henkel" } },
    { name: 'Audi',           meta: 'Engineering leadership in the electrification era. A cohort of fifteen R&D directors, drawn from the fastest-moving programmes inside the group.',
      quote: { text: "Electrification is a leadership problem before it's an engineering one. They get that.", author: "Dr. Matthias Bauer", role: "Head of R&D Leadership, Audi" } },
    { name: 'Porsche',        meta: 'Senior executive masterclass series. Quarterly half-day sessions for the top forty, plus a full week residential each November.',
      quote: { text: "Quarterly sessions plus the November week — it's the rhythm we run on.", author: "Christian Hartmann", role: "Member, Executive Board, Porsche" } },
    { name: 'Bayer',          meta: 'Crop science division — succession programme for general managers. Two-year cycle, paired with a current SVP throughout.',
      quote: { text: "The SVP pairing is what separates this from every other succession programme.", author: "Dr. Elena Fischer", role: "SVP Crop Science, Bayer" } },
    { name: 'Merck',          meta: 'Healthcare innovation cohort, biennial. Focused on the leadership challenge of long-cycle innovation when quarterly markets keep asking the wrong question.',
      quote: { text: "Long-cycle innovation in a quarterly market is a leadership challenge first.", author: "Dr. Anja Berger", role: "Head of Innovation Leadership, Merck" } },
    { name: 'Roche',          meta: 'Diagnostics leadership academy partner since 2018. We share faculty with their internal team and run the residentials in Munich and Basel.',
      quote: { text: "Sharing faculty across Basel and Munich made the whole thing portable.", author: "Marc Keller", role: "Head of Diagnostics Academy, Roche" } },
    { name: 'Volkswagen',     meta: 'Group strategy office — board practice for the heads of the brand groups. Closed sessions, no agenda published, no recordings.',
      quote: { text: "No agenda, no recordings — and the highest-stakes conversation of the year.", author: "Klaus Wagner", role: "Head of Group Strategy Office, Volkswagen" } },
    { name: 'Telefónica',     meta: 'Digital transformation cohort across EU markets. A twelve-month programme with field weeks in Munich, Madrid and Düsseldorf.',
      quote: { text: "Three field weeks across three markets — the cohort never lost momentum.", author: "Carlos Ruiz", role: "Chief Transformation Officer, Telefónica" } },
  ];

  const globeEl    = $('#globe');
  const globeStage = $('#globeStage');
  const cardName   = $('#globeCardName');
  const cardMeta   = $('#globeCardMeta');

  let chips  = [];        // [{el, x,y,z}]  unit-sphere coords
  let radius = 200;
  let rotY = 0, rotX = -12;
  let velY = 0;
  let isAuto = true;
  let dragG = null;
  let built = false;

  function buildGlobe() {
    if (built) return;
    built = true;

    // Stop the CSS keyframe spin — we drive rotation in JS now
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
      chip.textContent = c.name;
      chip.dataset.index = String(i);
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

    // Quote card — populate and reveal if this client has one
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

  // The "More" button has no destination yet — keep clicks inert for now.
  document.getElementById('globeCardMore')?.addEventListener('click', (e) => e.preventDefault());

  // Topbar toggle clicks — only after the deck is armed (selector passed)
  $$('.audience-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const aud = tab.dataset.audience;
      if (aud === currentAudience) return;
      selectAudience(aud);
      goTo(1);  // skip past the selector slide (index 0) to the first content slide
    });
  });

  // Selector slide — first-time audience pick that arms the deck and lifts
  // the toggle "up into the menu" (the topbar audience toggle fades in).
  const selectorSlide = $('.slide--selector');
  $$('.selector__tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const aud = tab.dataset.audience;
      $$('.selector__tab').forEach((t) => t.classList.toggle('is-picked', t === tab));
      selectAudience(aud);
      // brief beat of feedback, then arm + lift
      setTimeout(() => {
        deck.classList.add('is-armed');
        selectorSlide.classList.add('is-armed');
        setTimeout(() => goTo(1), 520);
        // Reset the selector content state once the slide is off-screen so
        // the user sees it again if they scroll back.
        setTimeout(() => {
          selectorSlide.classList.remove('is-armed');
          $$('.selector__tab').forEach((t) => t.classList.remove('is-picked'));
        }, 1500);
      }, 220);
    });
  });

  // Keyboard A/B/C on the selector slide
  window.addEventListener('keydown', (e) => {
    if (!selectorSlide.classList.contains('is-active')) return;
    if (deck.classList.contains('is-armed')) return;
    const letter = e.key.toUpperCase();
    const idx = 'ABC'.indexOf(letter);
    if (idx >= 0) {
      const tabs = $$('.selector__tab');
      if (tabs[idx]) { e.preventDefault(); tabs[idx].click(); }
    }
  });

  // Team slide — tab switching (core / associates)
  $$('.team-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      $$('.team-tab').forEach((t) => t.classList.toggle('is-active', t === tab));
      $$('.team-grid').forEach((g) => {
        g.hidden = g.dataset.pane !== target;
      });
      // Reset scroll to top of the new pane
      const wrap = document.querySelector('.team-wrap');
      if (wrap) wrap.scrollTop = 0;
    });
  });

  // Contact form — Typeform-style state machine. One question per step,
  // Enter / OK advances, choice clicks auto-advance, ← Back returns. No
  // backend wired yet — the final step is a confirmation card.
  const tf = $('#contactForm');
  if (tf) {
    const steps = $$('.tf__step', tf);
    const fill  = $('#tfFill');
    const totalAdvanceable = steps.length - 1; // last step is the "done" view
    let stepIdx = 0;
    const answers = {};

    function updateProgress() {
      const pct = Math.min(100, (stepIdx / totalAdvanceable) * 100);
      fill.style.width = pct + '%';
    }

    function show(idx) {
      steps.forEach((s, i) => s.classList.toggle('is-active', i === idx));
      stepIdx = idx;
      updateProgress();
      // Focus the input on the active step (if any) for a fluid keyboard flow
      const input = steps[idx].querySelector('input, textarea');
      if (input) setTimeout(() => input.focus(), 320);
    }

    function validate(step) {
      const required = step.dataset.required === '1';
      const type = step.dataset.type;
      const input = step.querySelector('input, textarea');
      const err = step.querySelector('.tf__error');
      if (err) err.hidden = true;
      if (!input) return true;
      const v = input.value.trim();
      if (required && !v) {
        input.focus();
        return false;
      }
      if (type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        if (err) err.hidden = false;
        input.focus();
        return false;
      }
      return true;
    }

    function next() {
      const step = steps[stepIdx];
      if (!validate(step)) return;
      const input = step.querySelector('input, textarea');
      if (input && step.dataset.field) answers[step.dataset.field] = input.value.trim();
      show(Math.min(stepIdx + 1, steps.length - 1));
    }

    function back() {
      show(Math.max(stepIdx - 1, 0));
    }

    function pickChoice(btn) {
      const step = steps[stepIdx];
      const field = step.dataset.field;
      const v = btn.dataset.value;
      $$('.tf__choice', step).forEach((c) => c.classList.toggle('is-selected', c === btn));
      if (field) answers[field] = v;
      // Brief highlight then advance
      setTimeout(() => show(Math.min(stepIdx + 1, steps.length - 1)), 280);
    }

    tf.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const action = btn.dataset.action;
      if (action === 'next')   { e.preventDefault(); next(); }
      else if (action === 'back') { e.preventDefault(); back(); }
      else if (action === 'submit') {
        e.preventDefault();
        // No backend yet — just advance to the confirmation step.
        const lastStep = steps[steps.length - 2];
        if (lastStep) {
          const input = lastStep.querySelector('input, textarea');
          if (input && lastStep.dataset.field) answers[lastStep.dataset.field] = input.value.trim();
        }
        show(steps.length - 1);
      }
      else if (btn.classList.contains('tf__choice')) {
        pickChoice(btn);
      }
    });

    // Enter advances (Shift+Enter in textarea keeps the newline)
    tf.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const step = steps[stepIdx];
      const isTextarea = e.target.tagName === 'TEXTAREA';
      if (isTextarea && e.shiftKey) return;
      e.preventDefault();
      const primary = step.querySelector('.tf__cta');
      if (primary && primary.dataset.action === 'submit') {
        // Final input step — submit
        if (!validate(step)) return;
        const input = step.querySelector('input, textarea');
        if (input && step.dataset.field) answers[step.dataset.field] = input.value.trim();
        show(steps.length - 1);
      } else if ($$('.tf__choice', step).length) {
        // Choice step — Enter picks the first choice for keyboard users
        const first = step.querySelector('.tf__choice.is-selected') || step.querySelector('.tf__choice');
        if (first) pickChoice(first);
      } else {
        next();
      }
    });

    // Letter keys for choice steps (A, B, C, ...)
    tf.addEventListener('keydown', (e) => {
      const step = steps[stepIdx];
      const choices = $$('.tf__choice', step);
      if (!choices.length) return;
      const letter = e.key.toUpperCase();
      const idx = 'ABCDEFGHIJ'.indexOf(letter);
      if (idx < 0 || idx >= choices.length) return;
      e.preventDefault();
      pickChoice(choices[idx]);
    });

    updateProgress();
  }

  function onGrab(e) {
    // Don't start a drag from a chip click — let the click handler win
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

  // Per-frame globe + chip update.
  // Architecture: the parent .globe owns the 3D rotation (rings & core go for
  // the ride). Chips are placed at fixed unit-sphere positions inside the
  // parent — the browser's 3D pipeline rotates them with the parent. JS only
  // computes each chip's *post-rotation* z so we can fade / scale / blur the
  // back hemisphere and counter-rotate the chip a touch to keep text upright.
  let chipsPlaced = false;
  function tickGlobe() {
    if (built) {
      if (isAuto) {
        rotY += 0.18;
      } else {
        rotY += velY;
        velY *= 0.94;
        if (Math.abs(velY) < 0.004) {
          velY = 0;
          // Momentum spent — resume auto-spin (unless the user is still dragging)
          if (!dragG) isAuto = true;
        }
      }

      globeEl.style.transform = `rotateY(${rotY}deg) rotateX(${rotX}deg)`;

      // One-time placement of chips in the un-rotated sphere frame
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

        // Apply the same rotation manually JUST to derive z for visuals.
        const x1 =  c.x * cosY + c.z * sinY;
        const z1 = -c.x * sinY + c.z * cosY;
        const z2 =  c.y * sinX + z1 * cosX;

        const t  = (z2 + 1) / 2;             // 0 far, 1 near
        const op = 0.12 + t * 0.88;
        const sc = 0.78 + t * 0.32;

        // Place at unit-sphere position (parent rotation does the visual move),
        // counter-rotate to keep label readable, scale by depth.
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
