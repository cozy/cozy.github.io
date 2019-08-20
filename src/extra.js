function toggleChilds(evt) {
  "use strict";
  var elmt = evt.target;
  while ((elmt = elmt.nextElementSibling) && (elmt.tagName !== 'H2')) { elmt.classList.toggle('shown'); }
}

window.addEventListener('load', function () {
  "use strict";
  var faq = document.querySelector('h1.faq');
  if (faq) {
    faq.parentNode.querySelectorAll('h2').forEach(e => e.addEventListener('click', toggleChilds));
  }
});

var setupSearchHotkey = function () {
  var openSearch = function () {
    var searchModalBtn = document.querySelector('[data-target=#mkdocs_search_modal]')
    searchModalBtn.dispatchEvent(new Event('click'));
  }
  var checkForSearchSlash = function (ev) {
    var SLASH_KEY = 191
    if (ev.which == SLASH_KEY) {
      openSearch()
      ev.preventDefault()
    }
  }
  document.addEventListener('keydown', checkForSearchSlash)
}


window.addEventListener('load', function () {
  setupSearchHotkey()
})
