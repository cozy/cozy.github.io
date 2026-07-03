import { Pen } from '@linagora/twake-icons'
import { makeAction } from 'cozy-ui/transpiled/react/ActionsMenu/Actions/makeAction'

export const editShortcut = ({ showEditModal, t }) => {
  const label = t('shortcut.edit')

  return makeAction({
    name: 'EditShortcut',
    icon: Pen,
    label,
    action: () => {
      showEditModal()
    }
  })
}
