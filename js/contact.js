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

/* Muestra un popup de confirmación o error. */
const POPUP_TEXTS = {
  es: { success: ['¡Mensaje enviado!', 'Gracias por escribirme. Te responderé lo más pronto posible.'], error: ['No se pudo enviar', 'Inténtalo de nuevo en unos minutos.'], subscribed: ['¡Suscripción confirmada!', 'Gracias por suscribirte. Si quieres cancelar la suscripción, indícalo en el formulario de contacto.'], close: 'Cerrar' },
  en: { success: ['Message sent!', 'Thanks for writing to me. I\'ll reply as soon as possible.'], error: ['Couldn\'t send', 'Please try again in a few minutes.'], subscribed: ['Subscription confirmed!', 'Thanks for subscribing. If you want to cancel your subscription, let me know through the contact form.'], close: 'Close' },
  de: { success: ['Nachricht gesendet!', 'Danke für deine Nachricht. Ich antworte so schnell wie möglich.'], error: ['Senden fehlgeschlagen', 'Bitte versuche es in ein paar Minuten erneut.'], subscribed: ['Anmeldung bestätigt!', 'Danke für deine Anmeldung. Wenn du dich abmelden möchtest, sag mir das bitte über das Kontaktformular.'], close: 'Schließen' }
};

window.jicShowPopup = function (type) {
  const lang = POPUP_TEXTS[document.documentElement.lang] ? document.documentElement.lang : 'es';
  const texts = POPUP_TEXTS[lang];
  const isError = type === 'error';
  const [title, text] = texts[type] || texts.success;

  let popup = document.getElementById('contactPopup');
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'contactPopup';
    popup.className = 'contact-popup';
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-modal', 'true');
    popup.innerHTML =
      '<div class="contact-popup__dialog">' +
        '<div class="contact-popup__icon" aria-hidden="true"></div>' +
        '<h3 class="contact-popup__title"></h3>' +
        '<p class="contact-popup__text"></p>' +
        '<button type="button" class="btn btn--primary"></button>' +
      '</div>';
    document.body.appendChild(popup);

    const close = () => popup.classList.remove('is-open');
    popup.addEventListener('click', (e) => {
      if (e.target === popup || e.target.tagName === 'BUTTON') close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  }

  popup.classList.toggle('contact-popup--error', isError);
  popup.querySelector('.contact-popup__icon').textContent = isError ? '!' : '✓';
  popup.querySelector('.contact-popup__title').textContent = title;
  popup.querySelector('.contact-popup__text').textContent = text;
  popup.querySelector('button').textContent = texts.close;
  popup.classList.add('is-open');
};

(function () {
  const form = document.getElementById('contactForm');
  if (!form) return;
  const button = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    button.disabled = true;
    fetch(form.action, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new FormData(form)
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          window.jicShowPopup('success');
          form.reset();
        } else {
          window.jicShowPopup('error');
        }
      })
      .catch(() => window.jicShowPopup('error'))
      .finally(() => { button.disabled = false; });
  });
})();
