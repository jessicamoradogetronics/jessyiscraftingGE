/**
 * Genera una pagina HTML estatica por capitulo de fanfic (fanfic-<id>-<n>.html)
 * con el contenido, los metadatos y el JSON-LD ya renderizados, y anade esas
 * URLs a sitemap.xml.
 *
 * Uso:
 *   node tools/generate-chapters.js            genera las paginas y el sitemap
 *   node tools/generate-chapters.js --dry-run  solo valida y lista lo que generaria
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const SITE_URL = 'https://jessyiscrafting.com/';
const DRY_RUN = process.argv.includes('--dry-run');

const numberFormat = new Intl.NumberFormat('es-ES');
const dateFormat = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

function loadFanfics() {
  const source = fs.readFileSync(path.join(ROOT, 'js', 'fanfic-data.js'), 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: 'fanfic-data.js' });
  return sandbox.window.FANFICS || {};
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function wordCount(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

function chapterWords(ch) {
  return wordCount(ch.paragraphs.join(' ') + ' ' + (ch.quote || ''));
}

function readMinutes(words) {
  return Math.max(1, Math.round(words / 230));
}

function formatDate(iso) {
  return dateFormat.format(new Date(iso + 'T12:00:00'));
}

function chapterFile(storyId, n) {
  return 'fanfic-' + storyId + '-' + n + '.html';
}

// Mismo criterio que js/reader.js: la cita va despues del segundo parrafo.
function blocks(ch) {
  const out = [];
  ch.paragraphs.forEach((text, i) => {
    out.push({ kind: 'p', text });
    if (i === 1 && ch.quote) out.push({ kind: 'q', text: ch.quote });
  });
  return out;
}

function bodyHtml(ch) {
  return blocks(ch).map((block, i) => {
    if (block.kind === 'q') return '        <blockquote>' + escapeHtml(block.text) + '</blockquote>';
    const cls = i === 0 ? ' class="reader-dropcap"' : '';
    return '        <p' + cls + '>' + escapeHtml(block.text) + '</p>';
  }).join('\n');
}

function pagerLink(href, label, isNext) {
  const classes = 'reader-pager__btn' + (isNext ? ' reader-pager__btn--next' : '');
  return '    <a class="' + classes + '" href="' + href + '"><strong>' + label + '</strong></a>';
}

function pagerOff(label, isNext) {
  const classes = 'reader-pager__btn' + (isNext ? ' reader-pager__btn--next' : '') + ' reader-pager__btn--off';
  return '    <span class="' + classes + '" aria-disabled="true"><strong>' + label + '</strong></span>';
}

function pageHtml(story, index) {
  const chapters = story.chapters;
  const ch = chapters[index];
  const n = index + 1;
  const total = chapters.length;
  const totalWords = chapters.reduce((sum, c) => sum + chapterWords(c), 0);
  const words = chapterWords(ch);
  const file = chapterFile(story.id, n);
  const pageUrl = SITE_URL + file;
  const pageTitle = story.title + ' · Capítulo ' + n + ' · JessyIsCrafting';
  const summary = escapeHtml(story.summary);
  const title = escapeHtml(story.title);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: ch.title,
    description: story.summary,
    url: pageUrl,
    position: n,
    datePublished: ch.date,
    isAccessibleForFree: true,
    author: { '@type': 'Organization', name: 'JessyIsCrafting', url: SITE_URL },
    isPartOf: { '@type': 'CreativeWorkSeries', name: story.title, url: SITE_URL + 'fanfics.html' }
  };
  const jsonLdText = JSON.stringify(jsonLd, null, 2).replace(/</g, '\\u003c');

  const metaRows = [
    ['Estado', story.status],
    ['Capítulos', String(total)],
    ['Palabras', numberFormat.format(totalWords)],
    ['Lectura aprox.', readMinutes(totalWords) + ' min'],
    ['Publicado', formatDate(chapters[0].date)],
    ['Actualizado', formatDate(chapters[total - 1].date)]
  ].map((row) => '      <dt>' + escapeHtml(row[0]) + '</dt><dd>' + escapeHtml(row[1]) + '</dd>').join('\n');

  const toc = chapters.map((c, i) => {
    const current = i === index ? ' aria-current="page"' : '';
    return '      <li><a href="' + chapterFile(story.id, i + 1) + '"' + current + '>' +
      '<span class="reader-toc__num">' + (i + 1) + '.</span> ' + escapeHtml(c.title) + '</a></li>';
  }).join('\n');

  const options = chapters.map((c, i) => {
    const selected = i === index ? ' selected' : '';
    return '        <option value="' + chapterFile(story.id, i + 1) + '"' + selected + '>' +
      escapeHtml((i + 1) + '. ' + c.title) + '</option>';
  }).join('\n');

  const tags = story.tags.map((tag) => '      <span class="reader-tag">' + escapeHtml(tag) + '</span>').join('\n');

  const prev = index > 0
    ? pagerLink(chapterFile(story.id, index), '← Capítulo anterior', false)
    : pagerOff('← Capítulo anterior', false);
  const next = index < total - 1
    ? pagerLink(chapterFile(story.id, index + 2), 'Capítulo siguiente →', true)
    : pagerOff('Capítulo siguiente →', true);

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(pageTitle)}</title>
<meta name="description" content="${summary}">
<link rel="canonical" href="${pageUrl}">
<meta property="og:site_name" content="JessyIsCrafting">
<meta property="og:type" content="article">
<meta property="og:locale" content="es_ES">
<meta property="og:title" content="${escapeHtml(pageTitle)}">
<meta property="og:description" content="${summary}">
<meta property="og:url" content="${pageUrl}">
<link rel="icon" type="image/png" href="assets/img/brand/favicon.png">
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#37472f">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Work+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/styles.css">
<link rel="stylesheet" href="css/reader.css">
<script type="application/ld+json" id="jsonld-chapter">
${jsonLdText}
</script>
</head>
<body class="reader-page" data-story="${escapeHtml(story.id)}" data-chapter="${n}" data-prerendered>
<a href="#main" class="skip-link">Saltar al contenido</a>
<div data-include="header"></div>

<div class="reader-progress" id="readerProgress" aria-hidden="true"></div>

<div class="reader-toolbar">
  <div class="container reader-toolbar__inner">
    <div class="reader-toolbar__top">
      <nav class="reader-crumbs" aria-label="Ruta de navegación">
        <a href="fanfics.html">Fanfics</a> <span aria-hidden="true">/</span> <span id="crumbTitle">${title}</span>
      </nav>
      <a href="fanfics.html" class="reader-back">← Volver a fanfics</a>
    </div>
    <div class="reader-tools">
      <div id="chapterPick">
        <select class="reader-select" aria-label="Seleccionar capítulo">
${options}
        </select>
      </div>
      <div class="reader-seg" role="group" aria-label="Tema de lectura" id="themeSeg">
        <button type="button" data-theme="light" aria-pressed="true">Claro</button>
        <button type="button" data-theme="dark" aria-pressed="false">Oscuro</button>
      </div>
      <div class="reader-seg" role="group" aria-label="Tamaño de letra">
        <button type="button" id="sizeDown" aria-label="Reducir letra">A−</button>
        <span class="reader-seg__value" id="sizeValue">18 px</span>
        <button type="button" id="sizeUp" aria-label="Aumentar letra">A+</button>
      </div>
      <button type="button" class="btn btn--outline btn--sm" id="shareBtn">Compartir</button>
      <span class="reader-seg__value" id="shareStatus" aria-live="polite"></span>
      <button type="button" class="btn btn--outline btn--sm" id="dlPdf">Descargar PDF</button>
      <button type="button" class="btn btn--outline btn--sm" id="dlEpub">Descargar EPUB</button>
    </div>
  </div>
</div>

<main id="main" class="container reader-layout">
  <aside class="reader-side">
    <p class="reader-side__eyebrow">Fanfic · Kingdom Come: Deliverance</p>
    <h2 id="sideTitle">${title}</h2>
    <p id="sideSummary">${summary}</p>
    <dl class="reader-meta" id="sideMeta">
${metaRows}
    </dl>
    <h3>Índice de capítulos</h3>
    <ol class="reader-toc" id="toc">
${toc}
    </ol>
  </aside>

  <article class="reader-article" id="article">
    <header class="reader-head">
      <div class="reader-tags" id="tags">
${tags}
      </div>
      <p class="reader-kicker" id="chapterKicker">Capítulo ${n} de ${total}</p>
      <h1 id="chapterTitle">${escapeHtml(ch.title)}</h1>
      <div class="reader-byline" id="byline">
        <span>Publicado el ${escapeHtml(formatDate(ch.date))}</span>
        <span>${numberFormat.format(words)} palabras</span>
        <span>Lectura aprox. ${readMinutes(words)} min</span>
      </div>
    </header>

    <div class="reader-body" id="readerBody">
${bodyHtml(ch)}
    </div>

    <nav class="reader-pager" id="pager" aria-label="Navegación entre capítulos">
${prev}
${next}
    </nav>
  </article>
</main>

<input type="hidden" id="fanficReads" value="0">

<div data-include="footer"></div>

<script src="js/include.js"></script>
<script src="js/i18n.js"></script>
<script src="js/main.js"></script>
<script src="js/search.js"></script>
<script src="js/cart.js"></script>
<script src="js/fanfic-data.js"></script>
<script src="js/seo.js"></script>
<script src="js/reader.js"></script>
</body>
</html>
`;
}

// Comprueba que el HTML generado contiene todo el texto del capitulo.
function verifyPage(html, ch) {
  blocks(ch).forEach((block) => {
    if (!html.includes(escapeHtml(block.text))) {
      throw new Error('Texto no encontrado en la pagina: ' + block.text.slice(0, 60));
    }
  });
  const dropcaps = html.split('reader-dropcap').length - 1;
  if (dropcaps !== 1) throw new Error('Se esperaba 1 dropcap y hay ' + dropcaps);
}

function updateSitemap(urls) {
  const file = path.join(ROOT, 'sitemap.xml');
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/)
    .filter((line) => !/\/fanfic-[^<]+\.html<\/loc>/.test(line));
  const end = lines.findIndex((line) => line.includes('</urlset>'));
  if (end < 0) throw new Error('sitemap.xml sin </urlset>');
  const entries = urls.map((url) =>
    '  <url><loc>' + url + '</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>');
  lines.splice(end, 0, ...entries);
  return lines.join('\n');
}

function main() {
  const stories = loadFanfics();
  const files = [];

  Object.keys(stories).forEach((key) => {
    const story = stories[key];
    const chapters = story.chapters || [];
    chapters.forEach((ch, i) => {
      if (!ch.paragraphs || !ch.paragraphs.length) {
        throw new Error(key + ' capitulo ' + (i + 1) + ' sin parrafos');
      }
      if (ch.quote && ch.paragraphs.length < 2) {
        console.warn('Aviso: ' + key + ' capitulo ' + (i + 1) + ' tiene cita pero menos de 2 parrafos (no se mostrara)');
      }
      const html = pageHtml(Object.assign({ id: key }, story), i);
      verifyPage(html, ch);
      files.push({ name: chapterFile(story.id || key, i + 1), html, url: SITE_URL + chapterFile(story.id || key, i + 1) });
    });
  });

  if (!files.length) throw new Error('No hay capitulos que generar');

  files.forEach((f) => console.log((DRY_RUN ? '[dry-run] ' : '') + f.name));
  console.log(files.length + ' paginas de capitulo validadas.');

  if (DRY_RUN) return;

  files.forEach((f) => fs.writeFileSync(path.join(ROOT, f.name), f.html, 'utf8'));
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), updateSitemap(files.map((f) => f.url)), 'utf8');
  console.log('sitemap.xml actualizado.');
}

main();
