import React from 'react'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { PanelContent } from 'cozy-client/dist/devtools'

const HiddenPages = () => {
  return (
    <PanelContent>
      <Typography variant="subtitle1" gutterBottom>
        Hidden pages
      </Typography>
      <a href="#/recurrencedebug">Recurrence debug</a>
      <br />
      <a href="#/transfers">Transfers</a>
      <br />
      <a href="#/search">Search</a>
    </PanelContent>
  )
}

export default HiddenPages
