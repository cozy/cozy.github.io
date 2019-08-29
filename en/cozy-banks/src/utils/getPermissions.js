import manifest from '../../manifest.webapp'

const getPermissions = () =>
  Object.keys(manifest.permissions).map(
    permission => manifest.permissions[permission].type
  )

export default getPermissions
