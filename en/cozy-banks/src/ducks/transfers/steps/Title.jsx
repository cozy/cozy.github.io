import React from 'react'
import { Title as UITitle, useBreakpoints } from 'cozy-ui/transpiled/react'

const _Title = ({ children }) => {
  const { isMobile } = useBreakpoints()
  return (
    <UITitle className={'u-mb-1 ' + (isMobile ? 'u-ta-center' : '')}>
      {children}
    </UITitle>
  )
}

const Title = React.memo(_Title)

export default Title
