import React from 'react'

import CozyClient, { CozyProvider } from 'cozy-client'

import { BreakpointsProvider } from 'cozy-ui/transpiled/react/hooks/useBreakpoints'
import { I18nContext } from 'cozy-ui/transpiled/react/I18n'

const defaultClient = new CozyClient()

const DemoProvider = ({ mockClient, children }) => {
  return (
    <CozyProvider client={mockClient || defaultClient}>
      <BreakpointsProvider>
        <I18nContext.Provider
          value={{ t: x => x, f: () => '01 Jan. 2022', lang: 'en' }}
        >
          {children}
        </I18nContext.Provider>
      </BreakpointsProvider>
    </CozyProvider>
  )
}

export default DemoProvider
