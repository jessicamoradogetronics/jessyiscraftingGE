/**
 * Genera una página HTML estática por obra de la galería (obra-<id>.html) con
 * contenido, metadatos y JSON-LD en inglés, usando data/galeria.json, data/products.json e i18n/en.json.
 * Uso: node tools/generate-work-pages.js
 * Volver a ejecutarlo cada vez que cambien las obras o sus textos.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE_URL = 'https://jessyiscrafting.com/';
const { LOCALES, OG_LOCALE, folderFor, localizedUrl, htmlTag, bodyAttrs, headLinks, rewriteAssetPaths, rootPrefixFor, translateAriaLabels } = require('./lib/localize');

// Mantener sincronizado con CAPTION_KEYS de js/obra.js.
const CAPTION_KEYS = {
  'caballero': 'caballero',
  'jinete': 'jinete',
  'lune': 'lune',
  'renoir': 'renoir',
  'diorama-brutus': 'brutusCast',
  'figura-reencuentro': 'reencuentro',
  'figura-dobby': 'dobbyLabel',
  'set-farkle-blason': 'tableroFarkle',
  'set-farkle': 'setFarkleSet',
  'mini-farkle-viajero': 'miniFarkleLabel',
  'set-dados-artesanales': 'dadosArtesanales',
  'groschens-madera-50': 'groschensBohemios',
  'cubilete-artesanal': 'cubiletesPiel',
  'abanicos-artesanales': 'abanicos',
  'luminoso': 'luminosoLabel',
  'heinrich': 'heinrichCapon',
  'henry-explorando': 'henryPaseando',
  'luke-dale-ardillas': 'lukeDaleGaleria',
  'emotes-twitch': 'emotesDiscordTwitch',
  'reinhart-daku': 'reinhartDakuGaleria',
  'minas-tirith': 'minasTirith',
  'bosque': 'bosque',
  'horreo-gallego': 'horreoGallego'
};

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cleanText(text, max) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  const limit = max || 160;
  return clean.length <= limit ? clean : clean.slice(0, limit).replace(/\s+\S*$/, '');
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function captionFor(dict, id) {
  const key = CAPTION_KEYS[id];
  const value = key && dict.gallery && dict.gallery.captions && dict.gallery.captions[key];
  return typeof value === 'string' ? value : '';
}

function descriptionHtml(text) {
  return String(text)
    .split(/\n\s*\n/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para) => `<p>${esc(para)}</p>`)
    .join('\n        ');
}

// Misma lógica que setBackLink y render en js/obra.js.
function backHref(work, products) {
  const item = products.find((p) => p.id === work.id);
  if (item && item.category === 'artesanias') return 'galeria.html#artesanias';
  if (work.images.some((src) => src.includes('/cuadros/'))) return 'galeria.html#cuadros';
  if (work.images.some((src) => src.includes('/dibujos/'))) return 'galeria.html#dibujos';
  return 'galeria.html';
}

function renderPage(work, dict, products, lang) {
  const id = work.id;
  const t = (dict.works && dict.works.items && dict.works.items[id]) || {};
  const title = (captionFor(dict, id) || t.title || id).replace(/[\s.]+$/, '');
  const file = `obra-${id}.html`;
  const image = work.images[0];
  const description = cleanText(t.description, 160);
  const pageTitle = `${title} · JessyIsCrafting`;
  const ld = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'VisualArtwork',
    name: title,
    description: cleanText(t.description),
    image: SITE_URL + image,
    url: SITE_URL + folderFor(lang) + file,
    creator: { '@type': 'Organization', name: 'JessyIsCrafting', url: SITE_URL }
  }).replace(/</g, '\\u003c');

  const images = work.images.map((src, index) => `
        <figure class="work-images__item">
          <img src="${src}" alt="${esc(title)}"${index === 0 ? '' : ' loading="lazy"'} data-lightbox="${src}">
        </figure>`).join('');

  return rewriteAssetPaths(`<!DOCTYPE html>
${htmlTag(lang)}
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(pageTitle)}</title>
<meta name="description" content="${esc(description)}">
${headLinks(file, lang)}
<meta property="og:site_name" content="JessyIsCrafting">
<meta property="og:type" content="website">
<meta property="og:locale" content="${OG_LOCALE[lang]}">
<meta property="og:title" content="${esc(pageTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${localizedUrl(file, lang)}">
<meta property="og:image" content="${SITE_URL}${image}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="assets/img/brand/favicon.png">
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#37472f">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Work+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/styles.css">
<script type="application/ld+json" id="jsonld-work">${ld}</script>
</head>
<body ${bodyAttrs(lang)} data-work-id="${esc(id)}" data-work-page="${file}">
<a href="#main" class="skip-link">Skip to content</a>
<div data-include="header"></div>

<main id="main">
  <section class="section" style="padding-bottom:0;">
    <div class="container">
      <div class="product-topbar">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a href="index.html" data-i18n="nav.home">Home</a> /
          <a href="galeria.html" data-i18n="nav.gallery">Gallery</a> /
          <span id="breadcrumbCurrent">${esc(title)}</span>
        </nav>
        <a href="${backHref(work, products)}" id="workBack" class="product-back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg><span data-i18n="works.backToGallery">Back to the gallery</span></a>
      </div>
    </div>
  </section>

  <section class="section" style="padding-top:0.5rem;">
    <div class="container">

      <div class="work-detail" id="workWrapper">
        <div class="work-intro">
          <span class="eyebrow" data-i18n="nav.gallery">Gallery</span>
          <h1 id="workTitle">${esc(title)}</h1>
          <div class="work-description" id="workDescription">
        ${descriptionHtml(t.description || '')}
          </div>
          <div class="work-actions">
            <a href="contacto.html?producto=${encodeURIComponent(title)}" id="workConsultButton" class="btn btn--soft"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/></svg><span data-i18n="works.consultButton">Ask about this piece</span></a>
          </div>
        </div>

        <div class="work-images${work.compact ? ' work-images--compact' : ''}" id="workImages">${images}
        </div>
      </div>

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
<script src="js/obra.js"></script>
</body>
</html>
`, rootPrefixFor(lang));
}

function main() {
  const works = readJson('data/galeria.json');
  const products = readJson('data/products.json');
  let count = 0;
  LOCALES.forEach((lang) => {
    const dict = readJson(`i18n/${lang}.json`);
    const dir = path.join(ROOT, folderFor(lang));
    fs.mkdirSync(dir, { recursive: true });
    works.forEach((work) => {
      const t = dict.works && dict.works.items && dict.works.items[work.id];
      if (!t) {
        console.warn(`Sin textos en i18n/${lang}.json para la obra: ${work.id}`);
        return;
      }
      fs.writeFileSync(path.join(dir, `obra-${work.id}.html`), translateAriaLabels(renderPage(work, dict, products, lang), dict, readJson('i18n/en.json')), 'utf8');
      count += 1;
    });
  });
  console.log(`Páginas de obra generadas: ${count}`);
}

if (require.main === module) main();

module.exports = { renderPage };
