import React from 'react'
import DefaultTableOfContents from 'react-styleguidist/lib/client/rsg-components/TableOfContents/TableOfContentsRenderer'
import useMediaQuery from '@material-ui/core/useMediaQuery'

const TableOfContents = props => {
  const deviceThemeType = useMediaQuery('(prefers-color-scheme: dark)')
    ? 'dark'
    : 'light'
  const themeType =
    localStorage.getItem('ui-theme-type') || deviceThemeType || 'light'

  const handleChange = ev => {
    localStorage.setItem('ui-theme-type', ev.target.value)
    window.location.reload()
  }

  return (
    <>
      <select
        className="u-m-1 u-mb-0"
        value={themeType}
        onChange={handleChange}
      >
        <option>light</option>
        <option>dark</option>
      </select>
      <DefaultTableOfContents {...props} />
    </>
  )
}

export default TableOfContents
