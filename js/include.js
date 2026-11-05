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
        target.innerHTML = html.split('{{BASE}}').join('');
      })
      .catch((err) => console.error(`No se pudo cargar ${url}`, err));
  }

  // Espera a que el documento termine de parsear: con caché fría los scripts
  // del final del body aún no se han ejecutado cuando llegan los partials.
  const domReady = document.readyState === 'loading'
    ? new Promise((resolve) => document.addEventListener('DOMContentLoaded', resolve, { once: true }))
    : Promise.resolve();

  Promise.all([
    loadPartial('[data-include="header"]', 'partials/header.html'),
    loadPartial('[data-include="footer"]', 'partials/footer.html'),
    domReady,
  ]).then(() => {
    document.dispatchEvent(new CustomEvent('partials:loaded'));
  });
})();
