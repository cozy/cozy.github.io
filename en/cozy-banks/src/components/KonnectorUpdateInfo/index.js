import React from 'react'
import styles from 'components/KonnectorUpdateInfo/styles.styl'
import { useI18n } from 'cozy-ui/transpiled/react'
import { withClient } from 'cozy-client'
import { flowRight as compose } from 'lodash'
import { queryConnect } from 'cozy-client'
import { KONNECTOR_DOCTYPE } from 'doctypes'
import { isCollectionLoading } from 'ducks/client/utils'
import { Padded } from 'components/Spacing'
import CozyClient from 'cozy-client'
import Infos from 'cozy-ui/transpiled/react/Infos'
import withBreakpoints from 'cozy-ui/transpiled/react/helpers/withBreakpoints'
import { useRedirectionURL } from 'components/effects'
import { ButtonLink } from 'cozy-ui/transpiled/react/Button'

// Utilities on konnectors
const konnectors = {
  hasCategory: category => konnector => {
    return konnector.categories && konnector.categories.includes(category)
  }
}

const APP_DOCTYPE = 'io.cozy.apps'
const redirectionOptions = {
  type: 'konnector',
  category: 'banking',
  pendingUpdate: true
}

const KonnectorUpdateInfo = ({ outdatedKonnectors, client, breakpoints }) => {
  const { t } = useI18n()
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
      <Infos
        className="u-maw-none u-p-1-half"
        actionButton={
          <ButtonLink
            theme="secondary"
            extension={breakpoints.isMobile ? 'full' : 'narrow'}
            className="u-mh-0"
            label={t('KonnectorUpdateInfo.cta')}
            icon="openwith"
            href={url}
          />
        }
        title={t('KonnectorUpdateInfo.title')}
        text={
          <span
            dangerouslySetInnerHTML={{
              __html: t('KonnectorUpdateInfo.content')
            }}
          />
        }
        icon="warning"
        isImportant
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
  withClient,
  queryConnect({
    outdatedKonnectors
  }),
  withBreakpoints(),
  React.memo
)(KonnectorUpdateInfo)
