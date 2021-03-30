import React from 'react'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { pinSettingStorage, lastInteractionStorage } from 'ducks/pin/storage'
import { PanelContent } from 'cozy-client/dist/devtools'

const PinDevTool = () => {
  return (
    <PanelContent>
      <Typography variant="subtitle1" gutterBottom>
        pin
      </Typography>
      Setting doc cache
      <br />
      <pre>{JSON.stringify(pinSettingStorage.load(), null, 2)}</pre>
      Last interaction cache
      <br />
      <pre>{JSON.stringify(lastInteractionStorage.load(), null, 2)}</pre>
    </PanelContent>
  )
}

export default PinDevTool
