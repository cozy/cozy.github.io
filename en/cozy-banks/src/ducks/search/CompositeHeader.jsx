import React from 'react'

import Typography from 'cozy-ui/transpiled/react/Typography'

const CompositeHeader = ({ title, image }) => {
  return (
    <div className="u-ta-center">
      {image}
      <Typography variant="h3" classes={{ root: 'u-mb-half' }}>
        {title}
      </Typography>
    </div>
  )
}

export default React.memo(CompositeHeader)
