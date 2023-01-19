import React from 'react'

import { useClient, generateWebLink } from 'cozy-client'
import AppLinker from 'cozy-ui/transpiled/react/AppLinker'
import Link from 'cozy-ui/transpiled/react/Link'

const AddAccountLink = props => {
  const client = useClient()

  return (
    <AppLinker
      app={{ slug: 'store' }}
      href={generateWebLink({
        slug: 'store',
        cozyUrl: client.getStackClient().uri,
        subDomainType: client.getInstanceOptions().subdomain,
        pathname: '/',
        hash: 'discover?type=konnector&category=banking'
      })}
    >
      {({ onClick, href }) => (
        <Link
          style={{ display: 'contents' }}
          underline="none"
          href={href}
          onClick={onClick}
        >
          {props.children}
        </Link>
      )}
    </AppLinker>
  )
}

export default AddAccountLink
