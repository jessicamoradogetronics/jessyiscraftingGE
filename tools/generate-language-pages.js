/**
 * Genera las versiones por idioma de las páginas estáticas de la raíz:
 * es/ y de/ con los textos de i18n/{lang}.json. Actualiza también las
 * versiones en inglés (raíz) con canonical y hreflang por carpeta, y
 * añade las alternativas de idioma a sitemap.xml.
 * Uso: node tools/generate-language-pages.js
 * Las páginas de producto y obra se generan con sus propios scripts.
 */
const fs = require('fs');
const path = require('path');
const L = require('./lib/localize');

const ROOT = path.join(__dirname, '..');
const LOCALIZED_PAGES = ['index', 'tienda', 'galeria', 'contacto', 'faq', 'inspiracion'];
// Páginas sin traducir (la sección de fanfics se mantiene en inglés).
const NON_LOCALIZED_PAGES = ['fanfics', 'fanfic-worth-1', 'fanfic-worth-2', 'leer', '404', 'gracias'];
const TRANSLATED_LANGS = ['es', 'de'];

function readText(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function writeText(relativePath, text) {
  const full = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, text, 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function escText(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escAttr(value) {
  return escText(value).replace(/"/g, '&quot;');
}

function resolveKey(dict, key) {
  return key.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), dict);
}

function replaceMetaContent(html, name, value) {
  const re = new RegExp(`(<meta\\s+(?:name|property)="${name}"\\s+content=")[^"]*"`);
  return html.replace(re, (match, prefix) => `${prefix}${escAttr(value)}"`);
}

// Idioma, canonical/hreflang, og:url y (si hay) título y descripción de la página.
function localizeHead(html, file, lang, meta) {
  let out = html.replace(/<html[^>]*>/, () => L.htmlTag(lang));
  out = out.replace(/[ \t]*<link rel="(?:canonical|alternate)"[^>]*>\r?\n?/g, '');
  if (meta && meta.title) {
    out = out.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${escText(meta.title)}</title>`);
    out = replaceMetaContent(out, 'og:title', meta.title);
  }
  if (meta && meta.description) {
    out = replaceMetaContent(out, 'description', meta.description);
    out = replaceMetaContent(out, 'og:description', meta.description);
  }
  out = replaceMetaContent(out, 'og:locale', L.OG_LOCALE[lang]);
  out = replaceMetaContent(out, 'og:url', L.localizedUrl(file, lang));
  return out.replace('</head>', () => `${L.headLinks(file, lang)}\n</head>`);
}

// Sustituye el texto de los elementos data-i18n / data-i18n-html y los atributos data-i18n-attr.
function translateBody(html, dict, page) {
  let out = html.replace(
    /<([a-zA-Z][\w-]*)(\s[^>]*?)?\sdata-i18n(-html)?="([^"]+)"([^>]*)>([\s\S]*?)<\/\1>/g,
    (match, tag, before = '', isHtml, key, after, inner) => {
      const value = resolveKey(dict, key);
      if (typeof value !== 'string') return match;
      if (new RegExp(`<${tag}[\\s>]`, 'i').test(inner)) {
        console.warn(`[${page}] elemento anidado sin traducir: ${key}`);
        return match;
      }
      const body = isHtml ? value : escText(value);
      return `<${tag}${before} data-i18n${isHtml || ''}="${key}"${after}>${body}</${tag}>`;
    }
  );

  out = out.replace(/<([a-zA-Z][\w-]*)([^>]*?)\sdata-i18n-attr="([^"]+)"([^>]*)>/g, (match, tag, before, spec, after) => {
    const selfClose = after.endsWith('/');
    let attrs = before + (selfClose ? after.slice(0, -1) : after);
    spec.split(';').map((s) => s.trim()).filter(Boolean).forEach((pair) => {
      const idx = pair.indexOf(':');
      const attr = pair.slice(0, idx).trim();
      const value = resolveKey(dict, pair.slice(idx + 1).trim());
      if (typeof value !== 'string') return;
      attrs = attrs.replace(new RegExp(`\\s${attr}="[^"]*"`), '');
      attrs += ` ${attr}="${escAttr(value)}"`;
    });
    return `<${tag}${attrs}${selfClose ? '/' : ''}>`;
  });
  return out;
}

function setBodyLang(html, lang) {
  const attrs = L.bodyAttrs(lang);
  if (!attrs) return html;
  return html.replace(/<body(\s[^>]*)?>/, (match, attrsBefore = '') => `<body${attrsBefore} ${attrs}>`);
}

// Las páginas sin traducir viven en la raíz: sus enlaces desde es/ y de/ deben subir un nivel.
function linkNonLocalized(html) {
  const re = new RegExp(`href="(${NON_LOCALIZED_PAGES.join('|')})\\.html`, 'g');
  return html.replace(re, (match, name) => `href="../${name}.html`);
}

// Traduce el JSON-LD de FAQ emparejando cada pregunta inglesa con su clave en en.json.
function localizeFaqJsonLd(html, dict) {
  const enItems = readJson('i18n/en.json').faq.items;
  return html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/, (match, body) => {
    const data = JSON.parse(body);
    if (data['@type'] !== 'FAQPage') return match;
    data.mainEntity = data.mainEntity.map((entry) => {
      const key = Object.keys(enItems).find((k) => enItems[k].q === entry.name);
      if (!key || !dict.faq.items[key]) return entry;
      return { ...entry, name: dict.faq.items[key].q, acceptedAnswer: { ...entry.acceptedAnswer, text: dict.faq.items[key].a } };
    });
    return `<script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n</script>`;
  });
}

function buildTranslatedPage(source, file, lang, dict, page) {
  const meta = resolveKey(dict, `pages.${page}`);
  let out = localizeHead(source, file, lang, meta);
  out = translateBody(out, dict, page);
  out = L.translateAriaLabels(out, dict, readJson('i18n/en.json'));
  if (page === 'faq') out = localizeFaqJsonLd(out, dict);
  out = setBodyLang(out, lang);
  out = linkNonLocalized(out);
  return L.rewriteAssetPaths(out, L.rootPrefixFor(lang));
}

function updateSitemap() {
  const translatedFiles = new Set(
    TRANSLATED_LANGS.flatMap((lang) => fs.readdirSync(path.join(ROOT, L.folderFor(lang))).filter((f) => f.endsWith('.html')))
  );
  const alternates = (file) => {
    const links = L.LOCALES.map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${L.localizedUrl(file, l)}"/>`);
    links.push(`<xhtml:link rel="alternate" hreflang="x-default" href="${L.localizedUrl(file, L.DEFAULT_LANG)}"/>`);
    return links.join('');
  };
  const urlRe = /^\s*<url><loc>https:\/\/jessyiscrafting\.com\/([^<]+)<\/loc>(.*)<\/url>\s*$/;
  const out = [];
  const seenLocs = new Set();
  const emittedFiles = new Set();
  readText('sitemap.xml').split(/\r?\n/).forEach((line) => {
    if (line.includes('<urlset ')) {
      out.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">');
      return;
    }
    const match = line.match(urlRe);
    if (!match) {
      if (line.trim() !== '') out.push(line);
      return;
    }
    const [, loc, rest] = match;
    const file = loc.replace(/^(es|de)\//, '');
    if (translatedFiles.has(file)) {
      if (emittedFiles.has(file)) return;
      emittedFiles.add(file);
      const meta = rest.replace(/<xhtml:link[^>]*\/>/g, '');
      L.LOCALES.forEach((lang) => {
        out.push(`  <url><loc>${L.localizedUrl(file, lang)}</loc>${meta}${alternates(file)}</url>`);
      });
      return;
    }
    if (seenLocs.has(loc)) return;
    seenLocs.add(loc);
    out.push(line);
  });
  writeText('sitemap.xml', `${out.join('\n')}\n`);
}

function main() {
  const dicts = {
    en: readJson('i18n/en.json'),
    es: readJson('i18n/es.json'),
    de: readJson('i18n/de.json'),
  };

  LOCALIZED_PAGES.forEach((page) => {
    const file = `${page}.html`;
    const source = readText(file);
    writeText(file, localizeHead(source, file, L.DEFAULT_LANG, null));
    TRANSLATED_LANGS.forEach((lang) => {
      const html = buildTranslatedPage(source, file, lang, dicts[lang], page);
      writeText(`${L.folderFor(lang)}${file}`, html);
    });
  });

  NON_LOCALIZED_PAGES.forEach((page) => {
    const file = `${page}.html`;
    if (!fs.existsSync(path.join(ROOT, file))) return;
    writeText(file, readText(file).replace(/[ \t]*<link rel="alternate"[^>]*>\r?\n?/g, ''));
  });

  updateSitemap();
  console.log(`Páginas por idioma generadas: ${LOCALIZED_PAGES.length} x ${TRANSLATED_LANGS.length} idiomas`);
}

main();
