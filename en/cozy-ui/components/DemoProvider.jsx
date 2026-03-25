import React from 'react'

import TranspiledDemoProvider from 'cozy-ui/transpiled/react/providers/DemoProvider'

// Provider used in readme.md files, because we must
// use transpiled files inside readme.
const DemoProvider = props => {
  return <TranspiledDemoProvider {...props} />
}

export default DemoProvider
