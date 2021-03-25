import React from 'react'
import Box from '@material-ui/core/Box'

const PanelContent = ({ children }) => (
  <Box p={1} overflow="scroll" width="100%">
    {children}
  </Box>
)

export default PanelContent
