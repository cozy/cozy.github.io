import React from 'react'

import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import Infos from 'cozy-ui/transpiled/react/Infos'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'
import { ButtonLink } from 'cozy-ui/transpiled/react/Button'
import Typography from 'cozy-ui/transpiled/react/Typography'
import OpenWithIcon from 'cozy-ui/transpiled/react/Icons/Openwith'
import CozyTheme from 'cozy-ui/transpiled/react/CozyTheme'

import CozyClient, { Q, isQueryLoading } from 'cozy-client'

import { KONNECTOR_DOCTYPE } from 'doctypes'
import useFullyLoadedQuery from 'hooks/useFullyLoadedQuery'
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

const outdatedKonnectorsConn = {
  query: () =>
    Q(KONNECTOR_DOCTYPE).where({ available_version: { $exists: true } }),
  fetchPolicy: CozyClient.fetchPolicies.olderThan(30 * 1000),
  as: 'outdatedKonnectors'
}

const KonnectorUpdateInfo = () => {
  const { t } = useI18n()
  const { isMobile } = useBreakpoints()
  const [url] = useRedirectionURL(APP_DOCTYPE, redirectionOptions)
  const outdatedKonnectors = useFullyLoadedQuery(
    outdatedKonnectorsConn.query,
    outdatedKonnectorsConn
  )

  if (!url || isQueryLoading(outdatedKonnectors)) {
    return null
  }

  const bankingKonnectors = outdatedKonnectors.data.filter(
    konnectors.hasCategory('banking')
  )
  if (bankingKonnectors.length === 0) {
    return null
  }

  return (
    <CozyTheme variant="normal">
      <Padded className={styles.KonnectorUpdateInfo}>
        <Infos
          className="u-ta-left"
          action={
            <ButtonLink
              theme="secondary"
              extension={isMobile ? 'full' : 'narrow'}
              className="u-mh-0"
              label={t('KonnectorUpdateInfo.cta')}
              icon={OpenWithIcon}
              href={url}
            />
          }
          description={
            <>
              <Typography variant="h5" className="u-error" gutterBottom>
                {t('KonnectorUpdateInfo.title')}
              </Typography>
              <Typography variant="body1">
                <span
                  dangerouslySetInnerHTML={{
                    __html: t('KonnectorUpdateInfo.content')
                  }}
                />
              </Typography>
            </>
          }
          isImportant
        />
      </Padded>
    </CozyTheme>
  )
}

export default React.memo(KonnectorUpdateInfo)
