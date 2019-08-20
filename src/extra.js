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

const fixEditLinkIfNecessary = function () {
  /* Here we detect if the current page is from an external documentation and we 
  change the href of the editing link so it goes to the right repository and file */
  const editNode = document.querySelector('[title="Edit this page"]')
  const pathname = window.location.pathname
  const editURI = 'edit/master/'
  const removeGitSuffix = function (x) { return x.replace(/\.git$/, '') }

  // Returns the external repo associated to a pathname
  const detectExternalRepo = function (pathname) {
    // window.outsideDocs is defined in main.html
    for (var outsideDoc of window.outsideDocs) {
      if (window.location.pathname.includes('/' + outsideDoc.name + '/')) {
        return outsideDoc
      }
    }
  }

  // Change the href attribute of a link to point to the correct edition page on GitHub
  // for the passed external documentation
  const fixEditLink = function (editNode, externalDoc) {
    const inDev = window.location.host.includes('localhost')
    const prefix = inDev ? '/' : '/en/'
    const isReadme = document.title.includes('README')
    const repoFile = pathname.replace(prefix + externalDoc.name, '').replace(/\/$/, isReadme ? '/README.md' : '.md')
    const baseRepo = removeGitSuffix(externalDoc.repo)
    const href = baseRepo + '/' + editURI + externalDoc.subdir + repoFile
    editNode.href = href
  }

  const externalRepo = detectExternalRepo(pathname)
  if (externalRepo) {
    fixEditLink(editNode, externalRepo)
  }
}

window.addEventListener('load', function () {
  setupSearchHotkey()
  fixEditLinkIfNecessary()
})
