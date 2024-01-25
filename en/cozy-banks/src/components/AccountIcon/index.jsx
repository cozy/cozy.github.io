import React from 'react'
import KonnectorIcon from 'cozy-harvest-lib/dist/components/KonnectorIcon'
import { getAccountInstitutionSlug } from 'ducks/account/helpers'
import styles from './styles.styl'
import cx from 'classnames'

export const AccountIconContainer = ({ size, children }) => {
  return (
    <span
      className={cx(styles.AccountIconContainer, {
        [styles['AccountIconContainer--small']]: size === 'small',
        [styles['AccountIconContainer--large']]: size === 'large'
      })}
    >
      {children}
    </span>
  )
}

/** Displays a konnector icon for an io.cozy.bank.accounts */
const _AccountIcon = ({ account, className, size }) => {
  const institutionSlug = getAccountInstitutionSlug(account)
  if (!institutionSlug) {
    return null
  }
  return (
    <AccountIconContainer size={size}>
      <KonnectorIcon
        konnector={{ slug: institutionSlug }}
        className={className}
      />
    </AccountIconContainer>
  )
}

const AccountIcon = React.memo(_AccountIcon)

export default AccountIcon
