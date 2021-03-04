import manifest from 'ducks/client/manifest'

const getPermissions = () =>
  Object.keys(manifest.permissions).map(
    permission => manifest.permissions[permission].type
  )

export default getPermissions
