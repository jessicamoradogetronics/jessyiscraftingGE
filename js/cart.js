/**
 * Carrito de presupuesto: guarda piezas en localStorage, pinta el badge y el
 * cajón del carrito en el header, y prepara el mensaje de contacto al hacer
 * checkout (contacto.html?carrito=1) para pedir presupuesto sin pasarela de pago.
 */
(function () {
  const STORAGE_KEY = 'jic-cart';
  let products = [];
  let productsLoaded = null;

  function readCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const items = raw ? JSON.parse(raw) : [];
      return Array.isArray(items) ? items : [];
    } catch (err) {
      return [];
    }
  }

  function writeCart(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    document.dispatchEvent(new CustomEvent('cart:changed', { detail: { items } }));
  }

  function sameCustom(a, b) {
    return JSON.stringify(a || null) === JSON.stringify(b || null);
  }

  function addItem(id, qty, custom, size, addons) {
    const items = readCart();
    const existing = items.find((it) => it.id === id && sameCustom(it.custom, custom) && (it.size || null) === (size || null) && sameCustom(it.addons, addons));
    if (existing) {
      existing.qty += qty;
    } else {
      const item = { id, qty };
      if (custom) item.custom = custom;
      if (size) item.size = size;
      if (addons) item.addons = addons;
      items.push(item);
    }
    writeCart(items);
  }

  function setQty(index, qty) {
    let items = readCart();
    if (qty <= 0) {
      items = items.filter((_, i) => i !== index);
    } else if (items[index]) {
      items[index].qty = qty;
    }
    writeCart(items);
  }

  function removeItem(index) {
    writeCart(readCart().filter((_, i) => i !== index));
  }

  function clearCart() {
    writeCart([]);
  }

  function getCount(items) {
    return items.reduce((sum, it) => sum + it.qty, 0);
  }

  function loadProducts() {
    if (!productsLoaded) {
      productsLoaded = fetch('data/products.json')
        .then((res) => res.json())
        .then((data) => {
          products = data;
          return products;
        })
        .catch((err) => {
          console.error('No se pudieron cargar los productos del carrito', err);
          return [];
        });
    }
    return productsLoaded;
  }

  function formatPrice(product, dict, value) {
    const currency = '€';
    const price = value === undefined ? product.price : value;
    const amount = Number.isInteger(price) ? price : price.toFixed(2);
    const prefix = product.priceFrom && !product.sizes ? `${dict.common.from} ` : '';
    return `${prefix}${amount}${currency}`;
  }

  function unitPrice(product, size) {
    const sizes = product.sizes || [];
    const match = sizes.find((s) => s.id === size) || sizes.find((s) => s.default);
    return match ? match.price : product.price;
  }

  function addonPrice(product, addonId) {
    const addon = (product.addons || []).find((a) => a.id === addonId);
    return addon ? addon.price : 0;
  }

  function itemPrice(product, item) {
    const addons = Object.entries(item.addons || {})
      .reduce((sum, [addonId, n]) => sum + addonPrice(product, addonId) * n, 0);
    return Math.round((unitPrice(product, item.size) + addons) * 100) / 100;
  }

  function itemDetails(item, dict, product) {
    const lines = [];
    if (item.size) {
      const names = ((dict.products && dict.products[item.id]) || {}).sizes || {};
      lines.push(names[item.size] || item.size);
    }
    if (item.custom) lines.push(customSummary(item.custom, dict));
    if (item.addons) {
      const addonNames = ((dict.products && dict.products[item.id]) || {}).addons || {};
      Object.entries(item.addons).forEach(([addonId, n]) => {
        const name = (addonNames[addonId] || {}).name || addonId;
        const price = product ? ` (+${formatPrice(product, dict, addonPrice(product, addonId))})` : '';
        lines.push(`${name} x${n}${price}`);
      });
    }
    return lines;
  }

  function renderBadge() {
    const count = getCount(readCart());
    const badge = document.getElementById('cartCount');
    if (!badge) return;
    badge.textContent = String(count);
    badge.hidden = count === 0;
  }

  function customSummary(custom, dict) {
    const tr = dict.productDetail || {};
    const parts = [custom.finish, custom.notes].filter(Boolean);
    return `${tr.customLabel || ''}${parts.length ? `: ${parts.join(' · ')}` : ''}`;
  }

  function cartItemRow(item, index, dict) {
    const product = products.find((p) => p.id === item.id);
    const t = (dict.products && dict.products[item.id]) || {};
    const name = t.name || item.id;
    const priceLabel = product ? formatPrice(product, dict, itemPrice(product, item)) : '';
    const img = product ? product.images[0] : '';
    return `
      <div class="cart-item" data-index="${index}">
        <div class="cart-item__media">
          ${img ? `<picture><source srcset="${img}-thumb.webp" type="image/webp"><img src="${img}-thumb.jpg" alt="${name}"></picture>` : ''}
        </div>
        <div class="cart-item__info">
          <span class="cart-item__name">${name}</span>
          <span class="cart-item__price">${priceLabel}</span>
          ${itemDetails(item, dict, product).map((d) => `<span class="cart-item__price">${d}</span>`).join('')}
        </div>
        <div class="cart-item__qty">
          <button type="button" class="cart-item__qty-btn" data-action="decrease" aria-label="-">&minus;</button>
          <span class="cart-item__qty-value">${item.qty}</span>
          <button type="button" class="cart-item__qty-btn" data-action="increase" aria-label="+">+</button>
        </div>
        <button type="button" class="cart-item__remove" data-action="remove" aria-label="${dict.cart.remove}">&times;</button>
      </div>
    `;
  }

  function renderDrawer() {
    const dict = window.JIC_I18N ? window.JIC_I18N.getDict() : null;
    const itemsEl = document.getElementById('cartItems');
    const emptyEl = document.getElementById('cartEmpty');
    const checkoutBtn = document.getElementById('cartCheckout');
    if (!dict || !itemsEl) return;

    const items = readCart();
    itemsEl.innerHTML = items.map((item, i) => cartItemRow(item, i, dict)).join('');
    if (emptyEl) emptyEl.hidden = items.length !== 0;
    if (checkoutBtn) checkoutBtn.hidden = items.length === 0;
  }

  function openDrawer() {
    const drawer = document.getElementById('cartDrawer');
    const toggle = document.getElementById('cartToggle');
    if (!drawer) return;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
  }

  function closeDrawer() {
    const drawer = document.getElementById('cartDrawer');
    const toggle = document.getElementById('cartToggle');
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }

  function setupDrawerControls() {
    const toggle = document.getElementById('cartToggle');
    const closeBtn = document.getElementById('cartClose');
    const backdrop = document.getElementById('cartBackdrop');
    const itemsEl = document.getElementById('cartItems');

    if (toggle) toggle.addEventListener('click', () => { renderDrawer(); openDrawer(); });
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (backdrop) backdrop.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

    if (itemsEl) {
      itemsEl.addEventListener('click', (e) => {
        const row = e.target.closest('.cart-item');
        const action = e.target.closest('[data-action]');
        if (!row || !action) return;
        const index = Number(row.dataset.index);
        const items = readCart();
        const current = items[index];
        if (!current) return;
        if (action.dataset.action === 'increase') setQty(index, current.qty + 1);
        if (action.dataset.action === 'decrease') setQty(index, current.qty - 1);
        if (action.dataset.action === 'remove') removeItem(index);
        renderDrawer();
      });
    }
  }

  function setupAddToCart() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-add-to-cart]');
      if (!btn) return;
      const id = btn.dataset.addToCart;
      if (!id) return;
      const qtyInput = document.getElementById('productQty');
      const qty = qtyInput ? Math.max(1, parseInt(qtyInput.value, 10) || 1) : 1;
      const custom = btn.dataset.custom ? JSON.parse(btn.dataset.custom) : null;
      const size = btn.dataset.size || null;
      const addons = btn.dataset.addons ? JSON.parse(btn.dataset.addons) : null;
      addItem(id, qty, custom, size, addons);
      loadProducts().then(() => {
        renderDrawer();
        openDrawer();
      });
    });
  }

  function fillContactForm(dict) {
    const params = new URLSearchParams(location.search);
    if (params.get('carrito') !== '1') return;
    const items = readCart();
    const subjectField = document.getElementById('contactSubject');
    const messageField = document.getElementById('contactMessage');
    if (!items.length || !subjectField || !messageField) return;

    const lines = items.map((item) => {
      const product = products.find((p) => p.id === item.id);
      const t = (dict.products && dict.products[item.id]) || {};
      const name = t.name || item.id;
      const priceLabel = product ? ` \u2014 ${formatPrice(product, dict, itemPrice(product, item))}` : '';
      const details = itemDetails(item, dict, product);
      const customText = details.length ? ` (${details.join(' · ')})` : '';
      return `- ${name}${customText} x${item.qty}${priceLabel}`;
    });

    if (!subjectField.value) subjectField.value = dict.cart.checkoutSubject;
    if (!messageField.value) messageField.value = `${dict.cart.checkoutMessage}\n${lines.join('\n')}`;
  }

  function init() {
    renderBadge();
    setupDrawerControls();
    setupAddToCart();
    document.addEventListener('cart:changed', renderBadge);

    loadProducts().then(() => {
      const dict = window.JIC_I18N ? window.JIC_I18N.getDict() : null;
      if (dict) {
        renderDrawer();
        fillContactForm(dict);
      }
      document.addEventListener('i18n:ready', (e) => {
        renderDrawer();
        fillContactForm(e.detail.dict);
      });
    });
  }

  document.addEventListener('partials:loaded', init);
})();
