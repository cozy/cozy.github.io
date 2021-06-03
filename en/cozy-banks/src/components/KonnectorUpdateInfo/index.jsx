import React from 'react'
import compose from 'lodash/flowRight'

import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import Infos from 'cozy-ui/transpiled/react/Infos'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'
import { ButtonLink } from 'cozy-ui/transpiled/react/Button'

import CozyClient, { queryConnect, Q, isQueryLoading } from 'cozy-client'
import { KONNECTOR_DOCTYPE } from 'doctypes'

import styles from 'components/KonnectorUpdateInfo/styles.styl'
import Padded from 'components/Padded'
import useRedirectionURL from 'hooks/useRedirectionURL'

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

const KonnectorUpdateInfo = ({ outdatedKonnectors }) => {
  const { t } = useI18n()
  const { isMobile } = useBreakpoints()
  const [url] = useRedirectionURL(APP_DOCTYPE, redirectionOptions)

  if (!url || isQueryLoading(outdatedKonnectors)) {
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
            extension={isMobile ? 'full' : 'narrow'}
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
  query: () =>
    Q(KONNECTOR_DOCTYPE).where({ available_version: { $exists: true } }),
  fetchPolicy: CozyClient.fetchPolicies.olderThan(30 * 1000),
  as: 'outdatedKonnectors'
}

export default compose(
  queryConnect({
    outdatedKonnectors
  }),
  React.memo
)(KonnectorUpdateInfo)
