import React, { useState, useCallback, useMemo } from 'react'

import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Switch from 'cozy-ui/transpiled/react/Switch'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import Alerter from 'cozy-ui/transpiled/react/deprecated/Alerter'

import { getGroupLabel } from 'ducks/groups/helpers'
import { getAccountInstitutionLabel } from 'ducks/account/helpers'

import styles from 'ducks/settings/GroupsSettings.styl'

const AccountLine = props => {
  const { account, group, toggleAccount, groupsByAccountId } = props
  const { t } = useI18n()
  const { isMobile } = useBreakpoints()
  const [toggleState, setToggleState] = useState(
    group ? Boolean(group.accounts.existsById(account._id)) : false
  )

  const handleClickSwitch = useCallback(
    async ev => {
      const newState = ev.target.checked
      const prevState = Boolean(group.accounts.existsById(account._id))
      setToggleState(newState)
      try {
        await toggleAccount(account._id, group, newState)
      } catch (e) {
        Alerter.error(t('Groups.toggle-account-error'))

        // eslint-disable-next-line no-console
        console.warn('Error while ', e)
        // Rollback to previous state
        setToggleState(prevState)
      }
    },
    [toggleAccount, account, group, setToggleState, t]
  )

  const groups = useMemo(() => {
    const accountGroups = groupsByAccountId[account._id] || []
    return accountGroups.filter(accountGroup => accountGroup._id !== group._id)
  }, [account._id, group._id, groupsByAccountId])

  return (
    <tr>
      <td className={styles.GrpStg__accntLabel}>
        {account.shortLabel || account.label}
      </td>
      <td className={styles.GrpStg__accntBank}>
        {getAccountInstitutionLabel(account)}
      </td>
      <td className={styles.GrpStg__accntNumber}>{account.number}</td>
      {!isMobile ? (
        <td className={styles.GrpStg__accntGroups}>
          {groups.map(g => getGroupLabel(g, t)).join(', ')}
        </td>
      ) : null}
      <td className={styles.GrpStg__accntToggle}>
        {group ? (
          <Switch
            disableRipple
            color="primary"
            id={account._id}
            checked={toggleState}
            onChange={handleClickSwitch}
          />
        ) : (
          <Switch id={account._id} disabled />
        )}
      </td>
    </tr>
  )
}

export default React.memo(AccountLine)
