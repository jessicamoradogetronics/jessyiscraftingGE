/**
 * Lógica de la página Tienda: renderiza la rejilla de productos a partir
 * de data/products.json combinado con los textos traducidos de i18n,
 * y gestiona el filtro por categoría (con soporte de #hash en la URL).
 */
(function () {
  let products = [];
  let activeCategory = 'all';

  const CATEGORY_ORDER = ['artesanias', 'dibujos', 'cuadros', 'figuras'];

  function formatPrice(product, dict) {
    const currency = '€';
    const amount = Number.isInteger(product.price) ? product.price : product.price.toFixed(2);
    const prefix = product.priceFrom ? `<span class="price__from">${dict.common.from}</span>` : '';
    return `${prefix}${amount}${currency}`;
  }

  function productCard(product, dict) {
    const t = dict.products[product.id] || {};
    const cat = dict.categories[product.category] || {};
    const img = product.images[0];
    return `
      <article class="product-card">
        <a class="product-card__media" href="producto.html?id=${product.id}">
          <picture>
            <source srcset="${img}-thumb.webp" type="image/webp">
            <img src="${img}-thumb.jpg" alt="${t.name || ''}" loading="lazy" width="640" height="800">
          </picture>
          ${product.customizable ? `<span class="badge badge--gold">${dict.common.customizable}</span>` : ''}
        </a>
        <div class="product-card__body">
          <span class="product-card__cat">${cat.name || ''}</span>
          <h3 class="product-card__title"><a href="producto.html?id=${product.id}">${t.name || ''}</a></h3>
          <p class="product-card__desc">${t.short || ''}</p>
          <div class="product-card__footer">
            <span class="price">${formatPrice(product, dict)}</span>
            <a class="btn btn--outline btn--sm" href="producto.html?id=${product.id}">${dict.common.viewProduct}</a>
          </div>
          <button type="button" class="btn btn--primary btn--sm btn--block" data-add-to-cart="${product.id}">${dict.cart.addButton}</button>
        </div>
      </article>
    `;
  }

  function render() {
    const dict = window.JIC_I18N.getDict();
    const grid = document.getElementById('productGrid');
    const emptyState = document.getElementById('productEmpty');
    if (!dict || !grid) return;

    const filtered = activeCategory === 'all'
      ? products
      : products.filter((p) => p.category === activeCategory);

    grid.innerHTML = filtered.map((p) => productCard(p, dict)).join('');
    if (emptyState) emptyState.hidden = filtered.length !== 0;

    document.querySelectorAll('.store-filters button').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.category === activeCategory);
    });
  }

  function setupFilters() {
    const filterBar = document.getElementById('storeFilters');
    if (!filterBar) return;
    filterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-category]');
      if (!btn) return;
      activeCategory = btn.dataset.category;
      history.replaceState(null, '', activeCategory === 'all' ? 'tienda.html' : `tienda.html#${activeCategory}`);
      render();
    });
  }

  function applyInitialHash() {
    const hash = location.hash.replace('#', '');
    if (CATEGORY_ORDER.includes(hash)) activeCategory = hash;
  }

  function init() {
    applyInitialHash();
    setupFilters();

    const productsReady = fetch('data/products.json').then((res) => res.json());
    const dictReady = window.JIC_I18N.getDict()
      ? Promise.resolve()
      : new Promise((resolve) => document.addEventListener('i18n:ready', resolve, { once: true }));

    Promise.all([productsReady, dictReady])
      .then(([data]) => {
        products = data;
        render();
      })
      .catch((err) => console.error('No se pudieron cargar los productos', err));

    document.addEventListener('i18n:ready', render);
  }

  document.addEventListener('partials:loaded', init);
})();
