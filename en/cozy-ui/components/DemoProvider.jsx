import React from 'react'

import TranspiledDemoProvider from 'cozy-ui/transpiled/react/providers/DemoProvider'
import { useCozyTheme } from 'cozy-ui/transpiled/react/providers/CozyTheme'

// Provider used in readme.md files, because we must
// use transpiled files inside readme.
const DemoProvider = props => {
  const theme = useCozyTheme()

  return <TranspiledDemoProvider theme={theme} {...props} />
}

export default DemoProvider
