import React from 'react'

import Stack from 'cozy-ui/transpiled/react/Stack'

import { FlagSwitcher } from 'cozy-flags'

import LibraryVersionsDevtools from 'ducks/devtools/LibraryVersions'
import ServiceDevtools from 'ducks/devtools/Services'
import NotificationDevtools from 'ducks/devtools/Notifications'
import PinDevtools from 'ducks/devtools/Pin'
import ClientInfoDevtools from 'ducks/devtools/ClientInfo'
import MiscDevtools from 'ducks/devtools/Misc'
import HiddenPagesDevtools from 'ducks/devtools/HiddenPages'

class DebugSettings extends React.PureComponent {
  render() {
    return (
      <Stack spacing="l">
        <HiddenPagesDevtools />
        <div>
          <MiscDevtools />
        </div>
        <div>
          <ClientInfoDevtools />
        </div>
        <div>
          <NotificationDevtools />
        </div>
        <div>
          <ServiceDevtools />
        </div>
        <div>
          <FlagSwitcher.List />
        </div>
        <div>
          <PinDevtools />
          <LibraryVersionsDevtools />
        </div>
      </Stack>
    )
  }
}

export default DebugSettings
