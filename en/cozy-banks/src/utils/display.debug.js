export const makeItShine = node => {
  node.style.boxShadow = 'inset 0px 0px 20px yellow'
  node.style.transition = 'box-shadow 0.3s ease'
  setTimeout(() => {
    node.style.boxShadow = 'inset 0 0 0'
  }, 2000)
}
