/**
 * Loads the product catalog and renders product cards / featured items.
 * Re-renders automatically when the language changes.
 */
(function (global) {
  "use strict";

  var products = [];
  var loaded = false;

  function escapeHtml(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function formatPrice(value) {
    var num = Number(value);
    return num.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " \u20ac";
  }

  function byCategory(category) {
    return products.filter(function (p) {
      return p.category === category;
    });
  }

  function load() {
    if (loaded) return Promise.resolve(products);
    var base = global.SITE_BASE || "./";
    return fetch(base + "assets/data/products.json")
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        products = data;
        loaded = true;
        return products;
      });
  }

  function pick(record, lang) {
    if (!record) return "";
    return record[lang] || record.es || "";
  }

  function cardHTML(product) {
    var base = global.SITE_BASE || "./";
    var lang = global.i18n.getLanguage();
    var name = pick(product.name, lang);
    var desc = pick(product.description, lang);
    var note = pick(product.customizationNote, lang);
    var priceText = (product.priceFrom ? global.i18n.t("shop.fromPriceLabel") + " " : "") + formatPrice(product.price);
    var imageSrc = base + product.image;
    var contactHref = base + "contact.html?producto=" + encodeURIComponent(name);

    return (
      '<article class="card" data-product' +
      ' data-image="' + escapeHtml(imageSrc) + '"' +
      ' data-name="' + escapeHtml(name) + '"' +
      ' data-description="' + escapeHtml(desc) + '"' +
      ' data-price-label="' + escapeHtml(priceText) + '"' +
      ' data-customization="' + escapeHtml(note) + '"' +
      ' data-cta-href="' + escapeHtml(contactHref) + '">' +
      '<div class="card__media"><img src="' + escapeHtml(imageSrc) + '" alt="' + escapeHtml(name) + '" loading="lazy" width="800" height="600"></div>' +
      '<div class="card__body">' +
      "<div>" +
      (product.isExample ? '<span class="badge">' + escapeHtml(global.i18n.t("shop.exampleBadge")) + "</span>" : "") +
      (product.customizable ? ' <span class="badge badge--customizable">' + escapeHtml(global.i18n.t("shop.customizableLabel")) + "</span>" : "") +
      "</div>" +
      '<h3 class="card__title">' + escapeHtml(name) + "</h3>" +
      '<p class="card__desc">' + escapeHtml(desc) + "</p>" +
      '<div class="card__footer">' +
      '<span class="price">' + escapeHtml(priceText) + "</span>" +
      '<div class="card__actions">' +
      '<button type="button" class="btn btn-outline btn-sm" data-open-modal>' + escapeHtml(global.i18n.t("shop.viewDetails")) + "</button>" +
      '<a class="btn btn-gold btn-sm" href="' + escapeHtml(contactHref) + '">' + escapeHtml(global.i18n.t("shop.ctaInquire")) + "</a>" +
      "</div></div></div></article>"
    );
  }

  function featuredCardHTML(product) {
    var base = global.SITE_BASE || "./";
    var lang = global.i18n.getLanguage();
    var name = pick(product.name, lang);
    var imageSrc = base + product.image;
    var categorySlug = product.category === "digitalArt" ? "digital-art" : product.category;
    var categoryHref = base + "shop/" + categorySlug + ".html";

    return (
      '<article class="card">' +
      '<div class="card__media"><img src="' + escapeHtml(imageSrc) + '" alt="' + escapeHtml(name) + '" loading="lazy" width="800" height="600"></div>' +
      '<div class="card__body">' +
      '<h3 class="card__title">' + escapeHtml(name) + "</h3>" +
      '<div class="card__footer">' +
      '<span class="price">' + escapeHtml(formatPrice(product.price)) + "</span>" +
      '<a class="btn btn-outline btn-sm" href="' + escapeHtml(categoryHref) + '">' + escapeHtml(global.i18n.t("shop.viewCategory")) + "</a>" +
      "</div></div></article>"
    );
  }

  function renderGrid(container, category) {
    if (!container) return;
    var list = byCategory(category);
    container.innerHTML = list.map(cardHTML).join("");
  }

  function renderFeatured(container, categories) {
    if (!container) return;
    var items = categories
      .map(function (cat) {
        return byCategory(cat)[0];
      })
      .filter(Boolean);
    container.innerHTML = items.map(featuredCardHTML).join("");
  }

  global.productsApi = {
    load: load,
    byCategory: byCategory,
    renderGrid: renderGrid,
    renderFeatured: renderFeatured,
    formatPrice: formatPrice,
  };
})(window);
