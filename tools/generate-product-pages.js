/**
 * Genera una página HTML estática por producto (producto-<id>.html) con
 * contenido, metadatos y JSON-LD en inglés, usando data/products.json e i18n/en.json.
 * Uso: node tools/generate-product-pages.js
 * Volver a ejecutarlo cada vez que cambien los productos o sus textos.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE_URL = 'https://jessyiscrafting.com/';

// Mantener sincronizado con js/product.js (envíos y devoluciones del JSON-LD).
const SHIPPING_ES_EUR = 7;
const SHIPPING_INTL_MIN_EUR = 16;
const SHIPPING_INTL_MAX_EUR = 20;
const SHIPPING_TRANSIT_DAYS = 7;
const SHIPPING_COUNTRIES_INTL = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'SE', 'GB'];

const AVAILABILITY = {
  in_stock: { key: 'availabilityInStock', schema: 'https://schema.org/InStock', cls: 'is-in-stock' },
  out_of_stock: { key: 'availabilityOutOfStock', schema: 'https://schema.org/OutOfStock', cls: 'is-out-of-stock' }
};

const LANGS = ['es', 'en', 'de'];

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cleanText(text, max) {
  return String(text || '').replace(/\s+/g, ' ').trim().slice(0, max || 160);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function formatPrice(product, dict) {
  const amount = Number.isInteger(product.price) ? product.price : product.price.toFixed(2);
  const prefix = product.priceFrom ? `${dict.common.from} ` : '';
  return `${prefix}${amount}€`;
}

function buildShippingDetails(customizable) {
  const handlingTime = customizable
    ? { '@type': 'QuantitativeValue', minValue: 7, maxValue: 21, unitCode: 'DAY' }
    : { '@type': 'QuantitativeValue', minValue: 2, maxValue: 4, unitCode: 'DAY' };
  const deliveryTime = {
    '@type': 'ShippingDeliveryTime',
    handlingTime: handlingTime,
    transitTime: { '@type': 'QuantitativeValue', value: SHIPPING_TRANSIT_DAYS, unitCode: 'DAY' }
  };
  const region = (country) => ({ '@type': 'DefinedRegion', addressCountry: country });
  return [
    {
      '@type': 'OfferShippingDetails',
      shippingRate: { '@type': 'MonetaryAmount', value: SHIPPING_ES_EUR, currency: 'EUR' },
      shippingDestination: [region('ES')],
      deliveryTime: deliveryTime
    },
    {
      '@type': 'OfferShippingDetails',
      shippingRate: { '@type': 'MonetaryAmount', minValue: SHIPPING_INTL_MIN_EUR, maxValue: SHIPPING_INTL_MAX_EUR, currency: 'EUR' },
      shippingDestination: SHIPPING_COUNTRIES_INTL.map(region),
      deliveryTime: deliveryTime
    }
  ];
}

function buildReturnPolicy(customizable) {
  if (customizable) {
    return { '@type': 'MerchantReturnPolicy', applicableCountry: 'ES', returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted' };
  }
  return {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: 'ES',
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: 14,
    returnMethod: 'https://schema.org/ReturnByMail'
  };
}

function buildOffer(product) {
  const customizable = !!product.customizable;
  const availability = AVAILABILITY[product.availability];
  const common = {
    availability: availability && availability.schema,
    shippingDetails: buildShippingDetails(customizable),
    hasMerchantReturnPolicy: buildReturnPolicy(customizable)
  };
  if (!product.priceFrom) {
    return Object.assign({ '@type': 'Offer', price: product.price, priceCurrency: 'EUR' }, common);
  }
  const sizePrices = (product.sizes || []).map((s) => s.price);
  return Object.assign({
    '@type': 'AggregateOffer',
    priceCurrency: 'EUR',
    lowPrice: product.price,
    highPrice: Math.max(product.price, ...sizePrices),
    offerCount: sizePrices.length || 1
  }, common);
}

function buildJsonLd(product, t, cat, pageUrl, image) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: t.name || product.id,
    description: cleanText(t.short || t.description),
    image: SITE_URL + image,
    url: SITE_URL + pageUrl,
    category: cat.name || '',
    brand: { '@type': 'Brand', name: 'JessyIsCrafting' },
    offers: buildOffer(product)
  };
}

function descriptionHtml(text) {
  const out = [];
  let inList = false;
  text.split('\n').map((line) => line.trim()).filter(Boolean).forEach((line) => {
    if (line.startsWith('- ')) {
      if (!inList) {
        out.push('<ul>');
        inList = true;
      }
      out.push(`<li>${esc(line.slice(2))}</li>`);
    } else {
      if (inList) {
        out.push('</ul>');
        inList = false;
      }
      out.push(`<p>${esc(line)}</p>`);
    }
  });
  if (inList) out.push('</ul>');
  return out.join('\n        ');
}

function hreflangLinks(file) {
  const lines = LANGS.map((lang) => {
    const href = lang === 'en' ? SITE_URL + file : `${SITE_URL}${file}?lang=${lang}`;
    return `<link rel="alternate" hreflang="${lang}" href="${href}">`;
  });
  lines.push(`<link rel="alternate" hreflang="x-default" href="${SITE_URL}${file}">`);
  return lines.join('\n');
}

function renderPage(product, dict) {
  const id = product.id;
  const t = (dict.products && dict.products[id]) || {};
  const cat = dict.categories[product.category] || {};
  const name = t.name || id;
  const file = `producto-${id}.html`;
  const image = `${product.images[0]}.jpg`;
  const webp = `${product.images[0]}.webp`;
  const description = cleanText(t.short || t.description, 160);
  const title = `${name} · JessyIsCrafting`;
  const availability = AVAILABILITY[product.availability];
  const ld = JSON.stringify(buildJsonLd(product, t, cat, file, image)).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${SITE_URL}${file}">
${hreflangLinks(file)}
<meta property="og:site_name" content="JessyIsCrafting">
<meta property="og:type" content="product">
<meta property="og:locale" content="en_US">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${SITE_URL}${file}">
<meta property="og:image" content="${SITE_URL}${image}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="assets/img/brand/favicon.png">
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#37472f">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Work+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/styles.css">
<script type="application/ld+json" id="jsonld-product">${ld}</script>
</head>
<body data-product-id="${esc(id)}" data-product-page="${file}">
<a href="#main" class="skip-link">Skip to content</a>
<div data-include="header"></div>

<main id="main">
  <section class="section" style="padding-bottom:0;">
    <div class="container">
      <div class="product-topbar">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a href="index.html" data-i18n="nav.home">Home</a> /
          <a href="tienda.html" data-i18n="nav.store">Shop</a> /
          <a href="tienda.html#${esc(product.category)}" id="breadcrumbCategory">${esc(cat.name || '')}</a> /
          <span id="breadcrumbCurrent">${esc(name)}</span>
        </nav>
        <a href="tienda.html" class="product-back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg><span data-i18n="productDetail.backToStore">Back to the shop</span></a>
      </div>
    </div>
  </section>

  <section class="section" style="padding-top:0.5rem;">
    <div class="container">

      <div class="product-detail" id="productWrapper">
        <div class="product-gallery">
          <div class="product-gallery__main" id="galleryMain">
            <picture>
              <source srcset="${webp}" type="image/webp">
              <img src="${image}" alt="${esc(name)}" id="galleryMainImg">
            </picture>
          </div>
          <div class="product-gallery__thumbs" id="galleryThumbs"></div>
        </div>

        <div class="product-info">
          <span class="eyebrow" id="productCategory">${esc(cat.name || '')}</span>
          <h1 id="productTitle">${esc(name)}</h1>
          <p class="product-info__price" id="productPrice">${esc(formatPrice(product, dict))}</p>
          <p class="product-info__meta" data-i18n="productDetail.taxNote">Taxes included · Fast, protected shipping</p>
          ${availability ? `<p class="product-info__availability ${availability.cls}" id="productAvailability">${esc(dict.productDetail[availability.key] || '')}</p>` : ''}
          <div id="productDescription">
        ${descriptionHtml(t.description || '')}
          </div>

          <div class="custom-choice" id="customChoice" hidden></div>
          <div class="customization-box" id="customizationBox" hidden></div>

          <div class="product-info__cart-actions">
            <div class="qty-stepper">
              <button type="button" class="qty-stepper__btn" data-qty-step="-1" data-i18n-aria-label="productDetail.qtyDecrease" aria-label="Decrease quantity">&minus;</button>
              <label for="productQty" class="visually-hidden" data-i18n="cart.quantityLabel">Quantity</label>
              <input type="number" id="productQty" class="qty-stepper__input" min="1" value="1">
              <button type="button" class="qty-stepper__btn" data-qty-step="1" data-i18n-aria-label="productDetail.qtyIncrease" aria-label="Increase quantity">+</button>
            </div>
            <button type="button" class="btn btn--gold" id="addToCartBtn" data-add-to-cart="${esc(id)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 7h12l-1 13H7L6 7Z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/></svg><span data-i18n="cart.addButton">Add to cart</span></button>
          </div>

          <div class="product-info__actions">
            <a href="contacto.html?producto=${encodeURIComponent(name)}" id="orderButton" class="btn btn--soft"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/></svg><span data-i18n="productDetail.orderButton">Ask about or order a made-to-measure piece</span></a>
          </div>

          <div class="addons" id="productAddons" hidden></div>

          <p class="form-note" style="margin-top:1.5rem;" data-i18n="productDetail.shippingNote">Shipping to Spain, the European Union and the United Kingdom. For other countries, please get in touch before ordering. More details in the FAQ.</p>
        </div>
      </div>

      <section id="relatedSection" style="margin-top:4.5rem;">
        <div class="section-head">
          <span class="eyebrow" data-i18n="productDetail.relatedEyebrow">You might also like</span>
          <h2 data-i18n="productDetail.relatedTitle">More pieces from the same family</h2>
        </div>
        <div class="grid grid--3" id="relatedProducts"></div>
      </section>
    </div>
  </section>
</main>

<div data-include="footer"></div>

<script src="js/include.js"></script>
<script src="js/i18n.js"></script>
<script src="js/main.js"></script>
<script src="js/search.js"></script>
<script src="js/cart.js"></script>
<script src="js/seo.js"></script>
<script src="js/product.js"></script>
</body>
</html>
`;
}

function main() {
  const products = readJson('data/products.json');
  const dict = readJson('i18n/en.json');
  products.forEach((product) => {
    const file = path.join(ROOT, `producto-${product.id}.html`);
    fs.writeFileSync(file, renderPage(product, dict), 'utf8');
  });
  console.log(`Páginas de producto generadas: ${products.length}`);
}

main();
