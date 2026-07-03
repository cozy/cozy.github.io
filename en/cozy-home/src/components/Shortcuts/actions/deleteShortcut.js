import { Trash } from '@linagora/twake-icons'
import { makeAction } from 'cozy-ui/transpiled/react/ActionsMenu/Actions/makeAction'

export const deleteShortcut = ({ file, client, t }) => {
  const label = t('shortcut.delete')

  return makeAction({
    name: 'DeleteShortcut',
    icon: Trash,
    label,
    action: () => {
      client.collection('io.cozy.files').deleteFilePermanently(file._id)
    }
  })
}
