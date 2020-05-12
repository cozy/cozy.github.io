/* global __DEVELOPMENT__ */

import flag from 'cozy-flags'
import { some } from 'lodash'
import Figure from 'cozy-ui/transpiled/react/Figure'

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

if (__DEVELOPMENT__ && flag('switcher') === null) {
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

// Turn on flags for professional and others reimbursements accounts
flag('balance.professional-reimb-account', true)
flag('balance.others-reimb-account', true)

Figure.defaultProps = Object.assign({}, Figure.defaultProps, {
  blurred: flag('amount_blur') ? true : false
})

window.flag = flag
