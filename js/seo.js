/**
 * Helpers para metadatos (title, description, canonical, og:*) y JSON-LD
 * en las páginas que se rellenan desde JavaScript (obra, producto, leer).
 */
(function () {
  const SITE_URL = 'https://jessyiscrafting.com/';

  function absoluteUrl(path) {
    return new URL(path, SITE_URL).href;
  }

  function cleanText(text, max) {
    return String(text || '').replace(/\s+/g, ' ').trim().slice(0, max || 160);
  }

  function upsertMeta(attr, key, content) {
    let el = document.head.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  const LANGS = ['es', 'en', 'de'];

  // Idioma de la URL (?lang=); sin parámetro o no válido, español.
  function urlLang() {
    const lang = new URLSearchParams(location.search).get('lang');
    return LANGS.indexOf(lang) > -1 ? lang : 'es';
  }

  // El español es la versión sin ?lang=.
  function langUrl(url, lang) {
    const u = new URL(url, SITE_URL);
    u.searchParams.delete('lang');
    if (lang !== 'es') u.searchParams.set('lang', lang);
    return u.href;
  }

  function setCanonical(url) {
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = langUrl(url, urlLang());
  }

  function setAlternates(url) {
    document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());
    LANGS.forEach((lang) => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = lang;
      link.href = langUrl(url, lang);
      document.head.appendChild(link);
    });
    const def = document.createElement('link');
    def.rel = 'alternate';
    def.hreflang = 'x-default';
    def.href = langUrl(url, 'es');
    document.head.appendChild(def);
  }

  // opts: { title, description, url, image, localized } (url e image son rutas relativas o absolutas; localized activa hreflang)
  function setPageMeta(opts) {
    if (opts.title) {
      document.title = opts.title;
      upsertMeta('property', 'og:title', opts.title);
    }
    if (opts.description) {
      const desc = cleanText(opts.description);
      upsertMeta('name', 'description', desc);
      upsertMeta('property', 'og:description', desc);
    }
    if (opts.url) {
      const url = absoluteUrl(opts.url);
      setCanonical(url);
      if (opts.localized) setAlternates(url);
      upsertMeta('property', 'og:url', langUrl(url, urlLang()));
    }
    if (opts.image) {
      upsertMeta('property', 'og:image', absoluteUrl(opts.image));
      upsertMeta('name', 'twitter:card', 'summary_large_image');
    }
  }

  function setJsonLd(id, data) {
    let script = document.getElementById(id);
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = id;
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(Object.assign({ '@context': 'https://schema.org' }, data));
  }

  // Páginas estáticas: sincroniza canonical con el ?lang= de la URL.
  document.addEventListener('DOMContentLoaded', () => {
    const canonical = document.head.querySelector('link[rel="canonical"]');
    if (canonical && canonical.href) setCanonical(canonical.href);
  });

  window.JIC_SEO = {
    SITE_URL: SITE_URL,
    absoluteUrl: absoluteUrl,
    cleanText: cleanText,
    setPageMeta: setPageMeta,
    setJsonLd: setJsonLd
  };
})();
