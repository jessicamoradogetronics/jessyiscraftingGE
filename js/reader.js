(function () {
  var stories = window.FANFICS || {};
  var params = new URLSearchParams(window.location.search);
  // Las paginas estaticas (fanfic-<id>-<n>.html) traen id y capitulo en el body.
  var prerendered = document.body.hasAttribute('data-prerendered');
  var storyId = document.body.getAttribute('data-story') || params.get('id');
  var chapterParam = document.body.getAttribute('data-chapter') || params.get('cap');
  var story = stories[storyId] || stories.worth;
  var chapters = story.chapters;
  var index = Math.min(Math.max(parseInt(chapterParam, 10) || 1, 1), chapters.length) - 1;
  var chapter = chapters[index];

  if (!chapters.length) {
    document.querySelector('.reader-toolbar').style.display = 'none';
    document.querySelector('.reader-side').style.display = 'none';
    document.getElementById('article').style.display = 'none';
    document.getElementById('comingSoon').hidden = false;
    return;
  }

  var SIZE_KEY = 'jic-reader-size';
  var THEME_KEY = 'jic-reader-theme';
  var SIZE_MIN = 14;
  var SIZE_MAX = 26;
  var SIZE_STEP = 2;
  var SIZE_DEFAULT = 18;

  var numberFormat = new Intl.NumberFormat('es-ES');
  var dateFormat = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

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

  function chapterUrl(n) {
    return 'fanfic-' + encodeURIComponent(story.id) + '-' + n + '.html';
  }

  // Quote goes after the second paragraph, matching the web and print output.
  function blocks(ch) {
    var out = [];
    ch.paragraphs.forEach(function (text, i) {
      out.push({ kind: 'p', text: text });
      if (i === 1 && ch.quote) out.push({ kind: 'q', text: ch.quote });
    });
    return out;
  }

  function make(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  var totalWords = chapters.reduce(function (sum, ch) { return sum + chapterWords(ch); }, 0);

  function renderSide() {
    document.getElementById('sideTitle').textContent = story.title;
    document.getElementById('sideSummary').textContent = story.summary;

    var meta = document.getElementById('sideMeta');
    var rows = [
      ['Estado', story.status],
      ['Capítulos', chapters.length],
      ['Palabras', numberFormat.format(totalWords)],
      ['Lectura aprox.', readMinutes(totalWords) + ' min'],
      ['Publicado', formatDate(chapters[0].date)],
      ['Actualizado', formatDate(chapters[chapters.length - 1].date)]
    ];
    rows.forEach(function (row) {
      meta.appendChild(make('dt', null, row[0]));
      meta.appendChild(make('dd', null, String(row[1])));
    });

    var toc = document.getElementById('toc');
    chapters.forEach(function (ch, i) {
      var li = make('li');
      var link = make('a');
      link.href = chapterUrl(i + 1);
      if (i === index) link.setAttribute('aria-current', 'page');
      link.appendChild(make('span', 'reader-toc__num', (i + 1) + '.'));
      link.appendChild(document.createTextNode(' ' + ch.title));
      li.appendChild(link);
      toc.appendChild(li);
    });
  }

  function renderHead() {
    var seo = window.JIC_SEO;
    var pageUrl = chapterUrl(index + 1);
    seo.setPageMeta({
      title: story.title + ' · Capítulo ' + (index + 1) + ' · JessyIsCrafting',
      description: story.summary,
      url: pageUrl
    });
    seo.setJsonLd('jsonld-chapter', {
      '@type': 'CreativeWork',
      name: chapter.title,
      description: seo.cleanText(story.summary),
      url: seo.absoluteUrl(pageUrl),
      position: index + 1,
      datePublished: chapter.date,
      isAccessibleForFree: true,
      author: { '@type': 'Organization', name: 'JessyIsCrafting', url: seo.SITE_URL },
      isPartOf: {
        '@type': 'CreativeWorkSeries',
        name: story.title,
        url: seo.absoluteUrl('fanfics.html')
      }
    });
    document.getElementById('crumbTitle').textContent = story.title;

    var tags = document.getElementById('tags');
    story.tags.forEach(function (tag) {
      tags.appendChild(make('span', 'reader-tag', tag));
    });

    document.getElementById('chapterKicker').textContent = 'Capítulo ' + (index + 1) + ' de ' + chapters.length;
    document.getElementById('chapterTitle').textContent = chapter.title;

    var words = chapterWords(chapter);
    var byline = document.getElementById('byline');
    byline.appendChild(make('span', null, 'Publicado el ' + formatDate(chapter.date)));
    byline.appendChild(make('span', null, numberFormat.format(words) + ' palabras'));
    byline.appendChild(make('span', null, 'Lectura aprox. ' + readMinutes(words) + ' min'));
  }

  function renderBody() {
    var body = document.getElementById('readerBody');
    blocks(chapter).forEach(function (block, i) {
      if (block.kind === 'q') {
        body.appendChild(make('blockquote', null, block.text));
        return;
      }
      var p = make('p', i === 0 ? 'reader-dropcap' : null, block.text);
      body.appendChild(p);
    });
  }

  function pagerItem(n, label, isNext) {
    var classes = 'reader-pager__btn' + (isNext ? ' reader-pager__btn--next' : '');
    if (n < 0 || n >= chapters.length) {
      var off = make('span', classes + ' reader-pager__btn--off');
      off.setAttribute('aria-disabled', 'true');
      off.appendChild(make('strong', null, label));
      return off;
    }
    var link = make('a', classes);
    link.href = chapterUrl(n + 1);
    link.appendChild(make('strong', null, label));
    return link;
  }

  function renderPager() {
    var pager = document.getElementById('pager');
    pager.appendChild(pagerItem(index - 1, '← Capítulo anterior', false));
    pager.appendChild(pagerItem(index + 1, 'Capítulo siguiente →', true));

    var select = make('select', 'reader-select');
    select.setAttribute('aria-label', 'Seleccionar capítulo');
    chapters.forEach(function (ch, i) {
      var option = make('option', null, (i + 1) + '. ' + ch.title);
      option.value = chapterUrl(i + 1);
      if (i === index) option.selected = true;
      select.appendChild(option);
    });
    select.addEventListener('change', function () {
      window.location.href = select.value;
    });
    document.getElementById('chapterPick').appendChild(select);
  }

  function applyTheme(theme) {
    document.body.classList.toggle('reader-dark', theme === 'dark');
    document.querySelectorAll('#themeSeg [data-theme]').forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.theme === theme));
    });
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* storage unavailable */ }
  }

  function applySize(size) {
    size = Math.min(Math.max(size, SIZE_MIN), SIZE_MAX);
    document.body.style.setProperty('--reader-size', size + 'px');
    document.getElementById('sizeValue').textContent = size + ' px';
    try { localStorage.setItem(SIZE_KEY, String(size)); } catch (e) { /* storage unavailable */ }
    return size;
  }

  function initTools() {
    document.querySelectorAll('#themeSeg [data-theme]').forEach(function (button) {
      button.addEventListener('click', function () { applyTheme(button.dataset.theme); });
    });
    applyTheme(localStorage.getItem(THEME_KEY) || 'light');

    var currentSize = parseInt(localStorage.getItem(SIZE_KEY), 10) || SIZE_DEFAULT;
    currentSize = applySize(currentSize);
    document.getElementById('sizeDown').addEventListener('click', function () {
      currentSize = applySize(currentSize - SIZE_STEP);
    });
    document.getElementById('sizeUp').addEventListener('click', function () {
      currentSize = applySize(currentSize + SIZE_STEP);
    });

    document.getElementById('dlPdf').addEventListener('click', downloadPdf);
    document.getElementById('dlEpub').addEventListener('click', downloadEpub);
    document.getElementById('shareBtn').addEventListener('click', shareLink);
  }

  // Counts one read per fanfic per browser session.
  function countRead() {
    var key = 'jic-reads-' + story.id;
    var sessionKey = 'jic-counted-' + story.id;
    var count = 0;
    try {
      count = parseInt(localStorage.getItem(key), 10) || 0;
      if (!sessionStorage.getItem(sessionKey)) {
        count += 1;
        localStorage.setItem(key, String(count));
        sessionStorage.setItem(sessionKey, '1');
      }
    } catch (e) { /* storage unavailable */ }
    document.getElementById('fanficReads').value = String(count);
  }

  function shareLink() {
    var url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: story.title, url: url }).catch(function () { /* cancelled */ });
      return;
    }
    var status = document.getElementById('shareStatus');
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(function () {
        status.textContent = 'Enlace copiado';
      }, function () {
        window.prompt('Copia el enlace:', url);
      });
      return;
    }
    window.prompt('Copia el enlace:', url);
  }

  function initProgress() {
    var article = document.getElementById('article');
    var bar = document.getElementById('readerProgress');
    function update() {
      var top = article.getBoundingClientRect().top + window.scrollY;
      var range = article.offsetHeight - window.innerHeight;
      var ratio = range > 0 ? (window.scrollY - top) / range : 1;
      bar.style.width = Math.min(Math.max(ratio, 0), 1) * 100 + '%';
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  // PDF

  var JSPDF_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

  function loadJsPDF() {
    if (window.jspdf) return Promise.resolve(window.jspdf.jsPDF);
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = JSPDF_URL;
      script.onload = function () { resolve(window.jspdf.jsPDF); };
      script.onerror = function () { reject(new Error('No se pudo cargar jsPDF')); };
      document.head.appendChild(script);
    });
  }

  function buildPdf(JsPDF) {
    var doc = new JsPDF({ unit: 'pt', format: 'a4' });
    var margin = 64;
    var pageHeight = doc.internal.pageSize.getHeight();
    var width = doc.internal.pageSize.getWidth() - margin * 2;
    var y = margin;

    function write(text, size, style, gap) {
      doc.setFont('times', style);
      doc.setFontSize(size);
      var lineHeight = size * 1.45;
      doc.splitTextToSize(text, width).forEach(function (line) {
        if (y + lineHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += lineHeight;
      });
      y += gap;
    }

    write(story.title, 24, 'bold', 8);
    write(story.summary, 12, 'italic', 24);
    chapters.forEach(function (ch, i) {
      write('Capítulo ' + (i + 1) + ': ' + ch.title, 16, 'bold', 12);
      blocks(ch).forEach(function (block) {
        write(block.text, 12, block.kind === 'q' ? 'italic' : 'normal', 10);
      });
      y += 14;
    });

    doc.save(story.id + '.pdf');
  }

  function downloadPdf() {
    var button = document.getElementById('dlPdf');
    var label = button.textContent;
    button.disabled = true;
    button.textContent = 'Generando…';
    loadJsPDF()
      .then(buildPdf)
      .catch(function () { button.textContent = 'Error, reintentar'; })
      .then(function () {
        button.disabled = false;
        if (button.textContent === 'Generando…') button.textContent = label;
      });
  }

  // EPUB

  var JSZIP_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';

  function loadJSZip() {
    if (window.JSZip) return Promise.resolve(window.JSZip);
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = JSZIP_URL;
      script.onload = function () { resolve(window.JSZip); };
      script.onerror = function () { reject(new Error('No se pudo cargar JSZip')); };
      document.head.appendChild(script);
    });
  }

  function xmlEscape(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function xhtmlPage(title, bodyHtml) {
    return '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<!DOCTYPE html>\n' +
      '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="es" lang="es">\n' +
      '<head><meta charset="utf-8"/><title>' + xmlEscape(title) + '</title>' +
      '<link rel="stylesheet" type="text/css" href="style.css"/></head>\n' +
      '<body>\n' + bodyHtml + '\n</body>\n</html>';
  }

  function epubChapterHtml(ch, n) {
    var inner = blocks(ch).map(function (block) {
      return (block.kind === 'q' ? '<blockquote><p>' : '<p>') + xmlEscape(block.text) +
        (block.kind === 'q' ? '</p></blockquote>' : '</p>');
    }).join('\n');
    return xhtmlPage(ch.title, '<h1>' + xmlEscape('Capítulo ' + n + ': ' + ch.title) + '</h1>\n' + inner);
  }

  function buildEpub(JSZip) {
    var zip = new JSZip();
    var bookId = 'urn:jessyiscrafting:' + story.id;
    var modified = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    var css = 'body { font-family: Georgia, serif; line-height: 1.6; }\n' +
      'h1 { font-size: 1.6em; margin-bottom: 1em; }\n' +
      'blockquote { font-style: italic; margin: 1.5em 1em; }\n' +
      'p { margin: 0 0 1em; text-indent: 1.2em; }';

    zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
    zip.file('META-INF/container.xml',
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">' +
      '<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>' +
      '</container>');

    var manifest = '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>\n' +
      '<item id="style" href="style.css" media-type="text/css"/>\n' +
      '<item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>\n';
    var spine = '<itemref idref="title"/>\n';
    var navItems = '';

    chapters.forEach(function (ch, i) {
      var n = i + 1;
      manifest += '<item id="ch' + n + '" href="chapter-' + n + '.xhtml" media-type="application/xhtml+xml"/>\n';
      spine += '<itemref idref="ch' + n + '"/>\n';
      navItems += '<li><a href="chapter-' + n + '.xhtml">' + xmlEscape(n + '. ' + ch.title) + '</a></li>\n';
      zip.file('OEBPS/chapter-' + n + '.xhtml', epubChapterHtml(ch, n));
    });

    zip.file('OEBPS/content.opf',
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">\n' +
      '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">\n' +
      '<dc:identifier id="bookid">' + xmlEscape(bookId) + '</dc:identifier>\n' +
      '<dc:title>' + xmlEscape(story.title) + '</dc:title>\n' +
      '<dc:language>es</dc:language>\n' +
      '<dc:creator>JessyIsCrafting</dc:creator>\n' +
      '<meta property="dcterms:modified">' + modified + '</meta>\n' +
      '</metadata>\n' +
      '<manifest>\n' + manifest + '</manifest>\n' +
      '<spine>\n' + spine + '</spine>\n' +
      '</package>');

    zip.file('OEBPS/nav.xhtml', xhtmlPage('Índice',
      '<nav xmlns:epub="http://www.idpf.org/2007/ops" epub:type="toc"><h1>Índice</h1><ol>\n' +
      navItems + '</ol></nav>'));

    zip.file('OEBPS/title.xhtml', xhtmlPage(story.title,
      '<h1>' + xmlEscape(story.title) + '</h1>\n<p>' + xmlEscape(story.summary) + '</p>'));

    zip.file('OEBPS/style.css', css);

    return zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
  }

  function download(blob, filename) {
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function downloadEpub() {
    var button = document.getElementById('dlEpub');
    var label = button.textContent;
    button.disabled = true;
    button.textContent = 'Generando…';
    loadJSZip()
      .then(buildEpub)
      .then(function (blob) { download(blob, story.id + '.epub'); })
      .catch(function () { button.textContent = 'Error, reintentar'; return; })
      .then(function () {
        button.disabled = false;
        if (button.textContent === 'Generando…') button.textContent = label;
      });
  }

  if (prerendered) {
    // El HTML ya viene renderizado; solo falta el selector de capitulos.
    var pick = document.querySelector('#chapterPick select');
    if (pick) {
      pick.addEventListener('change', function () {
        window.location.href = pick.value;
      });
    }
  } else {
    renderSide();
    renderHead();
    renderBody();
    renderPager();
  }
  initTools();
  initProgress();
  countRead();
})();
