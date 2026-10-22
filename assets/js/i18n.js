/**
 * Lightweight client-side i18n: fetches the three language JSON files once,
 * then swaps text on the page instantly (no reload, no build step).
 */
(function (global) {
  "use strict";

  var SUPPORTED_LANGS = ["es", "en", "de"];
  var DEFAULT_LANG = "es";
  var STORAGE_KEY = "jic_lang";

  var translations = {};
  var currentLang = DEFAULT_LANG;

  function detectInitialLang() {
    var stored = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      /* localStorage may be unavailable (privacy mode); ignore */
    }
    if (stored && SUPPORTED_LANGS.indexOf(stored) !== -1) return stored;
    var nav = ((navigator.language || DEFAULT_LANG).slice(0, 2) || DEFAULT_LANG).toLowerCase();
    return SUPPORTED_LANGS.indexOf(nav) !== -1 ? nav : DEFAULT_LANG;
  }

  function lookup(dict, key) {
    if (!dict) return undefined;
    return key.split(".").reduce(function (obj, part) {
      return obj && obj[part] !== undefined ? obj[part] : undefined;
    }, dict);
  }

  /** Translate a dotted key to a string for the current language (with Spanish fallback). */
  function t(key) {
    var value = lookup(translations[currentLang], key);
    if (value !== undefined) return value;
    var fallback = lookup(translations[DEFAULT_LANG], key);
    return fallback !== undefined ? fallback : key;
  }

  /** Return the raw value (array/object) behind a dotted key, for the current language. */
  function tRaw(key, lang) {
    var value = lookup(translations[lang || currentLang], key);
    if (value !== undefined) return value;
    return lookup(translations[DEFAULT_LANG], key);
  }

  function applyTranslations(root) {
    var scope = root || document;
    scope.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    scope.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
    });
    scope.querySelectorAll("[data-i18n-aria-label]").forEach(function (el) {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria-label")));
    });
    scope.querySelectorAll("[data-i18n-alt]").forEach(function (el) {
      el.setAttribute("alt", t(el.getAttribute("data-i18n-alt")));
    });
    scope.querySelectorAll("[data-i18n-title]").forEach(function (el) {
      el.setAttribute("title", t(el.getAttribute("data-i18n-title")));
    });
    document.documentElement.setAttribute("lang", currentLang);

    var titleEl = document.querySelector("title[data-i18n-title-key]");
    if (titleEl) {
      document.title = t(titleEl.getAttribute("data-i18n-title-key")) + t("meta.titleSuffix");
    }
    var descEl = document.querySelector("meta[data-i18n-desc-key]");
    if (descEl) {
      descEl.setAttribute("content", t(descEl.getAttribute("data-i18n-desc-key")));
    }
  }

  function setLanguage(lang) {
    if (SUPPORTED_LANGS.indexOf(lang) === -1 || lang === currentLang) return;
    currentLang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      /* ignore */
    }
    applyTranslations();
    document.dispatchEvent(new CustomEvent("i18n:changed", { detail: { lang: lang } }));
  }

  function getLanguage() {
    return currentLang;
  }

  function init() {
    currentLang = detectInitialLang();
    var base = global.SITE_BASE || "./";
    var requests = SUPPORTED_LANGS.map(function (lang) {
      return fetch(base + "assets/data/i18n/" + lang + ".json").then(function (res) {
        return res.json();
      });
    });
    return Promise.all(requests).then(function (results) {
      SUPPORTED_LANGS.forEach(function (lang, i) {
        translations[lang] = results[i];
      });
      applyTranslations();
      document.dispatchEvent(new CustomEvent("i18n:ready", { detail: { lang: currentLang } }));
    });
  }

  global.i18n = {
    init: init,
    t: t,
    tRaw: tRaw,
    applyTranslations: applyTranslations,
    setLanguage: setLanguage,
    getLanguage: getLanguage,
    SUPPORTED_LANGS: SUPPORTED_LANGS,
  };
})(window);
