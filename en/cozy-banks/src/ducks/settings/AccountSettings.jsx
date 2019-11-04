import React, { Component } from 'react'
import { withRouter } from 'react-router'
import { translate, withBreakpoints } from 'cozy-ui/react'
import Button from 'cozy-ui/react/Button'
import { Tabs, TabPanels, TabPanel, TabList, Tab } from 'cozy-ui/react/Tabs'
import Modal from 'cozy-ui/react/Modal'
import Icon from 'cozy-ui/react/Icon'
import Alerter from 'cozy-ui/react/Alerter'
import Loading from 'components/Loading'
import { withDispatch } from 'utils'
import BackButton from 'components/BackButton'
import { PageTitle } from 'components/Title'
import { connect } from 'react-redux'
import styles from 'ducks/settings/AccountsSettings.styl'
import { flowRight as compose } from 'lodash'
import { destroyAccount } from 'actions'
import spinner from 'assets/icons/icon-spinner.svg'
import {
  getAccountInstitutionLabel,
  getAccountType
} from 'ducks/account/helpers'
import { getHomeURL } from 'ducks/apps/selectors'
import { Query } from 'cozy-client'
import { queryConnect, withClient } from 'cozy-client'
import { ACCOUNT_DOCTYPE, APP_DOCTYPE } from 'doctypes'
import { Padded } from 'components/Spacing'
import { logException } from 'lib/sentry'
import withFilters from 'components/withFilters'

const DeleteConfirm = ({
  cancel,
  confirm,
  title,
  description,
  secondaryText,
  primaryText
}) => {
  return (
    <Modal
      title={title}
      description={<div dangerouslySetInnerHTML={{ __html: description }} />}
      secondaryType="secondary"
      secondaryText={secondaryText}
      secondaryAction={cancel}
      dismissAction={cancel}
      primaryType="danger"
      primaryText={primaryText}
      primaryAction={confirm}
    />
  )
}

class _GeneralSettings extends Component {
  state = { modifying: false }

  onClickModify = () => {
    const { account } = this.props
    this.setState({
      modifying: true,
      changes: {
        shortLabel: account.shortLabel || account.label
      }
    })
  }

  onClickSave = async () => {
    const { client } = this.props
    const updatedDoc = {
      // Will disappear when the object come from redux-cozy
      id: this.props.account._id,
      type: ACCOUNT_DOCTYPE,
      ...this.props.account,
      ...this.state.changes
    }
    try {
      await client.save(updatedDoc)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Could not update document', e)
    } finally {
      this.setState({ modifying: false, changes: null })
    }
  }

  onClickDelete = () => {
    this.setState({ showingDeleteConfirmation: true })
  }

  onClickCancelDelete = () => {
    this.setState({ showingDeleteConfirmation: false })
  }

  onClickConfirmDelete = async () => {
    const { client, router, t, account, filteringDoc } = this.props
    try {
      this.setState({ deleting: true })
      // TODO remove from groups and delete operations, see actions/accounts.js
      await client.destroy(account)

      if (filteringDoc && account._id === filteringDoc._id) {
        this.props.resetFilterByDoc()
      }

      router.push('/settings/accounts')
    } catch (e) {
      logException(e)
      Alerter.error(t('AccountSettings.deletion_error'))
      this.setState({ deleting: false })
    }
  }

  onInputChange = (attribute, ev) => {
    const changes = this.state.changes
    changes[attribute] = ev.target.value
    this.setState({ changes })
  }

  render() {
    const { t, account, collectUrl, homeUrl } = this.props
    const { modifying, deleting, showingDeleteConfirmation } = this.state

    const url = homeUrl ? homeUrl : collectUrl
    const name = homeUrl ? 'Cozy Home' : 'Cozy Collect'

    const confirmPrimaryText = t('AccountSettings.confirm-deletion.description')
      .replace('#{LINK}', url ? `<a href="${url}" target="_blank">` : '')
      .replace('#{/LINK}', url ? '</a>' : '')
      .replace('#{APP_NAME}', name)

    return (
      <div>
        <table className={styles.AcnStg__info}>
          <tbody>
            <tr>
              <td>{t('AccountDetails.label')}</td>
              <td>
                {!modifying && (account.shortLabel || account.label)}
                {modifying && (
                  <input
                    value={this.state.changes.shortLabel}
                    onChange={this.onInputChange.bind(null, 'shortLabel')}
                  />
                )}
              </td>
            </tr>
            <tr>
              <td>{t('AccountDetails.institutionLabel')}</td>
              <td>{getAccountInstitutionLabel(account)}</td>
            </tr>
            <tr>
              <td>{t('AccountDetails.number')}</td>
              <td>{account.number}</td>
            </tr>
            <tr>
              <td>{t('AccountDetails.type')}</td>
              <td>
                {t(`Data.accountTypes.${getAccountType(account)}`, {
                  _: t('Data.accountTypes.Other')
                })}
              </td>
            </tr>
          </tbody>
        </table>
        <div>
          {!modifying && (
            <Button
              theme="regular"
              onClick={this.onClickModify}
              label={t('AccountSettings.update')}
            />
          )}
          {modifying && (
            <Button
              theme="regular"
              onClick={this.onClickSave}
              label={t('AccountSettings.save')}
            />
          )}

          {account.shared === undefined ? (
            <Button
              disabled={deleting}
              theme="danger-outline"
              onClick={this.onClickDelete}
              label={
                deleting
                  ? t('AccountSettings.deleting')
                  : t('AccountSettings.delete')
              }
            />
          ) : null}
          {showingDeleteConfirmation ? (
            <DeleteConfirm
              title={t('AccountSettings.confirm-deletion.title')}
              description={confirmPrimaryText}
              primaryText={
                deleting ? (
                  <Icon icon={spinner} className="u-spin" color="white" />
                ) : (
                  t('AccountSettings.confirm-deletion.confirm')
                )
              }
              secondaryText={t('General.cancel')}
              confirm={this.onClickConfirmDelete}
              cancel={this.onClickCancelDelete}
            />
          ) : null}
        </div>
      </div>
    )
  }
}

const mapDispatchToProps = dispatch => ({
  destroyAccount: account => {
    return dispatch(destroyAccount(account))
  }
})

const mapStateToProps = state => ({
  homeUrl: getHomeURL(state)
})

const GeneralSettings = compose(
  withRouter,
  queryConnect({
    apps: { query: client => client.all(APP_DOCTYPE), as: 'apps' }
  }),
  withClient,
  withDispatch,
  connect(
    mapStateToProps,
    mapDispatchToProps
  ),
  translate(),
  withFilters
)(_GeneralSettings)

const AccountSettings = function({
  routeParams,
  t,
  breakpoints: { isMobile }
}) {
  return (
    <Query query={client => client.get(ACCOUNT_DOCTYPE, routeParams.accountId)}>
      {({ data, fetchStatus }) => {
        if (fetchStatus === 'loading') {
          return <Loading />
        }

        // When deleting the account, there's a re-render between the deletion and the redirection. So we need to handle this case
        if (!data) {
          return null
        }

        const account = data

        return (
          <Padded>
            {isMobile && <BackButton to="/settings/accounts" arrow />}
            <PageTitle>
              {!isMobile && <BackButton to="/settings/accounts" arrow />}
              {account.shortLabel || account.label}
            </PageTitle>
            <Tabs className={styles.AcnStg__tabs} initialActiveTab="details">
              <TabList className={styles.AcnStg__tabList}>
                <Tab className={styles.AcnStg__tab} name="details">
                  {t('AccountSettings.details')}
                </Tab>
                <Tab className={styles.AcnStg__tab} name="sharing">
                  {t('AccountSettings.sharing')}
                </Tab>
              </TabList>
              <TabPanels>
                <TabPanel name="details">
                  <GeneralSettings account={account} />
                </TabPanel>
                <TabPanel name="sharing">
                  <div>{t('ComingSoon.title')}</div>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Padded>
        )
      }}
    </Query>
  )
}

export default compose(
  withDispatch,
  translate(),
  withBreakpoints()
)(AccountSettings)
