import React from 'react'
import PropTypes from 'prop-types'
import Title from 'components/Title/Title'
import { BarCenter } from 'components/Bar'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'

/**
 * Renders a title in the bar
 *
 * Use it only if the page structure between mobile and desktop is very different
 * and you cannot rely on PageTitle
 */
export const BarTitle = ({ children, className }) => {
  return (
    <BarCenter>
      <Title className={className}>{children}</Title>
    </BarCenter>
  )
}

/**
 * Render a page title responsively
 *
 * Will display the title inside the bar on mobile and directly
 * in the page (in a Title style) otherwise
 */
const PageTitle = ({ children, className }) => {
  const { isMobile } = useBreakpoints()
  return isMobile ? (
    <BarTitle className={className}>{children}</BarTitle>
  ) : (
    <Title className={className}>{children}</Title>
  )
}

PageTitle.propTypes = {
  children: PropTypes.node
}

export default PageTitle
