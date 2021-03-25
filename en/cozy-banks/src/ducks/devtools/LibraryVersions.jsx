/* global __VERSIONS__ */

import React from 'react'
import Typography from 'cozy-ui/transpiled/react/Typography'
import PanelContent from './PanelContent'

const Versions = () => {
  const versions = typeof __VERSIONS__ !== 'undefined' ? __VERSIONS__ : {}
  return (
    <PanelContent>
      <Typography variant="subtitle1" gutterBottom>
        Library versions
      </Typography>
      {Object.entries(versions).map(([pkg, version]) => (
        <div key={pkg}>
          {pkg}: {version} -{' '}
          <img src={`https://img.shields.io/npm/v/${pkg}?style=flat-square}`} />
        </div>
      ))}
    </PanelContent>
  )
}

export default Versions
