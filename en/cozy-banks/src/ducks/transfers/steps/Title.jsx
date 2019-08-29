import React from 'react'
import { Title as UITitle, withBreakpoints } from 'cozy-ui/transpiled/react'

const _Title = ({ children, breakpoints: { isMobile } }) => {
  return (
    <UITitle className={'u-mb-1 ' + (isMobile ? 'u-ta-center' : '')}>
      {children}
    </UITitle>
  )
}

const Title = React.memo(withBreakpoints()(_Title))

export default Title
