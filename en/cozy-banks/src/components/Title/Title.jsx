import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import { MainTitle } from 'cozy-ui/transpiled/react/Text'
import styles from 'components/Title/Title.styl'
import useTheme from 'components/useTheme'

const Title = props => {
  const theme = useTheme()
  const { children, className } = props

  return (
    <MainTitle
      tag="h1"
      ellipsis={true}
      className={cx(styles.Title, styles[`TitleColor_${theme}`], className)}
    >
      {children}
    </MainTitle>
  )
}

Title.propTypes = {
  children: PropTypes.node.isRequired
}

export default Title
