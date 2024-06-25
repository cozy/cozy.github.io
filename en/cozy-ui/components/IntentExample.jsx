import React from 'react'

import IntentWrapper from '../../react/IntentWrapper'
import CozyTheme from '../../react/providers/CozyTheme'
import Button from '../../react/Buttons'
import Typography from '../../react/Typography'
import { placeholder90 } from '../placeholders/img'

const IntentExample = function({ onComplete, action, doctype, options }) {
  return (
    <CozyTheme>
      <IntentWrapper
        appIcon={placeholder90}
        appName="IntentExample"
        appEditor="EditorExample"
      >
        <Typography>Action: {action}</Typography>
        <Typography>Doctype: {doctype}</Typography>
        <Typography>
          Options: <pre>{JSON.stringify(options, null, 2)}</pre>
        </Typography>
        <Button
          className="u-mt-1"
          label="Click to complete intent"
          onClick={onComplete}
        />
      </IntentWrapper>
    </CozyTheme>
  )
}

export default IntentExample
