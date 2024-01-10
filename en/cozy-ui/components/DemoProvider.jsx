import React from 'react'

import TranspiledDemoProvider from 'cozy-ui/transpiled/react/providers/DemoProvider'
import { useCozyTheme } from 'cozy-ui/transpiled/react/providers/CozyTheme'

// Provider used in readme.md files, because we must
// use transpiled files inside readme.
const DemoProvider = props => {
  const { variant } = useCozyTheme()

  return <TranspiledDemoProvider variant={variant} {...props} />
}

export default DemoProvider
