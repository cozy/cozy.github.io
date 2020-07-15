import React from 'react'
import KonnectorIcon from 'ducks/balance/KonnectorIcon'
import { getAccountInstitutionSlug } from 'ducks/account/helpers'
import styles from './styles.styl'
import cx from 'classnames'

/** Displays a konnector icon for an io.cozy.bank.accounts */
const _AccountIcon = ({ account, className, size }) => {
  const institutionSlug = getAccountInstitutionSlug(account)
  if (!institutionSlug) {
    return null
  }
  return (
    <span
      className={cx(styles.AccountIconContainer, {
        [styles['AccountIconContainer--small']]: size === 'small',
        [styles['AccountIconContainer--large']]: size === 'large'
      })}
    >
      <KonnectorIcon slug={institutionSlug} className={className} />
    </span>
  )
}

const AccountIcon = React.memo(_AccountIcon)

export default AccountIcon
