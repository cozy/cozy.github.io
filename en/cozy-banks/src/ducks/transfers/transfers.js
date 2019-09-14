import {
  PERMISSION_DOCTYPE,
  COZY_ACCOUNT_DOCTYPE,
  KONNECTOR_DOCTYPE
} from 'doctypes'

/**
 * Creates a temporary account with authentication
 * and give permission to the konnector to access this account
 *
 * @param  {CozyClient} client
 * @param  {string} konnSlug - ex: "caissedepargne1"
 * @param  {Object} auth - ex: { password: '1234' }
 */
export const prepareJobAccount = async (client, konnSlug, auth) => {
  const accounts = client.collection(COZY_ACCOUNT_DOCTYPE)
  const permissions = client.collection(PERMISSION_DOCTYPE)
  const konnectorsCol = client.collection(KONNECTOR_DOCTYPE)

  const { data: account } = await accounts.create({
    auth,
    temporary: true
  })

  const { data: konnectors } = await konnectorsCol.all()
  const konnector = konnectors.find(
    konn => konn._id === `${KONNECTOR_DOCTYPE}/${konnSlug}`
  )

  if (!konnector) {
    throw new Error(`Could not find suitable konnector for slug: ${konnSlug}`)
  }

  const { data: permission } = await permissions.add(konnector, {
    [account._id]: {
      type: COZY_ACCOUNT_DOCTYPE,
      verbs: ['GET', 'DELETE'],
      values: [`${COZY_ACCOUNT_DOCTYPE}.${account._id}`]
    }
  })
  return { account, permission, konnector }
}

/**
 * Creates a job to transfer money
 *
 * @param  {CozyClient} client            - CozyClient
 * @param  {Integer} options.amount    - Amount to send
 * @param  {String} options.recipientId - io.cozy.bank.recipients id
 * @param  {String} options.senderAccount - io.cozy.bank.accounts id
 * @param  {String} options.password - Password of the bank account
 * @param  {String} options.label - Label of the operation
 * @param  {String} options.executionDate - Date of the operation in DD/MM/YYYY
 * @return {Promise}
 */
export const createJob = async (
  client,
  { amount, recipientId, senderAccount, password, label, executionDate }
) => {
  const konnector = senderAccount.cozyMetadata.createdByApp
  const { account } = await prepareJobAccount(client, konnector, {
    password
  })
  return client.stackClient.jobs.create('konnector', {
    mode: 'transfer',
    konnector,
    recipientId,
    temporaryAccountId: account._id,
    amount,
    senderAccountId: senderAccount._id,
    label,
    executionDate
  })
}
