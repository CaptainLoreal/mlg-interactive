(function () {
  // Indices match the live slide NodeList in index.html as of the
  // 2026-06-15 reorder (Vision added between Approach and Testimonials):
  //   0=Welcome 1=Services 2=Clients 3=Approach 4=Why-MLG 5=Vision
  //   6=Testimonials 7=Tools(hidden) 8=Team 9=Book 10=Contact
  // Items below mirror the desktop slide-nav order in app.js
  // (Welcome/Vision/Testimonials/Tools filtered out).
  //
  // IMPORTANT: if you reorder slides, also update these indices —
  // the old indices left Team pointing at the hidden Tools slide,
  // which silently scrolled the user back to the Welcome hero.

  // Path prefix — quarterly pages live in /leadership-quarterly/ so
  // every href needs '../' to reach the index/services subpages.
  var inSubdir = location.pathname.indexOf('/leadership-quarterly/') !== -1;
  var P = inSubdir ? '../' : '';

  var slides = [
    { title: 'Services',        href: P + 'index.html#slide=1', dropdown: [
      { label: 'Leadership Development',  de: 'Führungskräfteentwicklung', href: P + 'leadership-development.html' },
      { label: 'Coaching & Sparring',     href: P + 'coaching-sparring.html' },
      { label: 'Audits & Assessments',    href: P + 'audits-assessments.html' },
      { label: 'Cultural Transformation', de: 'Kulturelle Transformation', href: P + 'cultural-transformation.html' },
    ]},
    { title: 'Clients',         href: P + 'index.html#slide=2' },
    { title: 'Approach',        href: P + 'index.html#slide=3' },
    { title: 'Why MLG',         href: P + 'index.html#slide=4' },
    { title: 'Team',            href: P + 'index.html#slide=8' },
    { title: 'Book',            href: P + 'index.html#slide=9' },
    { title: 'Contact',         href: P + 'index.html#slide=10' },
  ];

  // German labels for the nav titles. Brand service names in the dropdown
  // (Leadership Development, Coaching & Sparring, …) deliberately stay English.
  var NAV_DE = {
    'Services': 'Leistungen',
    'Clients':  'Kunden',
    'Approach': 'Ansatz',
    'Why MLG':  'Warum MLG',
    'Team':     'Team',
    'Book':     'Buch',
    'Contact':  'Kontakt',
  };

  var topbar = document.querySelector('.topbar');
  if (!topbar) return;



  var page = location.pathname.split('/').pop() || 'index.html';

  /* ── Desktop slide-nav ── */
  var nav = document.createElement('nav');
  nav.className = 'slide-nav';
  nav.setAttribute('aria-label', 'Slide navigation');

  slides.forEach(function (slide) {
    if (slide.dropdown) {
      var isServicePage = slide.dropdown.some(function (d) { return d.href === page; });

      var wrap = document.createElement('div');
      wrap.className = 'slide-nav__dropdown-wrap';

      var btn = document.createElement('a');
      btn.className = 'slide-nav__btn slide-nav__btn--has-drop' + (isServicePage ? ' is-active' : '');
      btn.href = slide.href;
      btn.innerHTML = '<span data-de="' + (NAV_DE[slide.title] || slide.title) + '">' + slide.title + '</span><svg class="slide-nav__chevron" viewBox="0 0 10 6" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 1l4 4 4-4"/></svg>';

      var drop = document.createElement('div');
      drop.className = 'slide-nav__dropdown';
      slide.dropdown.forEach(function (item) {
        var a = document.createElement('a');
        a.className = 'slide-nav__dropdown-item' + (item.href === page ? ' is-active' : '');
        a.href = item.href;
        a.textContent = item.label;
        if (item.de) a.dataset.de = item.de;
        drop.appendChild(a);
      });

      wrap.appendChild(btn);
      wrap.appendChild(drop);
      nav.appendChild(wrap);
    } else {
      var a = document.createElement('a');
      a.className = 'slide-nav__btn';
      a.href = slide.href;
      a.textContent = slide.title;
      if (NAV_DE[slide.title]) a.dataset.de = NAV_DE[slide.title];
      nav.appendChild(a);
    }
  });

  topbar.appendChild(nav);

  /* ── Burger button (shown on mobile) ── */
  var burger = document.createElement('button');
  burger.className = 'burger';
  burger.setAttribute('aria-label', 'Open menu');
  burger.setAttribute('aria-expanded', 'false');
  burger.setAttribute('aria-controls', 'subMobileNav');
  burger.innerHTML =
    '<svg class="burger__icon burger__icon--open" viewBox="0 0 22 16" width="22" height="16" fill="none" aria-hidden="true">' +
      '<rect y="0" width="22" height="1.5" rx="1" fill="currentColor"/>' +
      '<rect y="7" width="22" height="1.5" rx="1" fill="currentColor"/>' +
      '<rect y="14" width="22" height="1.5" rx="1" fill="currentColor"/>' +
    '</svg>' +
    '<svg class="burger__icon burger__icon--close" viewBox="0 0 18 18" width="18" height="18" fill="none" aria-hidden="true">' +
      '<line x1="1" y1="1" x2="17" y2="17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '<line x1="17" y1="1" x2="1" y2="17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
    '</svg>';
  /* ── Language switcher ── */
  var langSwitch = document.createElement('div');
  langSwitch.className = 'lang-switch';
  langSwitch.setAttribute('aria-label', 'Language switcher');
  langSwitch.innerHTML =
    '<button class="lang-switch__btn is-active" data-lang="en">EN</button>' +
    '<button class="lang-switch__btn" data-lang="de">DE</button>';
  topbar.appendChild(langSwitch);

  topbar.appendChild(burger);

  /* ── Mobile nav drawer ── */
  var mobileNav = document.createElement('nav');
  mobileNav.className = 'mobile-nav';
  mobileNav.id = 'subMobileNav';
  mobileNav.setAttribute('aria-label', 'Mobile navigation');
  mobileNav.setAttribute('aria-hidden', 'true');

  slides.forEach(function (slide) {
    var a = document.createElement('a');
    a.className = 'mobile-nav__item';
    a.href = slide.href;
    a.textContent = slide.title;
    if (NAV_DE[slide.title]) a.dataset.de = NAV_DE[slide.title];

    if (slide.dropdown) {
      var isServicePage = slide.dropdown.some(function (d) { return d.href === page; });
      if (isServicePage) a.classList.add('is-active');

      var sub = document.createElement('div');
      sub.className = 'mobile-nav__sub';
      slide.dropdown.forEach(function (item) {
        var sa = document.createElement('a');
        sa.className = 'mobile-nav__sub-item' + (item.href === page ? ' is-active' : '');
        sa.href = item.href;
        sa.textContent = item.label;
        if (item.de) sa.dataset.de = item.de;
        sub.appendChild(sa);
      });
      mobileNav.appendChild(a);
      mobileNav.appendChild(sub);
    } else {
      mobileNav.appendChild(a);
    }
  });

  document.body.appendChild(mobileNav);

  /* ── Toggle ── */
  function openNav() {
    burger.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    mobileNav.classList.add('is-open');
    mobileNav.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeNav() {
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    mobileNav.classList.remove('is-open');
    mobileNav.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  burger.addEventListener('click', function () {
    burger.classList.contains('is-open') ? closeNav() : openNav();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNav();
  });

  /* ── Corner mark: wire flyMark if on main page, navigate home on subpages ── */
  var cm = document.querySelector('.corner-mark');
  if (cm) {
    if (window.MLG && window.MLG.flyMark) {
      // Main page — flyMark already wired in app.js; ensure it's accessible on mobile
      cm.style.cursor = 'pointer';
    } else {
      // Subpages — make the mark navigate back to the homepage
      cm.style.cursor = 'pointer';
      cm.setAttribute('role', 'button');
      cm.setAttribute('tabindex', '0');
      cm.setAttribute('aria-label', 'Back to home');
      function triggerFly() {
        if (window.MLG && window.MLG.flyMark) { window.MLG.flyMark(cm); }
        setTimeout(function () { location.href = 'index.html'; }, 320);
      }
      cm.addEventListener('click', triggerFly);
      cm.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') triggerFly(); });
    }
  }

  /* ── Global footer award (Brandon Hall) — inject above every imprint ── */
  (function () {
    var imprint = document.querySelector('.imprint');
    if (!imprint || document.querySelector('.site-award')) return;
    var award = document.createElement('div');
    award.className = 'site-award';
    award.innerHTML =
      '<p class="site-award__label" data-de="Ausgezeichnete Leistung">Awarded performance</p>' +
      '<p class="site-award__text" data-de="MLG gehört zu den Gewinnern der internationalen Brandon Hall Excellence Awards in der Kategorie „Best Advance in Performance Management“ – ausgezeichnet für ein globales Projekt mit der Bayer AG.">MLG is among the winners of the international Brandon Hall Excellence Awards in the category „Best Advance in Performance Management“ – awarded for a global project with Bayer AG.</p>' +
      '<img class="site-award__badge" src="' + (location.pathname.indexOf('/de/') > -1 ? '../' : P) + 'assets/badge-brandon-hall.png" alt="Brandon Hall Group HCM Excellence Awards — Bronze, Excellence in Talent Management 2015" loading="lazy" decoding="async" width="203" height="144">';
    imprint.parentNode.insertBefore(award, imprint);
  })();

  /* ── PDF export (Generate PDF button on team bio pages) ──
     iOS Safari ignores `@page size: A4` for content-height; it paginates
     based on the *current viewport* CSS-pixel layout. On a phone that
     viewport is ~390px wide → the laid-out page is very tall → the print
     spills onto multiple pages even though styles.css clips with
     max-height: 297mm + overflow: hidden.
     Fix: widen the viewport meta to A4-portrait pixel width (794 ≈ 210mm
     at 96 dpi) right before print() so iOS re-lays out at A4 width; the
     existing one-page print rule then renders a clean single-page PDF.
     Restore the original viewport on afterprint (or after a fallback
     timeout — iOS's afterprint is unreliable). */
  (function () {
    var meta = document.querySelector('meta[name="viewport"]');
    if (!meta) return;
    function isMobile() {
      return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
             window.matchMedia('(max-width: 760px)').matches;
    }
    var origContent = meta.getAttribute('content');
    var restoring = false;
    function restoreViewport() {
      if (restoring) return; restoring = true;
      if (origContent != null) meta.setAttribute('content', origContent);
      window.removeEventListener('afterprint', restoreViewport);
    }
    function printPdf(e) {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      restoring = false;
      if (isMobile()) {
        // 794 CSS px ≈ A4 portrait width at 96 dpi. iOS reflows to this
        // width, then the print CSS's max-height: 297mm + overflow: hidden
        // clips the content to a single page.
        meta.setAttribute('content', 'width=794, initial-scale=1');
      }
      window.addEventListener('afterprint', restoreViewport);

      /* Force any lazy-loaded images to load BEFORE print(). iOS Safari
         doesn't load loading="lazy" images for print, so the hero banner
         was rendering as a solid black box on mobile PDF exports. Flip
         every img.loading to 'eager', then wait for them all to finish
         decoding (with a generous 3s safety fallback) before calling
         window.print(). */
      Array.prototype.forEach.call(
        document.querySelectorAll('img[loading="lazy"]'),
        function (img) { img.loading = 'eager'; }
      );
      var imgs = Array.prototype.slice.call(document.querySelectorAll('img'));
      var pending = imgs.filter(function (img) { return !img.complete; });
      var printed = false;
      function doPrint() {
        if (printed) return; printed = true;
        // iOS Safari needs a beat to apply the new viewport before print().
        setTimeout(function () { window.print(); }, isMobile() ? 200 : 0);
        // Fallback in case afterprint never fires (iOS).
        setTimeout(restoreViewport, 4000);
      }
      if (pending.length === 0) {
        doPrint();
      } else {
        var remaining = pending.length;
        function tick() {
          remaining--;
          if (remaining <= 0) doPrint();
        }
        pending.forEach(function (img) {
          img.addEventListener('load', tick, { once: true });
          img.addEventListener('error', tick, { once: true });
        });
        // Safety: print anyway after 3s so a stuck image doesn't block forever.
        setTimeout(doPrint, 3000);
      }
    }
    window.MLG = window.MLG || {};
    window.MLG.printPdf = printPdf;
    function bindButtons() {
      document.querySelectorAll('button[onclick*="window.print"], a[onclick*="window.print"]').forEach(function (btn) {
        btn.removeAttribute('onclick');
        btn.addEventListener('click', printPdf);
      });
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bindButtons);
    } else {
      bindButtons();
    }
  })();

  /* ── Language switcher init ── */
  (function () {
    function applyLang(lang) {
      document.documentElement.lang = lang;
      try { localStorage.setItem('mlg-lang', lang); } catch (e) {}
      document.querySelectorAll('.lang-switch__btn').forEach(function (b) {
        b.classList.toggle('is-active', b.dataset.lang === lang);
      });
      // Translatable content carries only data-de; authored English stays as
      // the element's markup and is captured once. innerHTML keeps inline tags.
      document.querySelectorAll('[data-de]').forEach(function (el) {
        if (el.__en == null) el.__en = el.innerHTML;
        el.innerHTML = lang === 'de' ? el.dataset.de : el.__en;
      });
      document.querySelectorAll('[data-de-ph]').forEach(function (el) {
        if (el.__enph == null) el.__enph = el.getAttribute('placeholder') || '';
        el.setAttribute('placeholder', lang === 'de' ? el.dataset.dePh : el.__enph);
      });
    }
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
  })();
})();
