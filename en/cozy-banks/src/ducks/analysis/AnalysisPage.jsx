import React from 'react'
import { Outlet } from 'react-router-dom'
import AnalysisTabs from 'ducks/analysis/AnalysisTabs'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'

/**
 * Renders its children
 *
 * - On mobile, render the AnalysisTabs
 */
const AnalysisPage = () => {
  const { isMobile } = useBreakpoints()
  return (
    <>
      {isMobile ? <AnalysisTabs /> : null}
      <Outlet />
    </>
  )
}

export default AnalysisPage
