export const hasOneAccount = templateData => {
  const { accounts } = templateData
  const hasOneAccount = accounts.length === 1
  return hasOneAccount
}
