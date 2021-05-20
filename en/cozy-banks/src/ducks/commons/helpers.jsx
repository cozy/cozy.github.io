import flag from 'cozy-flags'

import settingsIcon from 'assets/icons/icon-gear.svg'
import walletIcon from 'assets/icons/icon-wallet.svg'
import graphIcon from 'assets/icons/icon-graph.svg'
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
    icon: walletIcon,
    label: t('Nav.my-accounts'),
    rx: balancesRoute
  },
  {
    to: '/analysis/categories',
    icon: graphIcon,
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
    icon: settingsIcon,
    label: t('Nav.settings'),
    rx: settingsRoute
  }
]
