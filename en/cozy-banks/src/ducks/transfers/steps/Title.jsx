import React from 'react'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import Typography from 'cozy-ui/transpiled/react/Typography'

const Title = ({ children }) => {
  const { isMobile } = useBreakpoints()
  return (
    <Typography
      variant="h4"
      className={'u-mb-1 ' + (isMobile ? 'u-ta-center' : '')}
    >
      {children}
    </Typography>
  )
}

export default React.memo(Title)
