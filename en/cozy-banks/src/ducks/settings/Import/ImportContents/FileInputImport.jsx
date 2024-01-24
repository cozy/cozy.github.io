import React from 'react'

import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Button from 'cozy-ui/transpiled/react/Buttons'
import Icon from 'cozy-ui/transpiled/react/Icon'
import FileInput from 'cozy-ui/transpiled/react/FileInput'
import PlusIcon from 'cozy-ui/transpiled/react/Icons/Plus'

const FileInputImport = ({ setFile }) => {
  const { t } = useI18n()

  return (
    <FileInput
      className="u-w-100"
      onChange={setFile}
      onClick={e => e.stopPropagation()}
      accept=".csv"
      data-testid="FileInputImport"
    >
      <Button
        component="a"
        className="u-pv-1-half u-w-100"
        label={t('Settings.import.description.action')}
        variant="ghost"
        startIcon={<Icon icon={PlusIcon} />}
      />
    </FileInput>
  )
}

export default FileInputImport
