import { useQuery } from 'cozy-client'

import { Section } from '@/components/Sections/SectionsTypes'
import { formatShortcuts } from '@/components/Shortcuts/utils'
import {
  mkHomeCustomShorcutsDirConn,
  mkHomeCustomShorcutsConn
} from '@/queries'

export const useShortcutsDirectories = (
  magicHomeFolderId?: string
): Section[] => {
  const homeShortcutsDirConn = mkHomeCustomShorcutsDirConn({
    currentFolderId: magicHomeFolderId
  })
  const canHaveShortcuts = !!magicHomeFolderId
  const { data: folders } = useQuery(homeShortcutsDirConn.query, {
    ...homeShortcutsDirConn.options,
    enabled: canHaveShortcuts
  }) as { data: { _id: string }[] }

  const customHomeShortcutsConn = mkHomeCustomShorcutsConn(
    folders && folders.map(folder => folder._id)
  )
  const { data: customHomeShortcuts } = useQuery(
    customHomeShortcutsConn.query,
    {
      ...customHomeShortcutsConn,
      enabled: Boolean(folders && folders.length > 0)
    }
  )

  return canHaveShortcuts
    ? (formatShortcuts(folders, customHomeShortcuts) as Section[])
    : []
}
