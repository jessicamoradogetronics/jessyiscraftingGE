/**
 * Comportamiento general compartido por todas las páginas:
 * menú móvil, enlace de navegación activo, año del footer y lightbox
 * de imágenes.
 */
(function () {
  function markActiveLink() {
    const current = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.main-nav a').forEach((link) => {
      const href = link.getAttribute('href');
      if (href === current) {
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  function setupNavToggle() {
    const toggle = document.getElementById('navToggle');
    const drawer = document.getElementById('navDrawer');
    if (!toggle || !drawer) return;
    toggle.addEventListener('click', () => {
      const isOpen = drawer.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
    drawer.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        drawer.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function setupFooterYear() {
    const el = document.getElementById('footerYear');
    if (el) el.textContent = new Date().getFullYear();
  }

  function setupLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const closeBtn = document.getElementById('lightboxClose');
    if (!lightbox || !lightboxImg) return;

    function open(src, alt) {
      lightboxImg.src = src;
      lightboxImg.alt = alt || '';
      lightbox.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      lightbox.classList.remove('is-open');
      lightboxImg.src = '';
      document.body.style.overflow = '';
    }

    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-lightbox]');
      if (trigger) {
        const src = trigger.getAttribute('data-lightbox');
        const alt = trigger.getAttribute('alt') || trigger.getAttribute('data-alt') || '';
        open(src, alt);
      }
    });

    closeBtn && closeBtn.addEventListener('click', close);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  }

  function setupGalleryCarousel() {
    const carousel = document.querySelector('.gallery-carousel');
    if (!carousel) return;
    const viewport = carousel.querySelector('.gallery-carousel__viewport');
    const track = carousel.querySelector('.gallery-carousel__track');
    const slides = Array.from(carousel.querySelectorAll('.gallery-carousel__slide'));
    const prevBtn = carousel.querySelector('[data-carousel-prev]');
    const nextBtn = carousel.querySelector('[data-carousel-next]');
    if (!viewport || !track || slides.length < 2) return;

    let index = 0;

    function step(direction) {
      const first = slides[0];
      const slideWidth = first.getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
      const visible = Math.max(1, Math.floor((viewport.clientWidth + gap) / (slideWidth + gap)));
      const maxIndex = Math.max(0, slides.length - visible);

      index = Math.min(Math.max(index + direction, 0), maxIndex);
      track.style.transform = `translateX(${-index * (slideWidth + gap)}px)`;
      if (prevBtn) prevBtn.classList.toggle('is-disabled', index === 0);
      if (nextBtn) nextBtn.classList.toggle('is-disabled', index >= maxIndex);
    }

    prevBtn && prevBtn.addEventListener('click', () => step(-1.5));
    nextBtn && nextBtn.addEventListener('click', () => step(1.5));
    window.addEventListener('resize', () => step(0));
    step(0);
  }

  function init() {
    markActiveLink();
    setupNavToggle();
    setupFooterYear();
    setupLightbox();
    setupGalleryCarousel();
  }

  document.addEventListener('partials:loaded', init);
})();
