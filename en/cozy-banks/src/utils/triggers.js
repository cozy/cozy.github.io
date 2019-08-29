import { logInfo } from 'lib/sentry'
import { includes, get } from 'lodash'

// To update this list used this command on banking konnector:
// $ cat src/publish/manifests.json | jq '.[].slug'
const bankingSlug = [
  'axabanque102',
  'banquepopulaire',
  'barclays136',
  'bforbank97',
  'bnpparibas82',
  'boursorama83',
  'bred',
  'caissedepargne1',
  'carrefour159',
  'casden173',
  'cic63',
  'comptenickel168',
  'caatlantica3',
  'creditcooperatif148',
  'cdngroup88',
  'creditmaritime',
  'cic45',
  'fortuneo84',
  'hellobank145',
  'hsbc119',
  'ingdirect95',
  'labanquepostale44',
  'lcl-linxo',
  'monabanq96',
  'cdngroup109',
  'societegenerale'
]

export const getKonnectorFromTrigger = trigger => {
  if (trigger.worker !== 'konnector') {
    return
  }
  if (trigger.message && trigger.message.konnector) {
    return trigger.message.konnector
  } else if (trigger.message && trigger.message.Data) {
    // Legacy triggers
    logInfo('Legacy trigger detected')
    const message = JSON.parse(atob(trigger.message.Data))
    return message.konnector
  }
}

export const isBankTrigger = trigger =>
  get(trigger, 'attributes.worker') === 'konnector' &&
  includes(bankingSlug, get(trigger, 'attributes.message.konnector'))
