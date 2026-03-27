import React from 'react'

import { useClient } from 'cozy-client'
import { ShortcutDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import CozyTheme from 'cozy-ui-plus/dist/providers/CozyTheme'

import { useMagicFolder } from '@/components/Sections/hooks/useMagicFolder'

const ShortcutCreateModal = ({ onClose }) => {
  const client = useClient()
  const magicHomeFolderId = useMagicFolder()

  const createShortcut = async (makedFileName, makedURL) => {
    let homeFolderId = magicHomeFolderId

    if (!homeFolderId) {
      homeFolderId = await client
        .collection('io.cozy.files')
        .ensureDirectoryExists('/Settings/Home')
    }

    await client.save({
      _type: 'io.cozy.files.shortcuts',
      dir_id: homeFolderId,
      name: makedFileName,
      url: makedURL
    })
  }

  return (
    <CozyTheme>
      <ShortcutDialog onSave={createShortcut} onClose={onClose} />
    </CozyTheme>
  )
}

export default ShortcutCreateModal
