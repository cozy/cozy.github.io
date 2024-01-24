import React from 'react'

import { Empty } from 'cozy-ui/transpiled/react'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Typography from 'cozy-ui/transpiled/react/Typography'

import importIllu from 'assets/icons/import-illu.svg'

const ImportContentServiceInProgress = () => {
  const { t } = useI18n()

  return (
    <Empty
      icon={importIllu}
      title={t('Settings.import.title.serviceInProgress')}
      className="u-p-1 u-h-100"
      text={
        <Typography component="span" className="u-mb-1 u-db u-spacellipsis">
          {t('Settings.import.description.serviceInProgress')}
        </Typography>
      }
      data-testid="ImportContentServiceInProgress"
    />
  )
}

export default ImportContentServiceInProgress
