export const getVendors = transaction => {
  return transaction.reimbursements
    ? transaction.reimbursements
        .map(
          reimbursement =>
            reimbursement && reimbursement.bill && reimbursement.bill.vendor
        )
        .filter(Boolean)
    : []
}

export const formatVendor = vendor => {
  const vendorsMap = {
    Ameli: 'la CPAM'
  }

  return vendorsMap[vendor] || vendor
}
