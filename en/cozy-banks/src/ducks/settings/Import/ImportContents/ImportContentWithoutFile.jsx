import React from 'react'

import { Empty } from 'cozy-ui/transpiled/react'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Typography from 'cozy-ui/transpiled/react/Typography'

import FileInputImport from 'ducks/settings/Import/ImportContents/FileInputImport'
import importIllu from 'assets/icons/import-illu.svg'

const ImportContentWithoutFile = ({ setFile }) => {
  const { t } = useI18n()

  return (
    <Empty
      icon={importIllu}
      title={t('Settings.import.title.text')}
      className="u-p-1 u-h-100"
      text={
        <Typography component="span" className="u-mb-1 u-db u-spacellipsis">
          {t('Settings.import.description.text')}
        </Typography>
      }
      data-testid="ImportContentWithoutFile"
    >
      <FileInputImport setFile={setFile} />
    </Empty>
  )
}

export default ImportContentWithoutFile
