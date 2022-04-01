import CozyClient, { Q } from 'cozy-client'

export const defaultFetchPolicy = CozyClient.fetchPolicies.olderThan(30 * 1000)
export const appsConn = {
  query: Q('io.cozy.apps'),
  as: 'apps',
  fetchPolicy: defaultFetchPolicy
}

export const suggestedKonnectorsConn = {
  query: () =>
    Q('io.cozy.apps.suggestions')
      .where({ silenced: false })
      .indexFields(['silenced', 'slug'])
      .sortBy([{ silenced: 'asc' }, { slug: 'asc' }]),
  as: 'app-suggestions',
  fetchPolicy: defaultFetchPolicy
}

export const mkHomeMagicFolderConn = t => {
  return {
    query: Q('io.cozy.files').where({ path: t('home_config_magic_folder') }),
    as: 'home/io.cozy.files/path=magic-folder',
    fetchPolicy: defaultFetchPolicy
  }
}

export const mkHomeShorcutsConn = folderId => {
  return {
    query: Q('io.cozy.files')
      .where({ dir_id: folderId, class: 'shortcut' })
      .indexFields(['dir_id', 'class']),
    as: `home/io.cozy.files/dir_id=${folderId},class=shortcut`,
    fetchPolicy: defaultFetchPolicy
  }
}

export const mkHomeCustomShorcutsDirConn = ({
  currentFolderId,
  type = 'directory',
  sortAttribute = 'name',
  sortOrder = 'asc'
}) => ({
  query: Q('io.cozy.files')
    .where({
      dir_id: currentFolderId,
      type,
      [sortAttribute]: { $gt: null }
    })
    .partialIndex({
      _id: {
        $ne: 'io.cozy.files.trash-dir'
      }
    })
    .indexFields(['dir_id', 'type', sortAttribute])
    .sortBy([
      { dir_id: sortOrder },
      { type: sortOrder },
      { [sortAttribute]: sortOrder }
    ])
    .limitBy(100),
  options: {
    as: `${type} ${currentFolderId} ${sortAttribute} ${sortOrder}`,
    fetchPolicy: defaultFetchPolicy
  }
})

export const mkHomeCustomShorcutsConn = foldersId => {
  return {
    query: Q('io.cozy.files')
      .where({
        class: 'shortcut',
        dir_id: {
          $in: foldersId
        },
        name: { $gt: null }
      })
      .indexFields(['class', 'dir_id', 'name'])
      .sortBy([{ class: 'asc' }, { dir_id: 'asc' }, { name: 'asc' }])
      .limitBy(100),
    as: 'home-shortcuts',
    fetchPolicy: defaultFetchPolicy
  }
}