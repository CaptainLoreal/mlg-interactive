(function () {
  var slides = [
    { title: 'Welcome',         href: 'index.html#slide=0' },
    { title: 'Clients',         href: 'index.html#slide=2' },
    { title: 'Approach',        href: 'index.html#slide=3' },
    { title: 'Services',        href: 'index.html#slide=4', dropdown: [
      { label: 'Leadership Development',  href: 'leadership-development.html' },
      { label: 'Coaching & Sparring',     href: 'coaching-sparring.html' },
      { label: 'Audits & Assessments',    href: 'audits-assessments.html' },
      { label: 'Cultural Transformation', href: 'cultural-transformation.html' },
    ]},
    { title: 'Why MLG',         href: 'index.html#slide=5' },
    { title: 'Tools',           href: 'index.html#slide=6' },
    { title: 'Team',            href: 'index.html#slide=7' },
    { title: 'Contact',         href: 'index.html#slide=8' },
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
})();
