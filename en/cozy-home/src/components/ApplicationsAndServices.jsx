import React from 'react'

import flag from 'cozy-flags'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'

import AddTile from './AddTile'
import { useApps } from './Applications'
import AssistantTile from './AssistantTile'
import { useServices } from './Services'

import EntrypointLink from '@/components/EntrypointLink'
import LogoutTile from '@/components/LogoutTile'
import ShortcutLink from '@/components/ShortcutLink'

export const ApplicationsAndServices = () => {
  const showLogout = !!flag('home.mainlist.show-logout')
  const { appsComponents, apps, shortcuts, entrypoints } = useApps()
  const { konnectors } = useServices()
  const { isMobile } = useBreakpoints()

  return (
    <div className="app-list-wrapper u-m-auto u-w-100">
      <div className="app-list app-list--gutter u-w-100 u-mh-auto u-flex-justify-center">
        {appsComponents}
        {konnectors}
        {shortcuts &&
          shortcuts.map((shortcut, index) => (
            <ShortcutLink key={index} file={shortcut} />
          ))}
        {entrypoints &&
          entrypoints.map(entrypoint => (
            <EntrypointLink key={entrypoint.name} entrypoint={entrypoint} />
          ))}
        {isMobile && flag('cozy.assistant.enabled') && <AssistantTile />}
        <AddTile apps={apps} />
        {showLogout && <LogoutTile />}
      </div>
    </div>
  )
}

export default ApplicationsAndServices
