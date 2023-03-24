import { uploadFileWithConflictStrategy } from 'cozy-client/dist/models/file'

import { DATA_EXPORT_DIR_ID } from 'ducks/export/constants'
import { JOBS_DOCTYPE } from 'src/doctypes'

/**
 * @param {boolean} isBusy
 * @param {boolean} isSuccess
 * @param {boolean} isServiceInProgress
 * @param {Function} t - i18n function
 */
export const getEmptyActionLabel = ({
  isBusy,
  isSuccess,
  isServiceInProgress,
  t
}) => {
  return isBusy
    ? t('Settings.import.action.busy')
    : isServiceInProgress
    ? t('Settings.import.action.serviceInProgress')
    : isSuccess
    ? t('Settings.import.action.close')
    : t('Settings.import.action.text')
}

/**
 * @param {import('cozy-client/types/CozyClient').default} client
 * @param {import('cozy-client/types/types').IOCozyFile} file
 */
export const uploadImportFile = async (client, file) => {
  return uploadFileWithConflictStrategy(client, file, {
    name: file.name,
    dirId: DATA_EXPORT_DIR_ID,
    conflictStrategy: 'rename'
  })
}

/**
 * @param {import('cozy-client/types/CozyClient').default} client
 * @param {string} fileId
 */
export const launchImportJob = async (client, fileId) => {
  const jobColl = client.collection(JOBS_DOCTYPE)
  return jobColl.create(
    'service',
    { slug: 'banks', name: 'import', fields: { fileId } },
    {},
    true
  )
}
