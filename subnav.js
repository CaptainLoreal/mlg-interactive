(function () {
  var slides = [
    { title: 'Welcome',         href: 'index.html' },
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
})();
