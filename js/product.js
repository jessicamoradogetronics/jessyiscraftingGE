/**
 * Lógica de la página de detalle de producto (producto.html?id=...).
 * Busca el producto en data/products.json, pinta la galería, el precio,
 * la descripción/personalización traducida y productos relacionados.
 */
(function () {
  let products = [];
  let currentProduct = null;
  let addonQty = {};

  function getIdFromUrl() {
    return new URLSearchParams(location.search).get('id');
  }

  function formatPrice(product, dict) {
    const currency = '€';
    const amount = Number.isInteger(product.price) ? product.price : product.price.toFixed(2);
    const prefix = product.priceFrom ? `${dict.common.from} ` : '';
    return `${prefix}${amount}${currency}`;
  }

  function renderGallery(product, name, dict) {
    const main = document.getElementById('galleryMain');
    const thumbs = document.getElementById('galleryThumbs');
    if (!main) return;

    function setMain(index) {
      const base = product.images[index];
      main.innerHTML = `
        <button type="button" class="product-gallery__open" aria-label="${dict.productDetail.zoomImage}">
          <picture>
            <source srcset="${base}.webp" type="image/webp">
            <img src="${base}.jpg" alt="${name}" id="galleryMainImg">
          </picture>
          <span class="product-gallery__zoom" aria-hidden="true">+</span>
        </button>`;
      main.querySelector('button').addEventListener('click', () => {
        window.openLightbox(product.images.map((b) => ({ src: `${b}.jpg`, alt: name })), index);
      });
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

  let selection = { mode: 'none', finish: null, size: null, notes: '' };

  function resetSelection() {
    selection = { mode: 'none', finish: null, size: null, notes: '' };
  }

  function finishNames(t) {
    return t.finishes || {};
  }

  function defaultSize() {
    const sizes = currentProduct.sizes || [];
    return sizes.find((s) => s.default) || sizes[0] || null;
  }

  function customPayload(t) {
    const payload = {};
    if (selection.finish) payload.finish = finishNames(t)[selection.finish] || selection.finish;
    const notes = selection.notes.trim();
    if (notes) payload.notes = notes;
    return payload;
  }

  function syncCartData(t) {
    const btn = document.getElementById('addToCartBtn');
    if (!btn) return;
    btn.dataset.custom = selection.mode === 'custom' ? JSON.stringify(customPayload(t)) : '';
    const size = selection.mode === 'custom' && selection.size ? selection.size : (defaultSize() || {}).id;
    btn.dataset.size = size || '';
  }

  function renderCustom(dict, t) {
    const tr = dict.productDetail || {};
    const choice = document.getElementById('customChoice');
    const box = document.getElementById('customizationBox');
    const options = currentProduct.customOptions || {};
    const finishes = options.finishes || [];
    const names = finishNames(t);
    const finishLabel = t.finishLabel || tr.customFinishLabel || '';

    if (!currentProduct.customizable || !t.customization) {
      resetSelection();
      if (choice) choice.hidden = true;
      if (box) box.hidden = true;
      syncCartData(t);
      return;
    }

    if (!selection.finish && finishes.length) selection.finish = finishes[0].id;

    const sizes = currentProduct.sizes || [];
    const sizeNames = t.sizes || {};
    if (!selection.size && sizes.length) selection.size = defaultSize().id;
    const selectedSize = sizes.find((s) => s.id === selection.size);

    if (choice) {
      choice.hidden = false;
      choice.innerHTML = `
        <span class="custom-choice__label">${tr.customChoiceLabel || ''}</span>
        <div class="custom-choice__track">
          <button type="button" class="custom-choice__btn ${selection.mode === 'none' ? 'is-active' : ''}" data-custom-mode="none" aria-pressed="${selection.mode === 'none'}">${tr.customNone || ''}</button>
          <button type="button" class="custom-choice__btn ${selection.mode === 'custom' ? 'is-active' : ''}" data-custom-mode="custom" aria-pressed="${selection.mode === 'custom'}">${tr.customYes || ''}</button>
        </div>`;
    }

    if (box) {
      box.hidden = selection.mode !== 'custom';
      const finishBlock = finishes.length ? `
        <span class="customization-box__label">${finishLabel}</span>
        <p class="customization-box__selected">${tr.customSelected || ''}: <strong>${names[selection.finish] || ''}</strong></p>
        <div class="swatches" role="radiogroup" aria-label="${finishLabel}">
          ${finishes.map((f) => `
            <button type="button" class="swatch ${f.id === selection.finish ? 'is-active' : ''}" role="radio" aria-checked="${f.id === selection.finish}" data-finish="${f.id}">
              <span class="swatch__dot" style="background:${f.color}"></span>
              <span class="swatch__name">${names[f.id] || f.id}</span>
            </button>`).join('')}
        </div>` : '';
      const sizeBlock = sizes.length ? `
        <span class="customization-box__label">${tr.customSizeLabel || ''}</span>
        <p class="customization-box__selected">${tr.customSelected || ''}: <strong>${sizeNames[selection.size] || ''}${selectedSize ? ` · ${formatPrice({ price: selectedSize.price }, dict)}` : ''}</strong></p>
        <div class="swatches" role="radiogroup" aria-label="${tr.customSizeLabel || ''}">
          ${sizes.map((s) => `
            <button type="button" class="swatch ${s.id === selection.size ? 'is-active' : ''}" role="radio" aria-checked="${s.id === selection.size}" data-size="${s.id}">
              <span class="swatch__name">${sizeNames[s.id] || s.id}</span>
            </button>`).join('')}
        </div>` : '';
      const notesBlock = options.notes ? `
        <label class="customization-box__label" for="notesInput">${tr.customNotesLabel || ''}</label>
        <div class="notes-field">
          <textarea id="notesInput" rows="4" maxlength="${options.notes.maxLength}" placeholder="${tr.customNotesPlaceholder || ''}"></textarea>
        </div>` : '';
      box.innerHTML = `
        <div class="customization-box__head">
          <span class="customization-box__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></span>
          <div>
            <h3>${tr.customizationTitle || ''}</h3>
            <p>${t.customization}</p>
          </div>
        </div>
        ${finishBlock}
        ${sizeBlock}
        ${notesBlock}`;
      const input = box.querySelector('#notesInput');
      if (input) input.value = selection.notes;
    }

    syncCartData(t);
  }

  function syncAddons() {
    const btn = document.getElementById('addToCartBtn');
    if (!btn) return;
    const chosen = {};
    Object.keys(addonQty).sort().forEach((id) => {
      if (addonQty[id] > 0) chosen[id] = addonQty[id];
    });
    btn.dataset.addons = Object.keys(chosen).length ? JSON.stringify(chosen) : '';
  }

  function renderAddons(dict, t) {
    const box = document.getElementById('productAddons');
    const list = currentProduct.addons || [];
    if (!box) return;
    box.hidden = list.length === 0;
    if (!list.length) {
      syncAddons();
      return;
    }
    const tr = dict.productDetail || {};
    const names = t.addons || {};
    box.innerHTML = `
      <div class="addons__head">
        <span>${tr.addonsTitle || ''}</span>
        <span class="addons__tag">${tr.addonsTag || ''}</span>
      </div>
      ${list.map((a) => {
        const info = names[a.id] || {};
        const qty = addonQty[a.id] || 0;
        return `
          <div class="addon ${qty ? 'is-selected' : ''}">
            <div class="addon__info">
              <span class="addon__name">${info.name || a.id}</span>
              <span class="addon__desc">${info.description || ''}</span>
            </div>
            <span class="addon__price">+${formatPrice({ price: a.price }, dict)}</span>
            <div class="qty-stepper addon__qty">
              <button type="button" class="qty-stepper__btn" data-addon-id="${a.id}" data-addon-step="-1" aria-label="-">&minus;</button>
              <span class="addon__qty-value">${qty}</span>
              <button type="button" class="qty-stepper__btn" data-addon-id="${a.id}" data-addon-step="1" aria-label="+">+</button>
            </div>
          </div>`;
      }).join('')}`;
    syncAddons();
  }

  function refreshCustom() {
    const dict = window.JIC_I18N.getDict();
    if (!dict || !currentProduct) return;
    renderCustom(dict, dict.products[currentProduct.id] || {});
  }

  function setupInteractions() {
    const wrap = document.getElementById('productWrapper');
    if (!wrap) return;

    wrap.addEventListener('click', (e) => {
      const modeBtn = e.target.closest('[data-custom-mode]');
      if (modeBtn) {
        selection.mode = modeBtn.dataset.customMode;
        refreshCustom();
        return;
      }
      const swatch = e.target.closest('[data-finish]');
      if (swatch) {
        selection.finish = swatch.dataset.finish;
        refreshCustom();
        return;
      }
      const sizeBtn = e.target.closest('[data-size]');
      if (sizeBtn) {
        selection.size = sizeBtn.dataset.size;
        refreshCustom();
        return;
      }
      const addonStep = e.target.closest('[data-addon-step]');
      if (addonStep) {
        const id = addonStep.dataset.addonId;
        addonQty[id] = Math.max(0, (addonQty[id] || 0) + Number(addonStep.dataset.addonStep));
        const dict = window.JIC_I18N.getDict();
        if (dict && currentProduct) renderAddons(dict, dict.products[currentProduct.id] || {});
        return;
      }
      const step = e.target.closest('[data-qty-step]');
      if (step) {
        const input = document.getElementById('productQty');
        input.value = Math.max(1, (parseInt(input.value, 10) || 1) + Number(step.dataset.qtyStep));
      }
    });

    wrap.addEventListener('input', (e) => {
      if (e.target.id !== 'notesInput') return;
      selection.notes = e.target.value;
      const dict = window.JIC_I18N.getDict();
      if (dict && currentProduct) syncCartData(dict.products[currentProduct.id] || {});
    });
  }

  function renderDescription(el, text) {
    el.replaceChildren();
    let list = null;
    text.split('\n').map((line) => line.trim()).filter(Boolean).forEach((line) => {
      if (line.startsWith('- ')) {
        if (!list) {
          list = document.createElement('ul');
          el.appendChild(list);
        }
        const li = document.createElement('li');
        li.textContent = line.slice(2);
        list.appendChild(li);
      } else {
        list = null;
        const p = document.createElement('p');
        p.textContent = line;
        el.appendChild(p);
      }
    });
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
    renderDescription(document.getElementById('productDescription'), t.description || '');
    document.getElementById('productPrice').textContent = formatPrice(currentProduct, dict);
    document.getElementById('breadcrumbCurrent').textContent = t.name || '';
    document.getElementById('breadcrumbCategory').textContent = cat.name || '';
    document.getElementById('breadcrumbCategory').setAttribute('href', `tienda.html#${currentProduct.category}`);

    renderCustom(dict, t);
    renderAddons(dict, t);

    const orderBtn = document.getElementById('orderButton');
    if (orderBtn) orderBtn.href = `contacto.html?producto=${encodeURIComponent(t.name || currentProduct.id)}`;

    const addToCartBtn = document.getElementById('addToCartBtn');
    if (addToCartBtn) addToCartBtn.dataset.addToCart = currentProduct.id;

    renderGallery(currentProduct, t.name || '', dict);
    renderRelated(dict);
  }

  function init() {
    const id = getIdFromUrl();
    fetch('data/products.json')
      .then((res) => res.json())
      .then((data) => {
        products = data;
        currentProduct = products.find((p) => p.id === id);
        resetSelection();
        addonQty = {};
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
    setupInteractions();
  }

  document.addEventListener('partials:loaded', init);
})();
