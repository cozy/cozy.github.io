import React from 'react'

import { Empty } from 'cozy-ui/transpiled/react'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import Typography from 'cozy-ui/transpiled/react/Typography'

import successIllu from 'assets/icons/success-illu.svg'

const ImportContentSuccess = () => {
  const { t } = useI18n()

  return (
    <Empty
      icon={successIllu}
      title={t('Settings.import.title.success')}
      className="u-p-1 u-h-100"
      text={
        <Typography component="span" className="u-mb-1 u-db u-spacellipsis">
          {t('Settings.import.description.success')}
        </Typography>
      }
      data-testid="ImportContentSuccess"
    />
  )
}

export default ImportContentSuccess
