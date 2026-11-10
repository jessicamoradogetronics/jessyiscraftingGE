/**
 * Motor de internacionalización (i18n) para JessyIsCrafting.
 * Lee los diccionarios en /i18n/{lang}.json, detecta el idioma
 * del navegador por defecto y sustituye todo el texto marcado
 * con data-i18n / data-i18n-attr, sin recargar la página.
 */
(function () {
  const SUPPORTED_LANGS = ['es', 'en', 'de'];
  const DEFAULT_LANG = 'en';
  const STORAGE_KEY = 'jic-lang';

  const cache = {};
  let currentDict = null;
  let currentLang = null;

  // Ruta a la raíz del sitio desde la página actual ("../" en las carpetas es/ y de/).
  function rootPrefix() {
    return document.documentElement.getAttribute('data-root') || '';
  }

  // Orden: ?lang=, idioma fijado de la carpeta (data-static-lang), elección guardada, navegador (es/en/de) y, si no, inglés.
  function detectLang() {
    const fromUrl = new URLSearchParams(location.search).get('lang');
    if (SUPPORTED_LANGS.includes(fromUrl)) return fromUrl;

    const pinned = document.body && document.body.dataset.staticLang;
    if (SUPPORTED_LANGS.includes(pinned)) return pinned;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_LANGS.includes(saved)) return saved;

    const browser = ((navigator.languages && navigator.languages[0]) || navigator.language || '').slice(0, 2).toLowerCase();
    return SUPPORTED_LANGS.includes(browser) ? browser : DEFAULT_LANG;
  }

  function resolveKey(dict, key) {
    return key.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), dict);
  }

  function applyTranslations(dict) {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const value = resolveKey(dict, key);
      if (value === undefined) return;
      if (el.hasAttribute('data-i18n-html')) {
        el.innerHTML = value;
      } else {
        el.textContent = value;
      }
    });

    document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      const pairs = el.getAttribute('data-i18n-attr').split(';').map((p) => p.trim()).filter(Boolean);
      pairs.forEach((pair) => {
        const [attr, key] = pair.split(':').map((p) => p.trim());
        const value = resolveKey(dict, key);
        if (value !== undefined) el.setAttribute(attr, value);
      });
    });
  }

  function setMeta(attr, key, content) {
    const el = document.head.querySelector(`meta[${attr}="${key}"]`);
    if (el) el.setAttribute('content', content);
  }

  // Título y descripción de páginas estáticas desde el bloque "pages" del diccionario.
  function applyPageMeta(dict) {
    const page = location.pathname.split('/').pop().replace(/\.html$/, '') || 'index';
    const meta = resolveKey(dict, `pages.${page}`);
    if (!meta) return;
    if (meta.title) {
      document.title = meta.title;
      setMeta('property', 'og:title', meta.title);
    }
    if (meta.description) {
      setMeta('name', 'description', meta.description);
      setMeta('property', 'og:description', meta.description);
    }
  }

  function fetchDict(lang) {
    if (cache[lang]) return Promise.resolve(cache[lang]);
    return fetch(`${rootPrefix()}i18n/${lang}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`No se pudo cargar el idioma ${lang}`);
        return res.json();
      })
      .then((dict) => {
        cache[lang] = dict;
        return dict;
      });
  }

  function setLanguage(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) lang = DEFAULT_LANG;
    return fetchDict(lang)
      .catch(() => fetchDict(DEFAULT_LANG))
      .then((dict) => {
        currentDict = dict;
        currentLang = lang;
        document.documentElement.setAttribute('lang', lang);
        applyTranslations(dict);
        applyPageMeta(dict);
        const select = document.getElementById('langSelect');
        if (select) select.value = lang;
        document.dispatchEvent(new CustomEvent('i18n:ready', { detail: { lang, dict } }));
      });
  }

  function init() {
    const lang = detectLang();
    setLanguage(lang).then(() => {
      const select = document.getElementById('langSelect');
      if (select) {
        select.value = lang;
        select.addEventListener('change', (e) => {
          const target = e.target.value;
          localStorage.setItem(STORAGE_KEY, target);
          // Páginas con versión por idioma: ir a su URL (raíz = inglés, es/ y de/).
          if (document.documentElement.hasAttribute('data-localized')) {
            const file = location.pathname.split('/').pop() || 'index.html';
            const folder = target === DEFAULT_LANG ? '' : `${target}/`;
            const search = new URLSearchParams(location.search);
            search.delete('lang');
            const query = search.toString();
            location.href = rootPrefix() + folder + file + (query ? `?${query}` : '');
            return;
          }
          setLanguage(target);
        });
      }
    });
  }

  // API pública mínima por si otras páginas necesitan el diccionario actual.
  window.JIC_I18N = {
    getDict: () => currentDict,
    getLang: () => currentLang,
    t: (key) => resolveKey(currentDict || {}, key),
    productUrl: (id) => `producto-${encodeURIComponent(id)}.html?lang=${currentLang || document.documentElement.getAttribute('lang') || DEFAULT_LANG}`,
    workUrl: (id) => `obra-${encodeURIComponent(id)}.html?lang=${currentLang || document.documentElement.getAttribute('lang') || DEFAULT_LANG}`,
    setLanguage,
  };

  document.addEventListener('partials:loaded', init);
  // Si una página no usa header/footer compartidos, inicia igualmente.
  if (!document.querySelector('[data-include="header"]')) {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
