import React from 'react'
import PropTypes from 'prop-types'
import LinearProgress from 'cozy-ui/transpiled/react/LinearProgress'
import Box from 'cozy-ui/transpiled/react/Box'

const HeaderLoadingProgress = ({ isFetching }) => {
  return (
    <Box minHeight="8px" marginBottom={-1}>
      {isFetching ? <LinearProgress /> : null}
    </Box>
  )
}

HeaderLoadingProgress.propTypes = {
  isFetching: PropTypes.bool.isRequired
}

export default HeaderLoadingProgress
