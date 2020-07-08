import React, { Component } from 'react'
import { withRouter } from 'react-router'
import { sortBy, flowRight as compose } from 'lodash'
import { Query, withClient } from 'cozy-client'
import { translate, withBreakpoints } from 'cozy-ui/transpiled/react'
import Button from 'cozy-ui/transpiled/react/Button'
import Toggle from 'cozy-ui/transpiled/react/Toggle'
import Alerter from 'cozy-ui/transpiled/react/Alerter'
import { Media, Img } from 'cozy-ui/transpiled/react/Media'

import BarTheme from 'ducks/bar/BarTheme'
import { getAccountInstitutionLabel } from 'ducks/account/helpers'
import { GROUP_DOCTYPE, accountsConn } from 'doctypes'
import { getGroupLabel, renamedGroup } from 'ducks/groups/helpers'
import Loading from 'components/Loading'
import BackButton from 'components/BackButton'
import Table from 'components/Table'
import { PageTitle } from 'components/Title'
import { Padded } from 'components/Spacing'
import { logException } from 'lib/sentry'

import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import styles from 'ducks/settings/GroupsSettings.styl'

const makeNewGroup = (client, t) => {
  const obj = client.makeNewDocument('io.cozy.bank.groups')
  obj.label = t('Groups.new-group')
  return obj
}

export const AccountLine = props => {
  const { account, group, toggleAccount } = props

  return (
    <tr>
      <td className={styles.GrpStg__accntLabel}>
        {account.shortLabel || account.label}
      </td>
      <td className={styles.GrpStg__accntBank}>
        {getAccountInstitutionLabel(account)}
      </td>
      <td className={styles.GrpStg__accntNumber}>{account.number}</td>
      <td className={styles.GrpStg__accntToggle}>
        {group ? (
          <Toggle
            id={account._id}
            checked={group.accounts.existsById(account._id)}
            onToggle={toggleAccount.bind(null, account._id, group)}
          />
        ) : (
          <Toggle id={account._id} disabled />
        )}
      </td>
    </tr>
  )
}

const AccountsList = props => {
  const { t } = useI18n()
  const { accounts, group, toggleAccount } = props

  return (
    <Table className={styles.GrpStg__table}>
      <thead>
        <tr>
          <th className={styles.GrpStg__accntLabel}>{t('Groups.label')}</th>
          <th className={styles.GrpStg__accntBank}>{t('Groups.bank')}</th>
          <th className={styles.GrpStg__accntNumber}>
            {t('Groups.account-number')}
          </th>
          <th className={styles.GrpStg__accntToggle}>{t('Groups.included')}</th>
        </tr>
      </thead>
      <tbody>
        {accounts &&
          sortBy(accounts, ['institutionLabel', 'label']).map(account => (
            <AccountLine
              account={account}
              group={group}
              toggleAccount={toggleAccount}
              key={account._id}
            />
          ))}
      </tbody>
    </Table>
  )
}

const updateOrCreateGroup = async (client, group, router, successCallback) => {
  const isNew = !group.id
  try {
    const response = await client.save(group)
    if (response && response.data) {
      const doc = response.data
      if (isNew) {
        router.push(`/settings/groups/${doc.id}`)
      }
    }
  } finally {
    successCallback && successCallback()
  }
}

export class DumbGroupSettings extends Component {
  state = { modifying: false, saving: false }
  handleRename = () => {
    const label = this.inputRef.value
    this.rename(label)
  }

  rename(label) {
    this.setState({ saving: true })
    const { group } = this.props
    const updatedGroup = renamedGroup(group, label)
    return this.updateOrCreate(updatedGroup, () => {
      this.setState({ saving: false, modifying: false })
    })
  }

  async updateOrCreate(group, cb) {
    const { router, client } = this.props
    await updateOrCreateGroup(client, group, router, cb)
  }

  toggleAccount = async (accountId, group, enabled) => {
    const accounts = group.accounts
    if (enabled) {
      accounts.addById(accountId)
    } else {
      accounts.removeById(accountId)
    }
    this.updateOrCreate(group)
  }

  onRemove = async () => {
    const { group, router, client, t } = this.props

    try {
      await client.destroy(group)
      router.push('/settings/groups')
    } catch (err) {
      logException(err)
      Alerter.error(t('Groups.deletion_error'))
    }
  }

  modifyName = () => {
    this.setState({ modifying: true })
  }

  saveInputRef = ref => {
    this.inputRef = ref
  }

  render() {
    const {
      t,
      group,
      breakpoints: { isMobile }
    } = this.props
    const { modifying, saving } = this.state

    // When deleting the group, there's a re-render between the deletion and the redirection. So we need to handle this case
    if (!group) {
      return null
    }

    return (
      <Padded>
        {isMobile && <BackButton to="/settings/groups" arrow />}
        <PageTitle>
          {!isMobile && <BackButton to="/settings/groups" arrow />}
          {getGroupLabel(group, t)}
        </PageTitle>

        <h3>{t('Groups.label')}</h3>
        <form
          className={styles.GrpStg__form}
          onSubmit={e => e.preventDefault()}
        >
          <Media>
            <Img>
              {!modifying ? (
                getGroupLabel(group, t)
              ) : (
                <input
                  ref={this.saveInputRef}
                  autoFocus
                  type="text"
                  defaultValue={getGroupLabel(group, t)}
                />
              )}
            </Img>
            <Img>
              {modifying ? (
                <Button
                  className={styles['save-button']}
                  disabled={saving}
                  theme="regular"
                  onClick={this.handleRename}
                  label={t('Groups.save')}
                  busy={saving}
                />
              ) : (
                <Button
                  theme="text"
                  onClick={this.modifyName}
                  label={t('Groups.rename')}
                />
              )}
            </Img>
          </Media>
        </form>
        <h3>{t('Groups.accounts')}</h3>
        <Query query={accountsConn.query} as={accountsConn.as}>
          {({ data: accounts, fetchStatus }) => {
            if (fetchStatus === 'loading') {
              return <Loading />
            }

            return (
              <AccountsList
                accounts={accounts}
                group={group}
                toggleAccount={this.toggleAccount}
              />
            )
          }}
        </Query>
        <p>
          <Button
            theme="danger-outline"
            onClick={this.onRemove}
            label={t('Groups.delete')}
          />
        </p>
      </Padded>
    )
  }
}

export const GroupSettings = compose(
  translate(),
  withBreakpoints()
)(DumbGroupSettings)

const enhance = Component =>
  compose(
    withRouter,
    withClient
  )(Component)

const ExistingGroupSettings = enhance(props => (
  <Query query={client => client.get(GROUP_DOCTYPE, props.routeParams.groupId)}>
    {({ data: group, fetchStatus }) =>
      fetchStatus === 'loading' || fetchStatus === 'pending' ? (
        <>
          <BarTheme theme="primary" />
          <Loading />
        </>
      ) : (
        <>
          <BarTheme theme="primary" />
          <GroupSettings group={group} {...props} />
        </>
      )
    }
  </Query>
))

export default ExistingGroupSettings

/**
 * We create NewGroupSettings else react-router will reuse
 * the existing <GroupSettings /> when a new account is created and we navigate
 * to the new group settings. We could do something in componentDidUpdate
 * to refetch the group but it seems easier to do that to force the usage
 * of a brand new component
 */
export const NewGroupSettings = enhance(
  translate()(props => (
    <>
      <BarTheme theme="primary" />
      <GroupSettings {...props} group={makeNewGroup(props.client, props.t)} />
    </>
  ))
)
