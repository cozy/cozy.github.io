import React, { useState } from 'react'

export const StoreURLContext = React.createContext()

export function StoreURLProvider({ children }) {
  const [url, setUrl] = useState()
  return (
    <StoreURLContext.Provider value={{ url, setUrl }}>
      {children}
    </StoreURLContext.Provider>
  )
}
