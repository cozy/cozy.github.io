import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import Typography from 'cozy-ui/transpiled/react/Typography'
import styles from 'components/Title/Title.styl'

const Title = props => {
  const { children, className } = props

  return (
    <Typography variant="h4" className={cx(styles.Title, className)}>
      {children}
    </Typography>
  )
}

Title.propTypes = {
  children: PropTypes.node.isRequired
}

export default Title
