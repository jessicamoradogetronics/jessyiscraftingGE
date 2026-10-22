/**
 * Lógica de la página de detalle de producto (producto.html?id=...).
 * Busca el producto en data/products.json, pinta la galería, el precio,
 * la descripción/personalización traducida y productos relacionados.
 */
(function () {
  let products = [];
  let currentProduct = null;

  function getIdFromUrl() {
    return new URLSearchParams(location.search).get('id');
  }

  function formatPrice(product, dict) {
    const currency = '€';
    const amount = Number.isInteger(product.price) ? product.price : product.price.toFixed(2);
    const prefix = product.priceFrom ? `${dict.common.from} ` : '';
    return `${prefix}${amount}${currency}`;
  }

  function renderGallery(product, name) {
    const main = document.getElementById('galleryMain');
    const thumbs = document.getElementById('galleryThumbs');
    if (!main) return;

    function setMain(index) {
      const base = product.images[index];
      main.innerHTML = `
        <picture>
          <source srcset="${base}.webp" type="image/webp">
          <img src="${base}.jpg" alt="${name}" id="galleryMainImg" data-lightbox="${base}.jpg" data-alt="${name}">
        </picture>`;
      thumbs?.querySelectorAll('button').forEach((b, i) => b.classList.toggle('is-active', i === index));
    }

    setMain(0);

    if (thumbs && product.images.length > 1) {
      thumbs.innerHTML = product.images.map((img, i) => `
        <button type="button" class="${i === 0 ? 'is-active' : ''}" data-index="${i}" aria-label="Imagen ${i + 1}">
          <img src="${img}-thumb.jpg" alt="">
        </button>
      `).join('');
      thumbs.querySelectorAll('button').forEach((btn) => {
        btn.addEventListener('click', () => setMain(Number(btn.dataset.index)));
      });
    } else if (thumbs) {
      thumbs.innerHTML = '';
    }
  }

  function renderRelated(dict) {
    const container = document.getElementById('relatedProducts');
    if (!container || !currentProduct) return;
    const related = products
      .filter((p) => p.category === currentProduct.category && p.id !== currentProduct.id)
      .slice(0, 3);

    container.innerHTML = related.map((p) => {
      const t = dict.products[p.id] || {};
      const img = p.images[0];
      return `
        <article class="product-card">
          <a class="product-card__media" href="producto.html?id=${p.id}">
            <picture>
              <source srcset="${img}-thumb.webp" type="image/webp">
              <img src="${img}-thumb.jpg" alt="${t.name || ''}" loading="lazy" width="640" height="800">
            </picture>
          </a>
          <div class="product-card__body">
            <h3 class="product-card__title"><a href="producto.html?id=${p.id}">${t.name || ''}</a></h3>
            <div class="product-card__footer">
              <span class="price">${formatPrice(p, dict)}</span>
              <a class="btn btn--outline btn--sm" href="producto.html?id=${p.id}">${dict.common.viewProduct}</a>
            </div>
          </div>
        </article>`;
    }).join('');

    const relatedSection = document.getElementById('relatedSection');
    if (relatedSection) relatedSection.hidden = related.length === 0;
  }

  function render() {
    const dict = window.JIC_I18N.getDict();
    if (!dict || !currentProduct) return;
    const t = dict.products[currentProduct.id] || {};
    const cat = dict.categories[currentProduct.category] || {};

    document.title = `${t.name} · JessyIsCrafting`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && t.short) metaDesc.setAttribute('content', t.short);

    document.getElementById('productCategory').textContent = cat.name || '';
    document.getElementById('productTitle').textContent = t.name || '';
    document.getElementById('productDescription').textContent = t.description || '';
    document.getElementById('productPrice').textContent = formatPrice(currentProduct, dict);
    document.getElementById('breadcrumbCurrent').textContent = t.name || '';
    document.getElementById('breadcrumbCategory').textContent = cat.name || '';
    document.getElementById('breadcrumbCategory').setAttribute('href', `tienda.html#${currentProduct.category}`);

    const customBox = document.getElementById('customizationBox');
    if (currentProduct.customizable && t.customization) {
      customBox.hidden = false;
      document.getElementById('customizationText').textContent = t.customization;
    } else if (customBox) {
      customBox.hidden = true;
    }

    const orderBtn = document.getElementById('orderButton');
    if (orderBtn) orderBtn.href = `contacto.html?producto=${encodeURIComponent(t.name || currentProduct.id)}`;

    renderGallery(currentProduct, t.name || '');
    renderRelated(dict);
  }

  function init() {
    const id = getIdFromUrl();
    fetch('data/products.json')
      .then((res) => res.json())
      .then((data) => {
        products = data;
        currentProduct = products.find((p) => p.id === id);
        const notFound = document.getElementById('productNotFound');
        const wrapper = document.getElementById('productWrapper');
        if (!currentProduct) {
          if (notFound) notFound.hidden = false;
          if (wrapper) wrapper.hidden = true;
          return;
        }
        if (window.JIC_I18N.getDict()) render();
      })
      .catch((err) => console.error('No se pudo cargar el producto', err));

    document.addEventListener('i18n:ready', render);
  }

  document.addEventListener('partials:loaded', init);
})();
