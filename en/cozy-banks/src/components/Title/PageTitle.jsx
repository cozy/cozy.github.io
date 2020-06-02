import React from 'react'
import cx from 'classnames'
import PropTypes from 'prop-types'
import Title from 'components/Title/Title'
import { BarCenter } from 'components/Bar'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'
import styles from './PageTitle.styl'

export const BarTitle = ({ children, className }) => {
  return (
    <BarCenter>
      <Title className={cx(styles.PageTitle, className)}>{children}</Title>
    </BarCenter>
  )
}

const PageTitle = ({ children, className }) => {
  const { isMobile } = useBreakpoints()
  return isMobile ? (
    <BarTitle className={className}>{children}</BarTitle>
  ) : (
    <Title className={className}>{children}</Title>
  )
}

PageTitle.propTypes = {
  children: PropTypes.node.isRequired
}

export default PageTitle
