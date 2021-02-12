import React from 'react'
import ReactDOM from 'react-dom'
import IntentExample from './components/IntentExample'
import translations from './fixtures/en.json'
import get from 'lodash/get'

/** Fake cozy.client.intents.create to demonstrate features in Styleguide */
export const fakeIntentCreate = (action, doctype, options) => {
  let res
  const p = new Promise(resolve => {
    res = resolve
  })
  p.start = (node, onFrameLoaded) => {
    const iframe = document.createElement('iframe')
    iframe.onload = () => {
      onFrameLoaded()

      const onComplete = () => {
        node.removeChild(iframe)
        res({ result: 'OK' })
      }

      // Copy all styles to the iframe
      Array.from(document.querySelectorAll('style')).forEach(node => {
        const copy = node.cloneNode(true)
        iframe.contentDocument.head.appendChild(copy)
      })

      ReactDOM.render(
        React.createElement(IntentExample, {
          onComplete,
          action,
          doctype,
          options
        }),
        iframe.contentDocument.body
      )
    }
    node.appendChild(iframe)
    return p
  }
  return p
}

export const t = path => {
  return get(translations, path)
}
