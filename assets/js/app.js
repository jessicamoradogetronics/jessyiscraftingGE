/**
 * App bootstrap: resolves the base path, injects shared partials
 * (header/footer/modal), wires up global interactions, and kicks off i18n.
 * Dispatches "app:ready" once everything is in place so page scripts can
 * render their own dynamic content (products, FAQ list, etc.).
 */
(function (global) {
  "use strict";

  function injectIncludes() {
    var base = global.SITE_BASE;
    var nodes = Array.prototype.slice.call(document.querySelectorAll("[data-include]"));
    return Promise.all(
      nodes.map(function (node) {
        var name = node.getAttribute("data-include");
        return fetch(base + "partials/" + name + ".html")
          .then(function (res) {
            return res.text();
          })
          .then(function (html) {
            node.outerHTML = html.split("{{BASE}}").join(base);
          });
      })
    );
  }

  function highlightCurrentNavLink() {
    var pageId = document.body.getAttribute("data-page-id");
    if (!pageId) return;
    document.querySelectorAll("[data-page-id]").forEach(function (link) {
      if (link !== document.body && link.getAttribute("data-page-id") === pageId) {
        link.setAttribute("aria-current", "page");
      }
    });
  }

  function initMobileNav() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var nav = document.querySelector("[data-main-nav]");
    var backdrop = document.querySelector("[data-nav-backdrop]");
    if (!toggle || !nav) return;

    function close() {
      nav.classList.remove("is-open");
      if (backdrop) backdrop.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }

    function toggleNav() {
      var isOpen = nav.classList.toggle("is-open");
      if (backdrop) backdrop.classList.toggle("is-open", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
    }

    toggle.addEventListener("click", toggleNav);
    if (backdrop) backdrop.addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", close);
    });
  }

  function initLanguageSwitcher() {
    document.querySelectorAll("[data-lang]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        global.i18n.setLanguage(btn.getAttribute("data-lang"));
      });
    });
    function updateButtons(lang) {
      document.querySelectorAll("[data-lang]").forEach(function (btn) {
        btn.setAttribute("aria-current", btn.getAttribute("data-lang") === lang ? "true" : "false");
      });
    }
    document.addEventListener("i18n:ready", function (e) {
      updateButtons(e.detail.lang);
    });
    document.addEventListener("i18n:changed", function (e) {
      updateButtons(e.detail.lang);
    });
  }

  /** Delegated handlers work for content rendered now or later (e.g. product cards). */
  function initGlobalDelegation() {
    var modal = document.querySelector("[data-product-modal]");
    var lastFocused = null;

    function openModal(card) {
      if (!modal) return;
      lastFocused = document.activeElement;
      var img = modal.querySelector("[data-modal-image]");
      var title = modal.querySelector("[data-modal-title]");
      var desc = modal.querySelector("[data-modal-description]");
      var price = modal.querySelector("[data-modal-price]");
      var customWrap = modal.querySelector("[data-modal-customization-wrap]");
      var customText = modal.querySelector("[data-modal-customization]");
      var cta = modal.querySelector("[data-modal-cta]");

      if (img) {
        img.src = card.getAttribute("data-image") || "";
        img.alt = card.getAttribute("data-name") || "";
      }
      if (title) title.textContent = card.getAttribute("data-name") || "";
      if (desc) desc.textContent = card.getAttribute("data-description") || "";
      if (price) price.textContent = card.getAttribute("data-price-label") || "";
      var note = card.getAttribute("data-customization") || "";
      if (customWrap && customText) {
        if (note) {
          customText.textContent = note;
          customWrap.hidden = false;
        } else {
          customWrap.hidden = true;
        }
      }
      if (cta) cta.href = card.getAttribute("data-cta-href") || "#";

      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      var closeBtn = modal.querySelector("[data-modal-close]");
      if (closeBtn) closeBtn.focus();
    }

    function closeModal() {
      if (!modal) return;
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    document.addEventListener("click", function (e) {
      var opener = e.target.closest("[data-open-modal]");
      if (opener) {
        var card = opener.closest("[data-product]");
        if (card) openModal(card);
        return;
      }
      if (e.target.closest("[data-modal-close]")) {
        closeModal();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal && modal.classList.contains("is-open")) closeModal();
    });

    // FAQ-style accordions: delegated so dynamically rendered items work too.
    document.addEventListener("click", function (e) {
      var trigger = e.target.closest("[data-accordion-trigger]");
      if (!trigger) return;
      var item = trigger.closest("[data-accordion-item]");
      if (!item) return;
      var isOpen = item.getAttribute("data-open") === "true";
      var group = item.parentElement;
      if (group) {
        group.querySelectorAll("[data-accordion-item]").forEach(function (sibling) {
          sibling.setAttribute("data-open", "false");
          var siblingTrigger = sibling.querySelector("[data-accordion-trigger]");
          if (siblingTrigger) siblingTrigger.setAttribute("aria-expanded", "false");
        });
      }
      item.setAttribute("data-open", isOpen ? "false" : "true");
      trigger.setAttribute("aria-expanded", isOpen ? "false" : "true");
    });
  }

  /** Render an i18n array (e.g. "faq.items") into a container using a template function. */
  function renderArrayInto(container, key, templateFn) {
    if (!container) return;
    var items = global.i18n.tRaw(key) || [];
    container.innerHTML = items.map(templateFn).join("");
  }

  function boot() {
    global.SITE_BASE = document.body.getAttribute("data-base") || "./";
    injectIncludes()
      .then(function () {
        highlightCurrentNavLink();
        initMobileNav();
        initLanguageSwitcher();
        initGlobalDelegation();
        document.querySelectorAll("[data-current-year]").forEach(function (el) {
          el.textContent = new Date().getFullYear();
        });
        return global.i18n.init();
      })
      .then(function () {
        document.dispatchEvent(new CustomEvent("app:ready"));
      });
  }

  global.app = { renderArrayInto: renderArrayInto };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window);
