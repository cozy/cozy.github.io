import React, { useState } from 'react'
import CozyTheme from '../react/CozyTheme'

const ThemeChooser = ({ children }) => {
  const [theme, setTheme] = useState('normal')
  const handleChange = ev => setTheme(ev.target.value)
  return (
    <>
      theme:{' '}
      <select onChange={handleChange}>
        <option value="normal">normal</option>
        <option value="inverted">inverted</option>
      </select>
      <CozyTheme variant={theme}>{children}</CozyTheme>
    </>
  )
}

export default ThemeChooser
