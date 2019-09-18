import React from 'react'
import styles from 'components/KonnectorUpdateInfo/styles.styl'
import { translate } from 'cozy-ui/react'
import Icon from 'cozy-ui/react/Icon'
import { withClient } from 'cozy-client'
import { flowRight as compose } from 'lodash'
import { queryConnect } from 'cozy-client'
import { KONNECTOR_DOCTYPE } from 'doctypes'
import { isCollectionLoading } from 'ducks/client/utils'
import { Padded } from 'components/Spacing'
import CozyClient from 'cozy-client'
import ErrorCard from 'components/ErrorCard'
import { useRedirectionURL } from 'components/effects'

// Utilities on konnectors
const konnectors = {
  hasCategory: category => konnector => {
    return konnector.categories && konnector.categories.includes(category)
  }
}

const openWithIcon = <Icon icon="openwith" />

const APP_DOCTYPE = 'io.cozy.apps'
const redirectionOptions = {
  type: 'konnector',
  category: 'banking',
  pendingUpdate: true
}

const KonnectorUpdateInfo = ({ t, outdatedKonnectors, client }) => {
  const url = useRedirectionURL(client, APP_DOCTYPE, redirectionOptions)

  if (!url || isCollectionLoading(outdatedKonnectors)) {
    return null
  }

  if (outdatedKonnectors.hasMore) {
    outdatedKonnectors.fetchMore()
  }

  const bankingKonnectors = outdatedKonnectors.data.filter(
    konnectors.hasCategory('banking')
  )
  if (bankingKonnectors.length === 0) {
    return null
  }

  return (
    <Padded className={styles.KonnectorUpdateInfo}>
      <ErrorCard
        title={t('KonnectorUpdateInfo.title')}
        content={t('KonnectorUpdateInfo.content')}
        buttonHref={url}
        buttonLabel={t('KonnectorUpdateInfo.cta')}
        buttonIcon={openWithIcon}
      />
    </Padded>
  )
}

const outdatedKonnectors = {
  query: client =>
    client
      .all(KONNECTOR_DOCTYPE)
      .where({ available_version: { $exists: true } }),
  fetchPolicy: CozyClient.fetchPolicies.olderThan(30 * 1000),
  as: 'outdatedKonnectors'
}

export default compose(
  translate(),
  withClient,
  queryConnect({
    outdatedKonnectors
  })
)(KonnectorUpdateInfo)
