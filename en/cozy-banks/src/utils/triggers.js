import { includes, get } from 'lodash'

// To update this list used this command on banking konnector:
// $ cat src/publish/manifests.json | jq '.[].slug'
const bankingSlug = [
  'axabanque102',
  'banquepopulaire',
  'bankingconnectortest',
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
  'revolut',
  'societegenerale',
  'n26',
  'banquecasino',
  'cetelem',
  'sofinco',
  'oney'
]

export const isBankTrigger = trigger =>
  includes(bankingSlug, get(trigger, 'message.konnector'))
