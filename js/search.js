/**
 * Buscador global del header: busca en productos de la tienda, obras de la
 * galería, fanfics y capítulos, y muestra resultados mientras se escribe.
 */
(function () {
  const PRODUCTS_URL = 'data/products.json';
  const GALLERY_URL = 'data/galeria.json';
  const DEBOUNCE_MS = 120;
  const MAX_RESULTS = 10;

  let wrap = null;
  let input = null;
  let list = null;
  let entries = null;
  let indexPromise = null;
  let results = [];
  let terms = [];
  let activeIndex = -1;
  let runToken = 0;
  let timer = null;

  // Pliega acentos y mayúsculas sin alterar la longitud del texto,
  // así los índices calculados sobre la versión plegada sirven para el original.
  function fold(str) {
    return str.split('').map((c) => c.normalize('NFD').charAt(0).toLowerCase()).join('');
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function termsOf(query) {
    return fold(query.trim()).split(/\s+/).filter(Boolean);
  }

  function highlight(text, searchTerms) {
    const folded = fold(text);
    const ranges = [];
    searchTerms.forEach((t) => {
      let from = 0;
      for (;;) {
        const i = folded.indexOf(t, from);
        if (i === -1) break;
        ranges.push([i, i + t.length]);
        from = i + t.length;
      }
    });
    ranges.sort((a, b) => a[0] - b[0]);

    let html = '';
    let pos = 0;
    ranges.forEach(([s, e]) => {
      if (s < pos) return;
      html += escapeHtml(text.slice(pos, s)) + '<mark>' + escapeHtml(text.slice(s, e)) + '</mark>';
      pos = e;
    });
    return html + escapeHtml(text.slice(pos));
  }

  function snippetFor(entry, searchTerms) {
    const body = entry.body;
    let idx = -1;
    let len = 0;
    searchTerms.forEach((t) => {
      const i = entry.foldBody.indexOf(t);
      if (i !== -1 && (idx === -1 || i < idx)) {
        idx = i;
        len = t.length;
      }
    });
    if (!body) return '';
    const start = idx === -1 ? 0 : Math.max(0, idx - 50);
    const end = Math.min(body.length, (idx === -1 ? 0 : idx + len) + 90);
    const text = (start > 0 ? '…' : '') + body.slice(start, end).replace(/\s+/g, ' ') + (end < body.length ? '…' : '');
    return highlight(text, searchTerms);
  }

  function ensureFanfics() {
    if (window.FANFICS) return Promise.resolve(window.FANFICS);
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'js/fanfic-data.js';
      script.onload = () => resolve(window.FANFICS || {});
      script.onerror = () => resolve({});
      document.head.appendChild(script);
    });
  }

  function makeEntry(fields) {
    return Object.assign(fields, {
      foldTitle: fold(fields.title || ''),
      foldBody: fold(fields.body || ''),
      foldContext: fold(fields.context || ''),
    });
  }

  function buildEntries(dict, products, fanfics, gallery) {
    const out = [];

    const productTexts = dict.products || {};
    products.forEach((p) => {
      const t = productTexts[p.id];
      if (!t || !t.name) return;
      const cover = p.images && p.images[0];
      out.push(makeEntry({
        type: 'product',
        title: t.name,
        body: [t.short, t.description, t.customization].filter(Boolean).join('\n'),
        image: cover ? `${cover}-thumb.jpg` : '',
        url: `producto.html?id=${encodeURIComponent(p.id)}`,
      }));
    });

    const galleryImages = {};
    gallery.forEach((g) => { galleryImages[g.id] = g.images || []; });
    const works = (dict.works && dict.works.items) || {};
    Object.keys(works).forEach((id) => {
      const w = works[id];
      out.push(makeEntry({
        type: 'work',
        title: w.title || id,
        body: w.description || '',
        image: (galleryImages[id] && galleryImages[id][0]) || '',
        url: `obra.html?id=${encodeURIComponent(id)}`,
      }));
    });

    const fanficTexts = (dict.fanfics && dict.fanfics.items) || {};
    Object.keys(fanfics).forEach((id) => {
      const story = fanfics[id];
      const t = fanficTexts[id] || {};
      const title = t.title || story.title;
      out.push(makeEntry({
        type: 'fanfic',
        title,
        body: [t.summary || story.summary, (story.tags || []).join(' ')].join('\n'),
        url: (story.chapters || []).length ? `fanfic-${encodeURIComponent(id)}-1.html` : 'fanfics.html',
      }));
      (story.chapters || []).forEach((ch, i) => {
        out.push(makeEntry({
          type: 'chapter',
          title: ch.title,
          context: title,
          body: [ch.paragraphs.join('\n'), ch.quote || ''].join('\n'),
          url: `fanfic-${encodeURIComponent(id)}-${i + 1}.html`,
        }));
      });
    });

    return out;
  }

  function ensureIndex() {
    if (entries) return Promise.resolve(entries);
    if (indexPromise) return indexPromise;
    const dict = window.JIC_I18N && window.JIC_I18N.getDict();
    if (!dict) return null;

    indexPromise = Promise.all([
      fetch(PRODUCTS_URL).then((res) => res.json()),
      ensureFanfics(),
      fetch(GALLERY_URL).then((res) => res.json()),
    ]).then(([products, fanfics, gallery]) => {
      entries = buildEntries(dict, products, fanfics, gallery);
      return entries;
    }).catch((err) => {
      indexPromise = null;
      console.error('No se pudo construir el índice de búsqueda', err);
      return [];
    });
    return indexPromise;
  }

  function scoreEntry(entry) {
    const hay = entry.foldTitle + '\n' + entry.foldBody + '\n' + entry.foldContext;
    if (!terms.every((t) => hay.includes(t))) return -1;
    let score = 0;
    terms.forEach((t) => {
      if (entry.foldTitle.includes(t)) score += 3;
      if (entry.foldBody.includes(t)) score += 1;
    });
    if (entry.foldTitle.startsWith(terms[0])) score += 2;
    return score;
  }

  function search() {
    if (!terms.length || !entries) return [];
    return entries
      .map((entry) => ({ entry, score: scoreEntry(entry) }))
      .filter((r) => r.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS)
      .map((r) => r.entry);
  }

  function labels() {
    const dict = window.JIC_I18N && window.JIC_I18N.getDict();
    return (dict && dict.search) || {};
  }

  function render() {
    const s = labels();
    const types = s.types || {};

    if (!results.length) {
      list.innerHTML = `<li class="site-search__empty">${escapeHtml(s.empty || 'Sin resultados')}</li>`;
    } else {
      list.innerHTML = results.map((r, i) => {
        const typeLabel = types[r.type] || r.type;
        const context = r.context ? ` · ${escapeHtml(r.context)}` : '';
        const snippet = snippetFor(r, terms);
        return `
          <li role="option" id="siteSearchOpt${i}" class="site-search__item${i === activeIndex ? ' is-active' : ''}" aria-selected="${i === activeIndex}">
            <a href="${escapeHtml(r.url)}" tabindex="-1">
              ${r.image ? `<img class="site-search__thumb" src="${escapeHtml(r.image)}" alt="" loading="lazy">` : ''}
              <span class="site-search__text">
                <span class="site-search__type">${escapeHtml(typeLabel)}${context}</span>
                <span class="site-search__title">${highlight(r.title, terms)}</span>
                ${snippet ? `<span class="site-search__snippet">${snippet}</span>` : ''}
              </span>
            </a>
          </li>`;
      }).join('');
    }

    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    updateActiveDescendant();
  }

  function close() {
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    activeIndex = -1;
  }

  function updateActiveDescendant() {
    list.querySelectorAll('[role="option"]').forEach((li, i) => {
      const active = i === activeIndex;
      li.classList.toggle('is-active', active);
      li.setAttribute('aria-selected', String(active));
      if (active) {
        input.setAttribute('aria-activedescendant', li.id);
        li.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  function run() {
    const query = input.value;
    const token = ++runToken;
    terms = termsOf(query);
    if (!terms.length) {
      results = [];
      close();
      return;
    }
    const ready = ensureIndex();
    if (!ready) return;
    ready.then(() => {
      if (token !== runToken) return;
      results = search();
      activeIndex = results.length ? 0 : -1;
      render();
    });
  }

  function moveActive(step) {
    if (!results.length) return;
    activeIndex = (activeIndex + step + results.length) % results.length;
    updateActiveDescendant();
  }

  function bind() {
    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(run, DEBOUNCE_MS);
    });

    input.addEventListener('focus', () => {
      if (input.value.trim() && results.length) render();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (list.hidden && results.length) render();
        moveActive(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveActive(-1);
      } else if (e.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
        e.preventDefault();
        location.href = results[activeIndex].url;
      } else if (e.key === 'Escape') {
        close();
      }
    });

    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) close();
    });
  }

  function init() {
    wrap = document.getElementById('siteSearch');
    input = document.getElementById('siteSearchInput');
    list = document.getElementById('siteSearchResults');
    if (!wrap || !input || !list) return;
    bind();
  }

  document.addEventListener('partials:loaded', init);
  document.addEventListener('i18n:ready', () => {
    entries = null;
    indexPromise = null;
    if (input && input.value.trim()) run();
  });
})();
