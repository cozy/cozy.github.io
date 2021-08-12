export const hasParentWithClass = (el, cl) => {
  while (el.parentNode) {
    el = el.parentNode
    if (el.classList && el.classList.contains(cl)) return true
  }
  return false
}
