import React from 'react'
import IntentWrapper from '../../react/IntentWrapper'
import { placeholder90 } from '../placeholders/img'

const IntentExample = function({ onComplete, action, doctype, options }) {
  return (
    <IntentWrapper
      appIcon={placeholder90}
      appName="IntentExample"
      appEditor="EditorExample"
    >
      <p>
        Action: {action}
        <br />
        Doctype: {doctype}
        <br />
        Options: <pre>{JSON.stringify(options, null, 2)}</pre>
        <br />
        <br />
        <button onClick={onComplete}>Click to complete intent</button>
      </p>
    </IntentWrapper>
  )
}

export default IntentExample
