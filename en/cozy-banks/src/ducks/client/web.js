import CozyClient from 'cozy-client'
import flag from 'cozy-flags'

import { schema } from 'doctypes'
import { getLinks } from 'ducks/client/links'
import appMetadata from 'ducks/client/appMetadata'
import parseRootDataset from 'utils/cozyData'

const DEFAULT_URL = 'http://cozy.tools:8080'

const getToken = () => {
  const root = document.querySelector('[role=application]')
  if (!root) {
    return ''
  }
  const { token } = parseRootDataset(root)
  return token
}

const getCozyURI = () => {
  const root = document.querySelector('[role=application]')
  if (!root) {
    return DEFAULT_URL
  }
  const { domain } = parseRootDataset(root)
  const protocol = window.location.protocol

  return `${protocol}//${domain}`
}

export const getClient = async () => {
  const uri = flag('cozyURL') || getCozyURI()
  const token = flag('cozyToken') || getToken()

  return new CozyClient({
    appMetadata,
    uri,
    token,
    schema,
    links: await getLinks(),
    store: false
  })
}
