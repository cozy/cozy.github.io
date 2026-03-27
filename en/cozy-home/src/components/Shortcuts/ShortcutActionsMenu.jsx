import cx from 'classnames'
import React, { useState, useRef } from 'react'

import { useClient } from 'cozy-client'
import ActionsMenu from 'cozy-ui/transpiled/react/ActionsMenu'
import { makeActions } from 'cozy-ui/transpiled/react/ActionsMenu/Actions'
import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import DotsIcon from 'cozy-ui/transpiled/react/Icons/Dots'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'
import CozyTheme from 'cozy-ui-plus/dist/providers/CozyTheme'
import { useI18n } from 'twake-i18n'

import ShortcutEditModal from './ShortcutEditModal'
import { deleteShortcut } from './actions/deleteShortcut'
import { editShortcut } from './actions/editShortcut'
import styles from './shortcut.styl'

const ShortcutActionsMenu = ({
  isMenuOpen,
  setIsMenuOpen,
  file,
  shortcutInfos
}) => {
  const client = useClient()
  const { t } = useI18n()
  const { isMobile } = useBreakpoints()
  const anchorRef = useRef(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const actions = makeActions([editShortcut, deleteShortcut], {
    file,
    showEditModal: () => setIsEditModalOpen(true),
    client,
    t
  })

  return (
    <>
      {!isMobile && (
        <IconButton
          ref={anchorRef}
          size="small"
          className={cx(
            styles['shortcut-actions-menu'],
            isMenuOpen && styles['shortcut-actions-menu--visible']
          )}
          onClick={() => {
            setIsMenuOpen(true)
          }}
        >
          <Icon icon={DotsIcon} rotate={90} />
        </IconButton>
      )}
      <CozyTheme>
        <ActionsMenu
          ref={anchorRef}
          open={isMenuOpen}
          actions={actions}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right'
          }}
          onClose={() => setIsMenuOpen(false)}
        />
        {isEditModalOpen && (
          <ShortcutEditModal
            file={file}
            shortcutInfos={shortcutInfos}
            onClose={() => setIsEditModalOpen(false)}
          />
        )}
      </CozyTheme>
    </>
  )
}

export default ShortcutActionsMenu
