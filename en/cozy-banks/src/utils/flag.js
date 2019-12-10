/* global __DEV__ */

import flag from 'cozy-flags'
import { some } from 'lodash'

/** Reset flags, keeping only those set to true */
const garbageCollectFlags = () => {
  const trueFlags = flag
    .list()
    .map(name => [name, flag(name)])
    .filter(x => x[1])
    .map(x => x[0])
  flag.reset()
  for (const trueFlag of trueFlags) {
    flag(trueFlag, true)
  }
}

garbageCollectFlags()

if (__DEV__ && flag('switcher') === null) {
  flag('switcher', true)
}

const demoFqdns = [
  'stephaniedurand.cozy.rocks',
  'isabelledurand.cozy.rocks',
  'genevievedurand.cozy.rocks',
  'isabelledurand.mycozy.cloud'
]

const locationMatchesFqdn = (location, fqdn) => {
  const splitted = fqdn.split('.')
  const slug = splitted[0]
  const domain = splitted.slice(1).join('.')
  const rx = new RegExp(slug + '.*' + domain.replace('.', '\\.'))
  return rx.exec(location)
}

const isDemoCozy = () => {
  const location = window.location.href
  return some(demoFqdns.map(fqdn => locationMatchesFqdn(location, fqdn)))
}

if (isDemoCozy()) {
  flag('demo', true)
}

// Turn on reimbursement tags + new CTAs UI
flag('reimbursements.tag', true)

// Turn on error banner on transactions page
flag('transactions.error-banner', true)

// Turn on loan details page
flag('loan-details-page', true)

// Turn on all flags related to owners
flag('balance.show-owners', true)
flag('settings.show-accounts-owners', true)
flag('settings.new-account-details-page', true)

window.flag = flag
