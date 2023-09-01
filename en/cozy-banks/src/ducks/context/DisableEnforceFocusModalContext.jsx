import React, { createContext, useState, useContext } from 'react'

const DisableEnforceFocusModalContext = createContext(false)

export const DisableEnforceFocusModalProvider = ({ children }) => {
  const [disableEnforceFocus, setDisableEnforceFocus] = useState(false)
  return (
    <DisableEnforceFocusModalContext.Provider
      value={{ disableEnforceFocus, setDisableEnforceFocus }}
    >
      {children}
    </DisableEnforceFocusModalContext.Provider>
  )
}

export const useDisableEnforceFocusModal = () => {
  const disableEnforceFocusModalContext = useContext(
    DisableEnforceFocusModalContext
  )
  if (!disableEnforceFocusModalContext) {
    throw new Error(
      'useDisableEnforceFocusModal must be used within a EnforceFocusModalProvider'
    )
  }
  return disableEnforceFocusModalContext
}
