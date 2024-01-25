import flag from 'cozy-flags'

import WalletIcon from 'cozy-ui/transpiled/react/Icons/Wallet'
import GearIcon from 'cozy-ui/transpiled/react/Icons/Gear'
import GraphCircleIcon from 'cozy-ui/transpiled/react/Icons/GraphCircle'

import transfersIcon from 'assets/icons/icon-transfers.svg'

const transferRoute = /\/transfers(\/.*)?/
const settingsRoute = /\/settings(\/.*)?/
const balancesRoute = /\/balances(\/.*)?/
const analysisRoute = /\/(categories|recurrence).*?/
const categoriesRoute = /\/categories(\/.*)?/
const recurrenceRoute = /\/recurrence(\/.*)?/

export const items = t => [
  {
    to: '/balances',
    icon: WalletIcon,
    label: t('Nav.my-accounts'),
    rx: balancesRoute
  },
  {
    to: '/analysis/categories',
    icon: GraphCircleIcon,
    label: t('Nav.analysis'),
    rx: analysisRoute
  },
  {
    to: '/analysis/categories',
    label: t('Nav.categories'),
    rx: categoriesRoute,
    secondary: true
  },
  {
    to: '/analysis/recurrence',
    label: t('Nav.recurrence'),
    rx: recurrenceRoute,
    secondary: true
  },
  flag('banks.transfers')
    ? {
        to: '/transfers',
        icon: transfersIcon,
        label: t('Transfer.nav'),
        rx: transferRoute
      }
    : null,
  {
    to: '/settings',
    icon: GearIcon,
    label: t('Nav.settings'),
    rx: settingsRoute
  }
]
