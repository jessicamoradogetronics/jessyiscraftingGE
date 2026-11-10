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

  // Idioma activo de una página localizada (lo fija i18n.js en <html lang>).
  // Las páginas sin versión por idioma (fanfics, lector) siempre usan la URL en inglés.
  function pageLang() {
    if (!document.documentElement.hasAttribute('data-localized')) return 'en';
    const lang = document.documentElement.getAttribute('lang');
    return LANGS.indexOf(lang) > -1 ? lang : 'en';
  }

  // URL pública de una página en un idioma: inglés en la raíz, es/ y de/ en su carpeta.
  function localizedUrl(url, lang) {
    const source = new URL(url, SITE_URL);
    const file = source.pathname.split('/').pop() || 'index.html';
    const out = new URL(SITE_URL + (lang === 'en' ? '' : lang + '/') + file);
    source.searchParams.forEach((value, key) => {
      if (key !== 'lang') out.searchParams.append(key, value);
    });
    return out.href;
  }

  function setCanonical(url) {
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = localizedUrl(url, pageLang());
  }

  function setAlternates(url) {
    document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());
    LANGS.forEach((lang) => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = lang;
      link.href = localizedUrl(url, lang);
      document.head.appendChild(link);
    });
    const def = document.createElement('link');
    def.rel = 'alternate';
    def.hreflang = 'x-default';
    def.href = localizedUrl(url, 'en');
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
      upsertMeta('property', 'og:url', localizedUrl(url, pageLang()));
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
