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
    const track = carousel.querySelector('.gallery-carousel__track');
    const prevBtn = carousel.querySelector('[data-carousel-prev]');
    const nextBtn = carousel.querySelector('[data-carousel-next]');
    if (!track) return;

    function scrollByAmount(direction) {
      const slide = track.querySelector('.gallery-carousel__slide');
      const step = slide ? slide.getBoundingClientRect().width + 18 : track.clientWidth * 0.8;
      track.scrollBy({ left: direction * step, behavior: 'smooth' });
    }

    prevBtn && prevBtn.addEventListener('click', () => scrollByAmount(-1));
    nextBtn && nextBtn.addEventListener('click', () => scrollByAmount(1));
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
