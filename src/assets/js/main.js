(function () {
  "use strict";

  /* Mobile navigation toggle */
  var navToggle = document.querySelector("[data-nav-toggle]");
  var nav = document.querySelector("[data-main-nav]");
  var backdrop = document.querySelector("[data-nav-backdrop]");

  function closeNav() {
    if (!nav) return;
    nav.classList.remove("is-open");
    if (backdrop) backdrop.classList.remove("is-open");
    if (navToggle) navToggle.setAttribute("aria-expanded", "false");
  }

  function toggleNav() {
    if (!nav) return;
    var isOpen = nav.classList.toggle("is-open");
    if (backdrop) backdrop.classList.toggle("is-open", isOpen);
    if (navToggle) navToggle.setAttribute("aria-expanded", String(isOpen));
  }

  if (navToggle) {
    navToggle.addEventListener("click", toggleNav);
  }
  if (backdrop) {
    backdrop.addEventListener("click", closeNav);
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeNav();
  });

  /* FAQ accordion */
  var accordionItems = document.querySelectorAll("[data-accordion-item]");
  accordionItems.forEach(function (item) {
    var trigger = item.querySelector("[data-accordion-trigger]");
    if (!trigger) return;
    trigger.addEventListener("click", function () {
      var isOpen = item.getAttribute("data-open") === "true";
      accordionItems.forEach(function (other) {
        other.setAttribute("data-open", "false");
        var otherTrigger = other.querySelector("[data-accordion-trigger]");
        if (otherTrigger) otherTrigger.setAttribute("aria-expanded", "false");
      });
      item.setAttribute("data-open", isOpen ? "false" : "true");
      trigger.setAttribute("aria-expanded", isOpen ? "false" : "true");
    });
  });

  /* Product quick-view modal */
  var modal = document.querySelector("[data-product-modal]");
  if (modal) {
    var modalMediaImg = modal.querySelector("[data-modal-image]");
    var modalTitle = modal.querySelector("[data-modal-title]");
    var modalDesc = modal.querySelector("[data-modal-description]");
    var modalPrice = modal.querySelector("[data-modal-price]");
    var modalCustom = modal.querySelector("[data-modal-customization]");
    var modalCustomWrap = modal.querySelector("[data-modal-customization-wrap]");
    var modalCta = modal.querySelector("[data-modal-cta]");
    var closeButtons = modal.querySelectorAll("[data-modal-close]");
    var lastFocused = null;

    function openModal(trigger) {
      var card = trigger.closest("[data-product]");
      if (!card) return;
      lastFocused = trigger;

      if (modalMediaImg) {
        modalMediaImg.src = card.getAttribute("data-image") || "";
        modalMediaImg.alt = card.getAttribute("data-name") || "";
      }
      if (modalTitle) modalTitle.textContent = card.getAttribute("data-name") || "";
      if (modalDesc) modalDesc.textContent = card.getAttribute("data-description") || "";
      if (modalPrice) modalPrice.textContent = card.getAttribute("data-price-label") || "";

      var customNote = card.getAttribute("data-customization") || "";
      if (customNote && modalCustom && modalCustomWrap) {
        modalCustom.textContent = customNote;
        modalCustomWrap.hidden = false;
      } else if (modalCustomWrap) {
        modalCustomWrap.hidden = true;
      }

      if (modalCta) {
        modalCta.href = card.getAttribute("data-cta-href") || "#";
      }

      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      var closeBtn = modal.querySelector("[data-modal-close]");
      if (closeBtn) closeBtn.focus();
    }

    function closeModal() {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      if (lastFocused) lastFocused.focus();
    }

    document.querySelectorAll("[data-open-modal]").forEach(function (trigger) {
      trigger.addEventListener("click", function (e) {
        e.preventDefault();
        openModal(trigger);
      });
    });

    closeButtons.forEach(function (btn) {
      btn.addEventListener("click", closeModal);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
    });
  }
})();
