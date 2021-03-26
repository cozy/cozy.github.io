import React from 'react'
import Icon from 'cozy-ui/transpiled/react/Icon'
import RightIcon from 'cozy-ui/transpiled/react/Icons/Right'
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction'
import Grid from '@material-ui/core/Grid'

const styles = {
  listGridItem: {
    height: '100%',
    overflow: 'scroll',
    flexBasis: 240,
    flexShrink: 0,
    flexGrow: 0,
    boxShadow: '4px 0 8px rgba(0, 0, 0, 0.10)'
  }
}

const NavSecondaryAction = () => {
  return (
    <ListItemSecondaryAction>
      <Icon
        icon={RightIcon}
        className="u-mr-half"
        color="var(--secondaryTextColor)"
      />
    </ListItemSecondaryAction>
  )
}

const ListGridItem = ({ children }) => {
  return (
    <Grid item height="100%" style={styles.listGridItem}>
      {children}
    </Grid>
  )
}

export { NavSecondaryAction, ListGridItem }
