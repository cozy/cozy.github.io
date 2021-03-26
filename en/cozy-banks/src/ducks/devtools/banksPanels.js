import LibraryVersionsDevtools from 'ducks/devtools/LibraryVersions'
import ServiceDevtools from 'ducks/devtools/Services'
import NotificationDevtools from 'ducks/devtools/Notifications'
import PinDevtools from 'ducks/devtools/Pin'
import ClientInfoDevtools from 'ducks/devtools/ClientInfo'
import MiscDevtools from 'ducks/devtools/Misc'
import HiddenPagesDevtools from 'ducks/devtools/HiddenPages'
import FlagsDevtools from 'ducks/devtools/Flags'

export default [
  {
    id: 'libraries',
    Component: LibraryVersionsDevtools
  },

  {
    id: 'services',
    Component: ServiceDevtools
  },
  {
    id: 'notifications',
    Component: NotificationDevtools
  },
  {
    id: 'pin',
    Component: PinDevtools
  },
  {
    id: 'client',
    Component: ClientInfoDevtools
  },
  {
    id: 'misc',
    Component: MiscDevtools
  },
  {
    id: 'hidden pages',
    Component: HiddenPagesDevtools
  },
  {
    id: 'flags',
    Component: FlagsDevtools
  }
]
