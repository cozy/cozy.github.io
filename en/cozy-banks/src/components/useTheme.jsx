import React from 'react'
import { createContext, useContext } from 'react'

export const ThemeContext = createContext()

const useTheme = () => {
  return useContext(ThemeContext) || 'default'
}

export const themed = Component => {
  const ThemedComponent = props => {
    const theme = useTheme()
    return <Component {...props} theme={theme} />
  }

  return ThemedComponent
}

export default useTheme
