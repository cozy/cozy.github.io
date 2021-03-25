import React from 'react'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { FlagSwitcher } from 'cozy-flags'
import PanelContent from './PanelContent'

const Flags = () => {
  return (
    <PanelContent>
      <Typography variant="subtitle1">Flags</Typography>
      <FlagSwitcher.List />
    </PanelContent>
  )
}

export default Flags
