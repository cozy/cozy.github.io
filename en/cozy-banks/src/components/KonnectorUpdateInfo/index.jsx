import React from 'react'

import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Infos from 'cozy-ui/transpiled/react/deprecated/Infos'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { ButtonLink } from 'cozy-ui/transpiled/react/deprecated/Button'
import Typography from 'cozy-ui/transpiled/react/Typography'
import OpenWithIcon from 'cozy-ui/transpiled/react/Icons/Openwith'
import CozyTheme from 'cozy-ui/transpiled/react/providers/CozyTheme'

import { isQueryLoading } from 'cozy-client'

import { outdatedKonnectorsConn } from 'doctypes'
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

const KonnectorUpdateInfo = () => {
  const { t } = useI18n()
  const { isMobile } = useBreakpoints()
  const outdatedKonnectors = useFullyLoadedQuery(
    outdatedKonnectorsConn.query,
    outdatedKonnectorsConn
  )

  const bankingKonnectors = outdatedKonnectors.data
    ? outdatedKonnectors.data.filter(konnectors.hasCategory('banking'))
    : []

  const [url] = useRedirectionURL(
    APP_DOCTYPE,
    redirectionOptions,
    !isQueryLoading(outdatedKonnectors) && bankingKonnectors.length !== 0
  )

  if (isQueryLoading(outdatedKonnectors)) {
    return null
  }

  if (bankingKonnectors.length === 0) {
    return null
  }

  if (!url) {
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
