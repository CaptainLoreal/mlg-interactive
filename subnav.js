(function () {
  // Indices match the live slide NodeList in index.html:
  // 0=Welcome 1=Tailor 2=Clients 3=Testimonials 4=Approach 5=Services
  // 6=Why-MLG 7=Tools(hidden) 8=Team 9=Contact
  var slides = [
    { title: 'Clients',         href: 'index.html#slide=2' },
    { title: 'Approach',        href: 'index.html#slide=4' },
    { title: 'Services',        href: 'index.html#slide=5', dropdown: [
      { label: 'Leadership Development',  href: 'leadership-development.html' },
      { label: 'Coaching & Sparring',     href: 'coaching-sparring.html' },
      { label: 'Audits & Assessments',    href: 'audits-assessments.html' },
      { label: 'Cultural Transformation', href: 'cultural-transformation.html' },
    ]},
    { title: 'Why MLG',         href: 'index.html#slide=6' },
    { title: 'Team',            href: 'index.html#slide=8' },
    { title: 'Contact',         href: 'index.html#slide=9' },
  ];

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
      btn.innerHTML = slide.title + '<svg class="slide-nav__chevron" viewBox="0 0 10 6" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 1l4 4 4-4"/></svg>';

      var drop = document.createElement('div');
      drop.className = 'slide-nav__dropdown';
      slide.dropdown.forEach(function (item) {
        var a = document.createElement('a');
        a.className = 'slide-nav__dropdown-item' + (item.href === page ? ' is-active' : '');
        a.href = item.href;
        a.textContent = item.label;
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
    '<button class="lang-switch__btn" data-lang="de">DE</button>' +
    '<button class="lang-switch__btn is-active" data-lang="en">EN</button>';
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

  /* ── Language switcher init ── */
  (function () {
    function applyLang(lang) {
      document.documentElement.lang = lang;
      localStorage.setItem('mlg-lang', lang);
      document.querySelectorAll('.lang-switch__btn').forEach(function (b) {
        b.classList.toggle('is-active', b.dataset.lang === lang);
      });
      document.querySelectorAll('[data-en][data-de]').forEach(function (el) {
        el.textContent = lang === 'de' ? el.dataset.de : el.dataset.en;
      });
    }
    var saved = localStorage.getItem('mlg-lang') || 'en';
    applyLang(saved);
    document.querySelectorAll('.lang-switch__btn').forEach(function (btn) {
      btn.addEventListener('click', function () { applyLang(btn.dataset.lang); });
    });
  })();
})();
