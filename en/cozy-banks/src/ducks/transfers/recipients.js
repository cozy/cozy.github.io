import groupBy from 'lodash/groupBy'

/**
 * Returns the io.cozy.banks.accounts corresponding to a recipient by matching
 * on IBAN or number
 */
export const findAccount = (recipient, accounts) => {
  const account = accounts.find(acc => {
    const sameVendorId = Boolean(
      recipient.vendorAccountId && recipient.vendorAccountId === acc.vendorId
    )
    const sameIBAN = Boolean(acc.iban && acc.iban === recipient.iban)
    const sameNumber = Boolean(
      recipient.iban && acc.number && recipient.iban.includes(acc.number)
    )
    return sameVendorId || sameIBAN || sameNumber
  })
  return account || null
}

/**
 * BI recipients are per-account, if a user has 2 accounts that can send money to 1 person, there will be
 * 2 recipients. External accounts can be deduped on IBAN, internal on label
 */
export const groupAsBeneficiary = (recipients, accounts) => {
  return Object.values(
    groupBy(recipients, r => (r.category == 'internal' ? r.label : r.iban))
  ).map(group => {
    const beneficiary = {
      _id: group[0]._id, // useful for key
      label: group[0].label,
      bankName: group[0].bankName,
      iban: group[0].iban,
      category: group[0].category,
      recipients: group
    }
    beneficiary.account = findAccount(beneficiary, accounts)
    return beneficiary
  })
}

/**
 * Creates a predicate checking whether a recipient should be internal or external.
 *
 * It is considered internal if its category is internal or if we can find a
 * matching io.cozy.bank.accounts.
 */
export const createCategoryFilter = (category, accounts) => recipient => {
  const hasAccount = !!findAccount(recipient, accounts)

  if (category === 'internal' && !hasAccount) {
    // eslint-disable-next-line no-console
    console.warn(
      'Recipient is internal, but no corresponding account was found',
      recipient
    )
    return false
  }

  if (category === 'external' && hasAccount) {
    // eslint-disable-next-line no-console
    console.warn(
      'Recipient is external, but a corresponding account was found',
      recipient
    )
    return false
  }

  return true
}
