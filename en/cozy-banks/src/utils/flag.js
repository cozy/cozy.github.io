/* global __DEVELOPMENT__ */

import flag from 'cozy-flags'
import some from 'lodash/some'
import Figure from 'cozy-ui/transpiled/react/Figure'

/** Reset flags, keeping only those set to a truthy value */
const garbageCollectFlags = () => {
  const trueFlags = flag
    .list()
    .map(name => [name, flag(name)])
    .filter(x => x[1])
  flag.reset()
  for (const [flagName, flagValue] of trueFlags) {
    flag(flagName, flagValue)
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

Figure.defaultProps = Object.assign({}, Figure.defaultProps, {
  blurred: flag('amount-blur') ? true : false
})

flag.store.on('change', function (flagName) {
  if (flagName === 'amount-blur') {
    Figure.defaultProps.blurred = flag('amount-blur')
  }
})

window.flag = flag
