/**
 * Carga los partials compartidos (header y footer) en cada página
 * y dispara un evento cuando están listos para que el resto de
 * scripts (i18n, nav, etc.) puedan actuar sobre ellos.
 */
(function () {
  function loadPartial(selector, url) {
    const target = document.querySelector(selector);
    if (!target) return Promise.resolve();
    return fetch(url)
      .then((res) => res.text())
      .then((html) => {
        target.innerHTML = html;
      })
      .catch((err) => console.error(`No se pudo cargar ${url}`, err));
  }

  Promise.all([
    loadPartial('[data-include="header"]', 'partials/header.html'),
    loadPartial('[data-include="footer"]', 'partials/footer.html'),
  ]).then(() => {
    document.dispatchEvent(new CustomEvent('partials:loaded'));
  });
})();
