import React, { Component } from 'react'
import { withRouter } from 'react-router'
import { translate, useI18n } from 'cozy-ui/transpiled/react'
import Button from 'cozy-ui/transpiled/react/Button'
import Icon from 'cozy-ui/transpiled/react/Icon'
import { withBreakpoints } from 'cozy-ui/transpiled/react'
import { groupBy, flowRight as compose, sortBy } from 'lodash'
import Table from 'components/Table'
import Loading from 'components/Loading'
import { queryConnect, Q } from 'cozy-client'
import plus from 'assets/icons/16/plus.svg'
import styles from 'ducks/settings/AccountsSettings.styl'
import AddAccountLink from 'ducks/settings/AddAccountLink'
import {
  getAccountInstitutionLabel,
  getAccountType,
  getAccountOwners
} from 'ducks/account/helpers'
import { isCollectionLoading, hasBeenLoaded } from 'ducks/client/utils'
import { Contact } from 'cozy-doctypes'

import { accountsConn, APP_DOCTYPE } from 'doctypes'
import { Row, Cell } from 'components/Table'

// See comment below about sharings
// import { ACCOUNT_DOCTYPE } from 'doctypes'
// import { fetchSharingInfo } from 'modules/SharingStatus'
// import fetchData from 'components/fetchData'

// TODO react-router v4

const AccountOwners = ({ account }) => {
  const owners = getAccountOwners(account)
  return owners.length > 0 ? (
    <>
      <div className="u-ph-half">-</div>
      <div>{owners.map(Contact.getDisplayName).join(' - ')}</div>
    </>
  ) : null
}

const _AccountLine = ({ account, router, breakpoints: { isMobile } }) => {
  const { t } = useI18n()

  return (
    <Row
      nav
      key={account.id}
      onClick={() => router.push(`/settings/accounts/${account.id}`)}
    >
      <Cell main className={styles.AcnsStg__libelle}>
        <div className={styles.AcnsStg__libelleInner}>
          <div>{account.shortLabel || account.label}</div>
          {isMobile ? <AccountOwners account={account} /> : null}
        </div>
      </Cell>
      <Cell className={styles.AcnsStg__bank}>
        {getAccountInstitutionLabel(account)}
      </Cell>
      <Cell className={styles.AcnsStg__number}>{account.number}</Cell>
      <Cell className={styles.AcnsStg__type}>
        {t(`Data.accountTypes.${getAccountType(account)}`, {
          _: t('Data.accountTypes.Other')
        })}
      </Cell>
      <Cell className={styles.AcnsStg__owner}>
        {getAccountOwners(account)
          .map(Contact.getDisplayName)
          .join(' - ')}
      </Cell>
      <Cell className={styles.AcnsStg__actions} />
    </Row>
  )
}

const AccountLine = compose(
  translate(),
  withRouter,
  withBreakpoints()
)(_AccountLine)

const renderAccount = account => (
  <AccountLine account={account} key={account._id} />
)

const AccountsTable = ({ accounts }) => {
  const { t } = useI18n()

  return (
    <Table className={styles.AcnsStg__accounts}>
      <thead>
        <tr>
          <th className={styles.AcnsStg__libelle}>{t('Accounts.label')}</th>
          <th className={styles.AcnsStg__bank}>{t('Accounts.bank')}</th>
          <th className={styles.AcnsStg__number}>{t('Accounts.account')}</th>
          <th className={styles.AcnsStg__type}>{t('Accounts.type')}</th>
          <th className={styles.AcnsStg__owner}>{t('Accounts.owner')}</th>
          <th className={styles.AcnsStg__actions} />
        </tr>
      </thead>
      <tbody>{accounts.map(renderAccount)}</tbody>
    </Table>
  )
}

class AccountsSettings extends Component {
  render() {
    const { t, accountsCollection } = this.props

    if (
      isCollectionLoading(accountsCollection) &&
      !hasBeenLoaded(accountsCollection)
    ) {
      return <Loading />
    }

    const sortedAccounts = sortBy(accountsCollection.data, [
      'institutionLabel',
      'label'
    ])
    const accountBySharingDirection = groupBy(sortedAccounts, account => {
      return account.shared === undefined
    })

    const myAccounts = accountBySharingDirection[true]
    const sharedAccounts = accountBySharingDirection[false]

    return (
      <div>
        <AddAccountLink>
          <Button
            theme="text"
            icon={<Icon icon={plus} className="u-mr-half" />}
            label={t('Accounts.add_bank')}
          />
        </AddAccountLink>
        {myAccounts ? (
          <AccountsTable accounts={myAccounts} t={t} />
        ) : (
          <p>{t('Accounts.no-accounts')}</p>
        )}

        <h4>{t('Accounts.shared-accounts')}</h4>

        {sharedAccounts ? (
          <AccountsTable accounts={sharedAccounts} t={t} />
        ) : (
          <p>{t('Accounts.no-shared-accounts')}</p>
        )}
      </div>
    )
  }
}

// TODO reactivate when we understand how sharings work
// const fetchAccountsSharingInfo = props => {
//   return Promise.resolve([])
// const { accounts } = props
// with cozy-client
// return Promise.all(accounts.data.map(account => {
//   return props.dispatch(fetchSharingInfo(ACCOUNT_DOCTYPE, account._id))
// }))
// }

export default compose(
  queryConnect({
    accountsCollection: accountsConn,
    apps: { query: () => Q(APP_DOCTYPE), as: 'apps' }
  }),
  translate()
)(AccountsSettings)
