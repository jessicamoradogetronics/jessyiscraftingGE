(function () {
  var buttons = document.querySelectorAll('[data-fx-filter]');
  var cards = document.querySelectorAll('[data-fx-card]');
  var count = document.getElementById('fxCount');
  var empty = document.getElementById('fxEmpty');

  function applyFilter(filter) {
    var visible = 0;

    cards.forEach(function (card) {
      var match = filter === 'all' || card.dataset.type === filter || card.dataset.status === filter;
      card.hidden = !match;
      if (match) visible++;
    });

    buttons.forEach(function (button) {
      var active = button.dataset.fxFilter === filter;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    count.textContent = visible;
    empty.hidden = visible > 0;
  }

  var featured = document.getElementById('fxFeaturedImg');
  var featuredBody = document.getElementById('fxFeaturedBody');
  var current = cards[0];

  function showFeatured(card, scroll) {
    current = card;
    featured.src = card.dataset.img;
    featured.alt = card.querySelector('.fx-title').textContent;
    featuredBody.innerHTML = card.querySelector('.fx-card__content').innerHTML;
    cards.forEach(function (c) {
      c.classList.toggle('is-featured', c === card);
    });
    if (scroll) {
      featured.closest('.fx-latest').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  cards.forEach(function (card) {
    card.addEventListener('click', function (e) {
      if (e.target.closest('a, button')) return;
      showFeatured(card, true);
    });
    card.addEventListener('keydown', function (e) {
      if (e.target !== card) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        showFeatured(card, true);
      }
    });
  });

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      applyFilter(button.dataset.fxFilter);
    });
  });

  // Rebuild the featured copy once translations are applied, since it clones translated text.
  document.addEventListener('i18n:ready', function () { showFeatured(current, false); });
  document.addEventListener('i18n:changed', function () { showFeatured(current, false); });

  showFeatured(current, false);
  applyFilter('all');
})();
