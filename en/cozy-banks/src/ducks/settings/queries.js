import { Q, fetchPolicies } from 'cozy-client'

import { FILES_DOCTYPE, SETTINGS_DOCTYPE } from 'src/doctypes'

const defaultFetchPolicy = fetchPolicies.olderThan(30 * 1000)

export const buildFilesQueryByNameAndDirId = (name, dirId) => ({
  definition: () =>
    Q(FILES_DOCTYPE)
      .where({ name: name })
      .partialIndex({
        type: 'file',
        dir_id: dirId,
        trashed: false
      })
      .indexFields(['name']),
  options: {
    as: `${FILES_DOCTYPE}/name/${name}`,
    fetchPolicy: defaultFetchPolicy
  }
})

export const buildAppSettingsQuery = () => ({
  definition: () => Q(SETTINGS_DOCTYPE),
  options: {
    as: `${SETTINGS_DOCTYPE}`,
    fetchPolicy: defaultFetchPolicy
  }
})
