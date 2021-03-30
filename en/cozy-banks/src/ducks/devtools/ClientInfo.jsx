import React from 'react'
import { useClient } from 'cozy-client'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { PanelContent } from 'cozy-client/dist/devtools'

const ClientInfo = () => {
  const client = useClient()
  return (
    <PanelContent>
      <Typography variant="subtitle1" gutterBottom>
        Client info
      </Typography>
      <Typography variant="h5">URI</Typography>
      <p>{client.stackClient.uri}</p>
      {client.stackClient.oauthOptions ? (
        <>
          <Typography variant="h5">OAuth document id</Typography>
          <p>{client.stackClient.oauthOptions.clientID}</p>
        </>
      ) : null}
    </PanelContent>
  )
}

export default ClientInfo
