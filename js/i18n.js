/**
 * Motor de internacionalización (i18n) para JessyIsCrafting.
 * Lee los diccionarios en /i18n/{lang}.json, detecta el idioma
 * del navegador por defecto y sustituye todo el texto marcado
 * con data-i18n / data-i18n-attr, sin recargar la página.
 */
(function () {
  const SUPPORTED_LANGS = ['es', 'en', 'de'];
  const DEFAULT_LANG = 'es';
  const STORAGE_KEY = 'jic-lang';

  const cache = {};
  let currentDict = null;
  let currentLang = null;

  function detectLang() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_LANGS.includes(saved)) return saved;

    const browserLangs = navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language || DEFAULT_LANG];

    for (const bl of browserLangs) {
      const short = bl.slice(0, 2).toLowerCase();
      if (SUPPORTED_LANGS.includes(short)) return short;
    }
    return DEFAULT_LANG;
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

  function fetchDict(lang) {
    if (cache[lang]) return Promise.resolve(cache[lang]);
    return fetch(`i18n/${lang}.json`)
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
        localStorage.setItem(STORAGE_KEY, lang);
        applyTranslations(dict);
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
        select.addEventListener('change', (e) => setLanguage(e.target.value));
      }
    });
  }

  // API pública mínima por si otras páginas necesitan el diccionario actual.
  window.JIC_I18N = {
    getDict: () => currentDict,
    getLang: () => currentLang,
    t: (key) => resolveKey(currentDict || {}, key),
    setLanguage,
  };

  document.addEventListener('partials:loaded', init);
  // Si una página no usa header/footer compartidos, inicia igualmente.
  if (!document.querySelector('[data-include="header"]')) {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
