/**
 * Prefill del formulario de contacto cuando se llega desde la página
 * de un producto (contacto.html?producto=Nombre).
 */
(function () {
  function init() {
    const params = new URLSearchParams(location.search);
    const producto = params.get('producto');
    if (!producto) return;

    const subjectField = document.getElementById('contactSubject');
    const messageField = document.getElementById('contactMessage');
    const dict = window.JIC_I18N ? window.JIC_I18N.getDict() : null;

    function fill(dict) {
      const label = dict && dict.contact ? dict.contact.prefillMessage : 'Hola, me gustaría encargar:';
      if (subjectField && !subjectField.value) subjectField.value = producto;
      if (messageField && !messageField.value) messageField.value = `${label} "${producto}". `;
    }

    if (dict) {
      fill(dict);
    } else {
      document.addEventListener('i18n:ready', (e) => fill(e.detail.dict), { once: true });
    }
  }

  document.addEventListener('partials:loaded', init);
})();
