import React from 'react'

import { Empty } from 'cozy-ui/transpiled/react'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Typography from 'cozy-ui/transpiled/react/Typography'

import ListItemImport from 'ducks/settings/Import/ImportContents/ListItemImport'
import importIllu from 'assets/icons/import-illu.svg'

const ImportContentWithFile = ({ setFile, file }) => {
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
      data-testid="ImportContentWithFile"
    >
      <ListItemImport file={file} setFile={setFile} isBusy={false} />
    </Empty>
  )
}

export default ImportContentWithFile
