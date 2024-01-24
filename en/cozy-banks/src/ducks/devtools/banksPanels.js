import ServiceDevtools from 'ducks/devtools/Services'
import NotificationDevtools from 'ducks/devtools/Notifications'
import ClientInfoDevtools from 'ducks/devtools/ClientInfo'
import MiscDevtools from 'ducks/devtools/Misc'
import HiddenPagesDevtools from 'ducks/devtools/HiddenPages'
import PouchDevtools from 'cozy-client/dist/devtools/Pouch'

export default [
  {
    id: 'services',
    Component: ServiceDevtools
  },
  {
    id: 'notifications',
    Component: NotificationDevtools
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
    id: 'pouch',
    Component: PouchDevtools
  }
]
