import CozyClient from 'cozy-client'
import flag from 'cozy-flags'

import { schema } from 'doctypes'
import { getLinks } from 'ducks/client/links'
import appMetadata from 'ducks/client/appMetadata'

const DEFAULT_URL = 'http://cozy.tools:8080'

const getToken = () => {
  const root = document.querySelector('[role=application]')
  if (!root) {
    return ''
  }
  const data = root.dataset

  return data.cozyToken
}

const getCozyURI = () => {
  const root = document.querySelector('[role=application]')
  if (!root) {
    return DEFAULT_URL
  }
  const data = root.dataset
  const protocol = window.location.protocol

  return `${protocol}//${data.cozyDomain}`
}

export const getClient = () => {
  const uri = flag('cozyURL') || getCozyURI()
  const token = flag('cozyToken') || getToken()

  return new CozyClient({
    appMetadata,
    uri,
    token,
    schema,
    links: getLinks(),
    store: false
  })
}
