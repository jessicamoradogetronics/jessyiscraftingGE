/**
 * Detalle de obra de la galería (obra.html?id=...).
 * Carga data/galeria.json, pinta los textos desde i18n (works.items) y las imágenes en grande.
 * Sin compra: sólo botón de consulta.
 */
(function () {
  let works = [];
  let currentWork = null;

  function getIdFromUrl() {
    return new URLSearchParams(window.location.search).get('id');
  }

  // Clave i18n del overlay de cada tarjeta de galeria.html.
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

  function captionFor(dict, id) {
    const key = CAPTION_KEYS[id];
    const value = key && dict.gallery && dict.gallery.captions && dict.gallery.captions[key];
    return typeof value === 'string' ? value : '';
  }

  function renderDescription(text) {
    const container = document.getElementById('workDescription');
    if (!container) return;
    container.innerHTML = '';
    String(text)
      .split(/\n\s*\n/)
      .map((para) => para.trim())
      .filter(Boolean)
      .forEach((para) => {
        const p = document.createElement('p');
        p.textContent = para;
        container.appendChild(p);
      });
  }

  function renderImages(work, title) {
    const container = document.getElementById('workImages');
    if (!container) return;
    container.classList.toggle('work-images--compact', !!work.compact);
    container.innerHTML = work.images
      .map((src) => `
        <figure class="work-images__item">
          <img src="${src}" alt="${title}" loading="lazy" data-lightbox="${src}">
        </figure>`)
      .join('');
  }

  function render() {
    const dict = window.JIC_I18N.getDict();
    if (!dict || !currentWork) return;
    const t = (dict.works && dict.works.items && dict.works.items[currentWork.id]) || {};
    const title = captionFor(dict, currentWork.id) || t.title || currentWork.id;

    const seo = window.JIC_SEO;
    const pageUrl = `obra.html?id=${encodeURIComponent(currentWork.id)}`;
    seo.setPageMeta({
      title: `${title} · JessyIsCrafting`,
      description: t.description,
      url: pageUrl,
      localized: true,
      image: currentWork.images[0]
    });
    seo.setJsonLd('jsonld-work', {
      '@type': 'VisualArtwork',
      name: title,
      description: seo.cleanText(t.description),
      image: seo.absoluteUrl(currentWork.images[0]),
      url: seo.absoluteUrl(pageUrl),
      creator: { '@type': 'Organization', name: 'JessyIsCrafting', url: seo.SITE_URL }
    });

    document.getElementById('breadcrumbCurrent').textContent = title;
    document.getElementById('workTitle').textContent = title;
    renderDescription(t.description || '');

    const consultBtn = document.getElementById('workConsultButton');
    if (consultBtn) consultBtn.href = `contacto.html?producto=${encodeURIComponent(title)}`;

    renderImages(currentWork, title);
    if (currentWork.images.some((src) => src.includes('/cuadros/'))) {
      const back = document.getElementById('workBack');
      if (back) back.href = 'galeria.html#cuadros';
    }
    if (currentWork.images.some((src) => src.includes('/dibujos/'))) {
      const back = document.getElementById('workBack');
      if (back) back.href = 'galeria.html#dibujos';
    }
    setBackLink(currentWork.id);
  }

  function setBackLink(id) {
    const back = document.getElementById('workBack');
    if (!back) return;
    fetch('data/products.json')
      .then((res) => res.json())
      .then((products) => {
        const item = products.find((p) => p.id === id);
        if (item && item.category === 'artesanias') back.href = 'galeria.html#artesanias';
      })
      .catch((err) => console.error('No se pudo leer el producto', err));
  }

  function init() {
    const id = getIdFromUrl();
    fetch('data/galeria.json')
      .then((res) => res.json())
      .then((data) => {
        works = data;
        currentWork = works.find((w) => w.id === id);
        const notFound = document.getElementById('workNotFound');
        const wrapper = document.getElementById('workWrapper');
        if (!currentWork) {
          if (notFound) notFound.hidden = false;
          if (wrapper) wrapper.hidden = true;
          return;
        }
        if (window.JIC_I18N.getDict()) render();
      })
      .catch((err) => console.error('No se pudo cargar la obra', err));
    document.addEventListener('i18n:ready', render);
  }

  document.addEventListener('partials:loaded', init);
})();
