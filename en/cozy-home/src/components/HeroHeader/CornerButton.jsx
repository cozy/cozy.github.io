import cx from 'classnames'
import React from 'react'

import Button, { ButtonLink } from 'cozy-ui/transpiled/react/deprecated/Button'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { makeStyles } from 'cozy-ui/transpiled/react/styles'

const useStyles = makeStyles(theme => ({
  cornerButton: {
    color: theme.palette.text.secondary,
    '&:hover': {
      color: theme.palette.text.primary
    },
    '&:visited': {
      color: theme.palette.text.secondary
    }
  }
}))

const CornerButton = props => {
  const { isMobile } = useBreakpoints()
  const classes = useStyles()
  const { href } = props
  const ButtonComp = href ? ButtonLink : Button

  return (
    <ButtonComp
      size={isMobile ? 'normal' : 'small'}
      theme="text"
      className={cx('corner-button', classes.cornerButton)}
      iconOnly={isMobile}
      extension={isMobile ? 'narrow' : null}
      {...props}
    />
  )
}

export default CornerButton
