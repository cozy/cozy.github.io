export const hasParentWithClass = (el, cl) => {
  let clonedEl = el
  while (clonedEl.parentNode) {
    clonedEl = clonedEl.parentNode
    if (clonedEl.classList && clonedEl.classList.contains(cl)) return true
  }
  return false
}
