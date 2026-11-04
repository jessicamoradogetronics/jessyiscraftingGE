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
    const prevBtn = document.getElementById('lightboxPrev');
    const nextBtn = document.getElementById('lightboxNext');
    if (!lightbox || !lightboxImg) return;

    let items = [];
    let current = 0;

    function show(index) {
      current = (index + items.length) % items.length;
      lightboxImg.src = items[current].src;
      lightboxImg.alt = items[current].alt || '';
      const multi = items.length > 1;
      if (prevBtn) prevBtn.hidden = !multi;
      if (nextBtn) nextBtn.hidden = !multi;
    }
    function open(list, index = 0) {
      items = list;
      show(index);
      lightbox.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      lightbox.classList.remove('is-open');
      lightboxImg.src = '';
      document.body.style.overflow = '';
    }

    window.openLightbox = open;

    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-lightbox]');
      if (trigger) {
        const src = trigger.getAttribute('data-lightbox');
        const alt = trigger.getAttribute('alt') || trigger.getAttribute('data-alt') || '';
        open([{ src, alt }], 0);
      }
    });

    closeBtn && closeBtn.addEventListener('click', close);
    prevBtn && prevBtn.addEventListener('click', () => show(current - 1));
    nextBtn && nextBtn.addEventListener('click', () => show(current + 1));
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) close();
    });
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
    });
  }

  function setupGalleryCarousel() {
    const root = document.querySelector('.gallery-carousel');
    if (!root) return;
    const viewport = root.querySelector('.gallery-carousel__viewport');
    const track = root.querySelector('.gallery-carousel__track');
    const slides = Array.from(root.querySelectorAll('.gallery-carousel__slide'));
    const dotsNav = root.querySelector('.gallery-carousel__dots');
    const prev = root.querySelector('[data-carousel-prev]');
    const next = root.querySelector('[data-carousel-next]');
    const status = root.querySelector('.gallery-carousel__sr');
    if (!viewport || !track || !prev || !next || slides.length < 2) return;

    const n = slides.length;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let index = 0;
    let timer = null;
    let startX = null;

    const dots = slides.map((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'gallery-carousel__dot';
      dot.setAttribute('aria-label', `Imagen ${i + 1} de ${n}`);
      dot.addEventListener('click', () => { show(i); restart(); });
      if (dotsNav) dotsNav.appendChild(dot);
      return dot;
    });

    function show(i) {
      index = ((i % n) + n) % n;
      track.style.transform = `translateX(${-index * 100}%)`;
      slides.forEach((slide, k) => { slide.inert = k !== index; });
      dots.forEach((dot, k) => {
        if (k === index) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
      if (status) status.textContent = `Imagen ${index + 1} de ${n}`;
    }

    function restart() {
      clearInterval(timer);
      if (!reduceMotion) timer = setInterval(() => show(index + 1), 5000);
    }

    prev.addEventListener('click', () => { show(index - 1); restart(); });
    next.addEventListener('click', () => { show(index + 1); restart(); });
    root.addEventListener('mouseenter', () => clearInterval(timer));
    root.addEventListener('mouseleave', restart);

    viewport.addEventListener('pointerdown', (e) => { startX = e.clientX; });
    viewport.addEventListener('pointerup', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 40) { show(index + (dx < 0 ? 1 : -1)); restart(); }
    });
    viewport.addEventListener('pointercancel', () => { startX = null; });

    show(0);
    restart();
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
