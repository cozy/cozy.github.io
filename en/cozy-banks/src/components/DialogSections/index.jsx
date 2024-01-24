import React from 'react'
import PropTypes from 'prop-types'
import { DialogContent } from 'cozy-ui/transpiled/react/Dialog'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import ListItemSecondaryAction from 'cozy-ui/transpiled/react/ListItemSecondaryAction'
import { useCozyDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import Radio from 'cozy-ui/transpiled/react/Radios'
import Stack from 'cozy-ui/transpiled/react/Stack'
import Typography from 'cozy-ui/transpiled/react/Typography'
import Icon from 'cozy-ui/transpiled/react/Icon'
import RightIcon from 'cozy-ui/transpiled/react/Icons/Right'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'

export const DialogSection = ({ children, label }) => (
  <div>
    {label && (
      <DialogContent className="u-pv-0">
        <Typography variant="h6" className="u-mb-half">
          {label}
        </Typography>
      </DialogContent>
    )}
    {children}
  </div>
)

export const DialogSections = ({ children }) => {
  return <Stack spacing="m">{children}</Stack>
}

export const DialogListItem = ({
  hasRadio,
  label,
  isSelected,
  onClick,
  icon,
  hasArrow,
  divider
}) => {
  const { listItemProps } = useCozyDialog({ size: 'm' })
  const { isMobile } = useBreakpoints()
  return (
    <ListItem
      {...listItemProps}
      button
      onClick={onClick}
      selected={isSelected}
      divider={divider}
    >
      {icon ? <ListItemIcon>{icon}</ListItemIcon> : null}
      <ListItemText primary={label} />
      <ListItemSecondaryAction className="u-flex u-flex-row">
        <div className={isMobile ? 'u-mr-1' : 'u-mr-2'}>
          {hasRadio ? (
            <Radio
              defaultChecked={isSelected}
              onClick={onClick}
              className="u-mr-half"
            />
          ) : null}
          {hasArrow ? <Icon icon={RightIcon} className="u-coolGrey" /> : null}
        </div>
      </ListItemSecondaryAction>
    </ListItem>
  )
}

DialogListItem.propTypes = {
  icon: PropTypes.node,
  divider: PropTypes.bool,
  hasRadio: PropTypes.bool,
  hasArrow: PropTypes.bool,
  label: PropTypes.node,
  isSelected: PropTypes.bool,
  onClick: PropTypes.func
}
