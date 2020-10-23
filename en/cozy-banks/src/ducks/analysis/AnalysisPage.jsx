import React from 'react'
import AnalysisTabs from 'ducks/analysis/AnalysisTabs'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'

/**
 * Renders its children
 *
 * - On mobile, render the AnalysisTabs
 */
const AnalysisPage = ({ children }) => {
  const { isMobile } = useBreakpoints()
  return (
    <>
      {isMobile ? <AnalysisTabs /> : null}
      {children}
    </>
  )
}

export default AnalysisPage
