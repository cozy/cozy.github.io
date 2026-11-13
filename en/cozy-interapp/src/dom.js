const intentClass = 'coz-intent'

export function hide(node) {
  node.style.display = 'none'
}

export function show(node) {
  node.style.display = 'block'
}

export function remove(node) {
  if (!node.parentNode) {
    return
  }
  node.parentNode.removeChild(node)
}

const px = val => val + 'px'
const propFmt = {
  width: px,
  height: px,
  maxWidth: px,
  maxHeight: px
}
export const applyStyle = (node, style) => {
  Object.keys(style).forEach(prop => {
    const val = style[prop]
    if (val === undefined) return
    node.style[prop] = `${propFmt[prop] ? propFmt[prop](val) : val}`
  })
}

export const assertOKForIntentIframe = node => {
  const document = node.ownerDocument
  if (!document) {
    console.warn('assertProperForIframe: bad node', node) // eslint-disable-line no-console
    throw new Error('Cannot retrieve document object from given node')
  }

  const window = document.defaultView
  if (!window) {
    console.warn('assertProperForIframe: bad document', document) // eslint-disable-line no-console
    throw new Error('Cannot retrieve window object from document')
  }
}

export function iframeFromIntent(intent, node, url, { title, className } = {}) {
  const document = node.ownerDocument
  if (!document)
    throw new Error('Cannot retrieve document object from given node')

  const iframe = document.createElement('iframe')
  iframe.setAttribute('id', `intent-${intent.id}`)
  if (title) iframe.setAttribute('title', title)
  iframe.setAttribute('src', url)
  iframe.setAttribute('allow', 'clipboard-write')
  iframe.classList.add(intentClass)
  if (className) iframe.classList.add(...className.split(/\s+/).filter(Boolean))
  return iframe
}

export function insertIntentIframe(
  intent,
  element,
  url,
  { onload, title, className, focus = true } = {}
) {
  assertOKForIntentIframe(element)

  const iframe = iframeFromIntent(intent, element, url, { title, className })
  // if callback provided for when iframe is loaded
  if (typeof onload === 'function') iframe.onload = onload
  element.appendChild(iframe)
  if (focus) iframe.focus()
  return iframe
}
