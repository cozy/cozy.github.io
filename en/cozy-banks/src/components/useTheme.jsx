import React from 'react'
import { useCozyTheme } from 'cozy-ui/transpiled/react/providers/CozyTheme'

export const themed = Component => {
  const ThemedComponent = props => {
    const { variant } = useCozyTheme()
    return <Component {...props} theme={variant} />
  }

  return ThemedComponent
}
