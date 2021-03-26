import React, { useState, useCallback, useMemo } from 'react'
import Fab from '@material-ui/core/Fab'
import Paper from '@material-ui/core/Paper'
import IconButton from '@material-ui/core/IconButton'
import Grid from '@material-ui/core/Grid'
import Box from '@material-ui/core/Box'
import CozyTheme from 'cozy-ui/transpiled/react/CozyTheme'
import Icon from 'cozy-ui/transpiled/react/Icon'
import List from 'cozy-ui/transpiled/react/MuiCozyTheme/List'
import Typography from 'cozy-ui/transpiled/react/Typography'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import GearIcon from 'cozy-ui/transpiled/react/Icons/Gear'
import CrossIcon from 'cozy-ui/transpiled/react/Icons/Cross'

import Queries from 'ducks/devtools/Queries'
import { NavSecondaryAction, ListGridItem } from 'ducks/devtools/common'
import useLocalState from 'ducks/devtools/useLocalState'

const styles = {
  fab: { position: 'fixed', left: '1rem', bottom: '1rem' },
  panel: { position: 'fixed', bottom: 0, height: 300, left: 0, right: 0 },
  closeIcon: { position: 'absolute', top: '0.5rem', right: '0.5rem' },
  panelContainer: { height: '100%', flexWrap: 'nowrap' },
  panelRight: { height: '100%', overflow: 'scroll', flexGrow: 1 },
  mono: { fontFamily: 'monospace' }
}

const defaultPanels = [
  {
    id: 'queries',
    Component: Queries
  }
]

const DevToolsNavList = ({ selected, panels, onNav }) => {
  return (
    <List>
      {panels.map(panel => {
        return (
          <ListItem
            key={panel.name}
            selected={selected === panel.id}
            dense
            button
            onClick={() => onNav(panel.id)}
          >
            <ListItemText>{panel.id}</ListItemText>
            <NavSecondaryAction />
          </ListItem>
        )
      })}
    </List>
  )
}

const DevToolsPanel = props => {
  const panels = useMemo(() => {
    if (props.panels) {
      return [...defaultPanels, ...props.panels]
    }
    return defaultPanels
  }, [props.panels])
  const [currentPanel, setCurrentPanel] = useState('queries')
  return (
    <Paper elevation={12} {...props}>
      <IconButton style={styles.closeIcon} onClick={props.onClose}>
        <Icon icon={CrossIcon} size={12} />
      </IconButton>
      <Grid container height="100%" style={styles.panelContainer}>
        <ListGridItem>
          <Box p={1}>
            <Typography variant="subtitle1">Cozy Devtools</Typography>
          </Box>
          <DevToolsNavList
            panels={panels}
            selected={currentPanel}
            onNav={setCurrentPanel}
          />
        </ListGridItem>
        {panels.map(panelOptions =>
          currentPanel === panelOptions.id ? <panelOptions.Component /> : null
        )}
      </Grid>
    </Paper>
  )
}

const DevTools = ({ panels }) => {
  const [open, setOpen] = useLocalState('cozydevtools__open', false)
  const handleToggle = useCallback(() => setOpen(state => !state), [setOpen])
  return (
    <>
      <Fab color="primary" onClick={handleToggle} style={styles.fab}>
        <Icon icon={GearIcon} />
      </Fab>
      {open ? (
        <CozyTheme variant="normal">
          <DevToolsPanel
            style={styles.panel}
            onClose={handleToggle}
            panels={panels}
          />
        </CozyTheme>
      ) : null}
    </>
  )
}

export default DevTools
