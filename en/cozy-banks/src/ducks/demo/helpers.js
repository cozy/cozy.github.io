export const isVentePriveeTransaction = transaction => {
  return (
    transaction && ['Vente-Privée', 'Veepee.fr'].includes(transaction.label)
  )
}

export const isAmeliTransaction = transaction =>
  transaction && transaction._id === 'paiement_docteur_martin'

export const isVentePriveeBill = bill => bill.vendor === 'venteprivee'
export const isAmeliBill = bill => bill._id === 'bill_cpam_demo'

export const isAugmentedModalTransaction = transaction => {
  return (
    isVentePriveeTransaction(transaction) || isAmeliTransaction(transaction)
  )
}

export const isAugmentedModalBill = bill => {
  return isVentePriveeBill(bill) || isAmeliBill(bill)
}

export const getTransactionVendor = transaction => {
  if (isVentePriveeTransaction(transaction)) {
    return 'ventePrivee'
  } else {
    return 'ameli'
  }
}
