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


$(function () {
  var openSearch = function () {
    var searchModalBtn = $('[data-target=#mkdocs_search_modal]')
    searchModalBtn.click();
  }
  var checkForSearchSlash = function (ev) {
    var SLASH_KEY = 191
    if (ev.which == SLASH_KEY) {
      openSearch()
      ev.preventDefault()
    }
  }
  $(document).on('keydown', checkForSearchSlash)
})
