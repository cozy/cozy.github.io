import React from 'react'
import PropTypes from 'prop-types'
import Title from 'components/Title/Title'
import { BarCenter } from 'components/Bar'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'
import styles from './PageTitle.styl'

export const BarTitle = ({ children }) => {
  return (
    <BarCenter>
      <Title className={styles.PageTitle}>{children}</Title>
    </BarCenter>
  )
}

const PageTitle = ({ children }) => {
  const { isMobile } = useBreakpoints()
  return isMobile ? <BarTitle>{children}</BarTitle> : <Title>{children}</Title>
}

PageTitle.propTypes = {
  children: PropTypes.node.isRequired
}

export default PageTitle
