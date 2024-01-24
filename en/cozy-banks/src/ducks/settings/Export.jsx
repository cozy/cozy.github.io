import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import cx from 'classnames'

import { Empty } from 'cozy-ui/transpiled/react'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Button from 'cozy-ui/transpiled/react/Buttons'
import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import PreviousIcon from 'cozy-ui/transpiled/react/Icons/Previous'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { useClient, useQuery } from 'cozy-client'

import { DATA_EXPORT_DIR_ID, DATA_EXPORT_NAME } from 'ducks/export/constants'
import downloadIllu from 'assets/icons/download-illu.svg'
import { buildFilesQueryByNameAndDirId } from 'ducks/settings/queries'
import { downloadFile } from 'ducks/settings/helpers'
import { isExportJobInProgress } from 'ducks/export/helpers'

const Export = () => {
  const [exportJobInProgress, setExportJobInProgress] = useState(true)
  const navigate = useNavigate()
  const client = useClient()
  const { isMobile } = useBreakpoints()
  const { t } = useI18n()

  useEffect(() => {
    const setExportJob = async () => {
      const res = await isExportJobInProgress(client)
      setExportJobInProgress(res)
    }
    setExportJob()
  }, [client])

  const filesQueryByName = buildFilesQueryByNameAndDirId(
    DATA_EXPORT_NAME,
    DATA_EXPORT_DIR_ID
  )
  const { data: exportFile } = useQuery(
    filesQueryByName.definition,
    filesQueryByName.options
  )

  const isFileReady = !exportJobInProgress && exportFile?.length > 0

  return (
    <>
      <div
        className={cx({
          'u-p-1 u-pos-absolute': !isMobile
        })}
      >
        <IconButton onClick={() => navigate('..')} size="large">
          <Icon icon={PreviousIcon} />
        </IconButton>
      </div>
      <div
        className={cx({
          'u-flex u-h-100': !isMobile
        })}
      >
        <Empty
          icon={downloadIllu}
          iconSize="normal"
          title={t('Settings.export.title')}
          className="u-p-1"
          text={
            isFileReady
              ? t('Settings.export.description.ready')
              : t('Settings.export.description.waiting')
          }
        >
          <Button
            theme="primary"
            onClick={() => downloadFile(client, exportFile?.[0])}
            label={t('Settings.export.download')}
            busy={!isFileReady}
            className="u-mb-1"
            data-testid="download-btn"
          />
        </Empty>
      </div>
    </>
  )
}

export default Export
