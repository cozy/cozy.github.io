const sleep = duration =>
  new Promise(resolve => {
    setTimeout(resolve, duration)
  })

const shakeClassName = 'u-shake'

/**
 * Shake a DOM node via CSS
 * Resolves when animation is finished
 */
export const shake = async node => {
  node.classList.remove(shakeClassName)
  requestAnimationFrame(() => {
    node.classList.add(shakeClassName)
  })
  await sleep(820)
  node.classList.remove(shakeClassName)
}
