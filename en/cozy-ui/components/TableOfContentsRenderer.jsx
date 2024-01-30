import React, { useEffect, useState } from 'react'
import DefaultTableOfContents from 'react-styleguidist/lib/client/rsg-components/TableOfContents/TableOfContentsRenderer'
import useMediaQuery from '@material-ui/core/useMediaQuery'

import CozyTheme from 'cozy-ui/transpiled/react/providers/CozyTheme'
import Paper from 'cozy-ui/transpiled/react/Paper'
import Buttons from 'cozy-ui/transpiled/react/Buttons'
import Icon from 'cozy-ui/transpiled/react/Icon'
import PhoneIcon from 'cozy-ui/transpiled/react/Icons/Phone'
import PaletteIcon from 'cozy-ui/transpiled/react/Icons/Palette'
import Switch from 'cozy-ui/transpiled/react/Switch'
import Typography from 'cozy-ui/transpiled/react/Typography'
import {
  addFlagshipElements,
  removeFlagshipElements
} from 'cozy-ui/transpiled/react/hooks/useSetFlagshipUi/helpers'

const TableOfContents = props => {
  const deviceThemeType = useMediaQuery('(prefers-color-scheme: dark)')
    ? 'dark'
    : 'light'

  const [flagship, setFlagship] = useState({
    status: JSON.parse(localStorage.getItem('flagship-app'))?.status || 'off',
    contained:
      JSON.parse(localStorage.getItem('flagship-app'))?.contained || 'off',
    busy: false
  })
  const [themeType, SetThemeType] = useState({
    value: localStorage.getItem('ui-theme-type') || deviceThemeType || 'light',
    busy: false
  })

  useEffect(() => {
    const toggleFlaship =
      flagship.status === 'off' ? removeFlagshipElements : addFlagshipElements

    toggleFlaship()
  }, [flagship])

  return (
    <CozyTheme>
      <Paper className="u-pv-1 u-ph-half u-ta-center" elevation={0} square>
        <Buttons
          className="u-w-100 u-mb-1"
          startIcon={<Icon icon={PaletteIcon} />}
          label={themeType.value}
          size="small"
          variant="secondary"
          busy={themeType.busy}
          onClick={() => {
            const newThemeType = themeType.value === 'light' ? 'dark' : 'light'
            SetThemeType({ value: newThemeType, busy: true })
            localStorage.setItem('ui-theme-type', newThemeType)
            window.location.reload()
          }}
        />
        <Buttons
          className="u-w-100 u-mt-half"
          startIcon={<Icon icon={PhoneIcon} />}
          label={flagship.status}
          size="small"
          variant="secondary"
          busy={flagship.busy}
          onClick={() => {
            localStorage.setItem(
              'flagship-app',
              JSON.stringify({
                ...flagship,
                status: flagship.status === 'on' ? 'off' : 'on'
              })
            )
            setFlagship(v => ({
              ...v,
              status: v.status === 'on' ? 'off' : 'on',
              busy: true
            }))
            window.location.reload()
          }}
        />
        <Typography
          variant="caption"
          display="inline"
          color={flagship.contained === 'on' ? 'textSecondary' : 'textPrimary'}
        >
          Immersive
        </Typography>
        <Switch
          color="default"
          checked={flagship.contained === 'on'}
          disabled={flagship.busy}
          onChange={() => {
            localStorage.setItem(
              'flagship-app',
              JSON.stringify({
                ...flagship,
                contained: flagship.contained === 'on' ? 'off' : 'on'
              })
            )
            setFlagship(v => ({
              ...v,
              contained: v.contained === 'on' ? 'off' : 'on',
              busy: true
            }))
            window.location.reload()
          }}
        />
        <Typography
          variant="caption"
          display="inline"
          color={flagship.contained === 'on' ? 'textPrimary' : 'textSecondary'}
        >
          Contained
        </Typography>
      </Paper>

      <DefaultTableOfContents {...props} />
    </CozyTheme>
  )
}

export default TableOfContents
