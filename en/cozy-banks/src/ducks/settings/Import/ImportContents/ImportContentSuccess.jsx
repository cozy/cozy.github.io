import React from 'react'

import { isQueryLoading, useQuery } from 'cozy-client'
import { Empty } from 'cozy-ui/transpiled/react'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import Typography from 'cozy-ui/transpiled/react/Typography'

import successIllu from 'assets/icons/success-illu.svg'
import { buildAppSettingsQuery } from 'ducks/settings/queries'

const ImportContentSuccess = () => {
  const { t } = useI18n()
  const appSettingsQuery = buildAppSettingsQuery()
  const { data: appSettings, ...appSettingsQueryResult } = useQuery(
    appSettingsQuery.definition,
    appSettingsQuery.options
  )
  const isLoadingAppSettings =
    isQueryLoading(appSettingsQueryResult) || appSettingsQueryResult.hasMore

  const savedTransactionsCount =
    !isLoadingAppSettings &&
    appSettings?.[0]?.lastImportSuccess?.savedTransactionsCount

  const text = savedTransactionsCount ? (
    <Typography component="span" className="u-mb-1 u-db u-spacellipsis">
      {t('Settings.import.description.success', {
        smart_count: savedTransactionsCount
      })}
    </Typography>
  ) : null

  return (
    <Empty
      icon={successIllu}
      title={t('Settings.import.title.success')}
      className="u-p-1 u-h-100"
      text={text}
      data-testid="ImportContentSuccess"
    />
  )
}

export default ImportContentSuccess
