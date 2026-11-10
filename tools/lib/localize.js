/**
 * Helpers compartidos para generar versiones por idioma (en raíz, es/ y de/).
 * Usado por los generadores de páginas y por generate-language-pages.js.
 */
const SITE_URL = 'https://jessyiscrafting.com/';
const DEFAULT_LANG = 'en';
const LOCALES = ['en', 'es', 'de'];
const OG_LOCALE = { en: 'en_US', es: 'es_ES', de: 'de_DE' };

function folderFor(lang) {
  return lang === DEFAULT_LANG ? '' : `${lang}/`;
}

// Prefijo para llegar a la raíz del sitio desde la página de ese idioma.
function rootPrefixFor(lang) {
  return lang === DEFAULT_LANG ? '' : '../';
}

function localizedUrl(file, lang) {
  return `${SITE_URL}${folderFor(lang)}${file}`;
}

// Etiquetas <html> con los atributos que usa i18n.js.
function htmlTag(lang) {
  if (lang === DEFAULT_LANG) return '<html lang="en" data-localized>';
  return `<html lang="${lang}" data-root="../" data-localized>`;
}

// Atributos del <body> que fijan el idioma en las carpetas es/ y de/.
function bodyAttrs(lang) {
  return lang === DEFAULT_LANG ? '' : `data-static-lang="${lang}"`;
}

// Canonical y alternates hreflang para un archivo de la página actual (lang).
function headLinks(file, lang) {
  const alternates = LOCALES.map(
    (l) => `<link rel="alternate" hreflang="${l}" href="${localizedUrl(file, l)}">`
  );
  alternates.push(`<link rel="alternate" hreflang="x-default" href="${localizedUrl(file, DEFAULT_LANG)}">`);
  return [`<link rel="canonical" href="${localizedUrl(file, lang)}">`, ...alternates].join('\n');
}

// Reescribe rutas relativas de recursos (css, js, assets, data...) con el prefijo de la raíz.
const ASSET_ATTR = /(\s(?:href|src|srcset|data-lightbox|poster)=")((?:css|js|assets|data|i18n|partials)\/[^"]*|manifest\.json)"/g;
function rewriteAssetPaths(html, prefix) {
  if (!prefix) return html;
  return html.replace(ASSET_ATTR, (_, attr, path) => `${attr}${prefix}${path}"`);
}

// Traduce aria-label estáticos buscando el texto inglés en a11y (enDict) y leyendo la clave en dict.
function translateAriaLabels(html, dict, enDict) {
  const keyByEnglish = {};
  Object.entries(enDict.a11y || {}).forEach(([key, text]) => {
    keyByEnglish[text] = key;
  });
  return html.replace(/\saria-label="([^"]*)"/g, (match, label) => {
    const key = keyByEnglish[label];
    const translated = key && dict.a11y && dict.a11y[key];
    return typeof translated === 'string' ? ` aria-label="${translated}"` : match;
  });
}

module.exports = {
  SITE_URL,
  DEFAULT_LANG,
  LOCALES,
  OG_LOCALE,
  folderFor,
  rootPrefixFor,
  localizedUrl,
  htmlTag,
  bodyAttrs,
  headLinks,
  rewriteAssetPaths,
  translateAriaLabels,
};
