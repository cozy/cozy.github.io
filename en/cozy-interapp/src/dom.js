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

export function iframeFromIntent(intent, node, url) {
  const document = node.ownerDocument
  if (!document)
    throw new Error('Cannot retrieve document object from given node')

  const iframe = document.createElement('iframe')
  // TODO: implement 'title' attribute
  iframe.setAttribute('id', `intent-${intent.id}`)
  iframe.setAttribute('src', url)
  iframe.classList.add(intentClass)
  return iframe
}

export function insertIntentIframe(intent, element, url, onload) {
  assertOKForIntentIframe(element)

  const iframe = iframeFromIntent(intent, element, url)
  // if callback provided for when iframe is loaded
  if (typeof onload === 'function') iframe.onload = onload
  element.appendChild(iframe)
  iframe.focus()
  return iframe
}
