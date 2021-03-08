/* global __VERSIONS__ */

import React, { useState } from 'react'
import compose from 'lodash/flowRight'

import Checkbox from 'cozy-ui/transpiled/react/Checkbox'
import Button from 'cozy-ui/transpiled/react/Button'
import Alerter from 'cozy-ui/transpiled/react/Alerter'
import Stack from 'cozy-ui/transpiled/react/Stack'
import flag, { FlagSwitcher } from 'cozy-flags'
import { withClient, queryConnect } from 'cozy-client'
import { isMobileApp } from 'cozy-device-helper'

import { getNotificationToken } from 'ducks/client/utils'
import { pinSettingStorage, lastInteractionStorage } from 'ducks/pin/storage'
import { accountsConn } from 'doctypes'

import Typography from 'cozy-ui/transpiled/react/Typography'

const Versions = () => {
  const versions = typeof __VERSIONS__ !== 'undefined' ? __VERSIONS__ : {}
  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Library versions
      </Typography>
      {Object.entries(versions).map(([pkg, version]) => (
        <div key={pkg}>
          {pkg}: {version} -{' '}
          <img src={`https://img.shields.io/npm/v/${pkg}?style=flat-square}`} />
        </div>
      ))}
    </div>
  )
}

const startAndWaitService = async (client, serviceName) => {
  const jobs = client.collection('io.cozy.jobs')
  const { data: job } = await jobs.create('service', {
    name: serviceName,
    slug: flag('banking.banking-app-slug') || 'banks'
  })
  const finalJob = await jobs.waitFor(job.id)
  if (finalJob.state === 'errored') {
    Alerter.error(`Job finished with error. Error is ${finalJob.error}`)
  } else if (finalJob.state === 'done') {
    Alerter.success(`Job finished successfully`)
  } else {
    Alerter.error(`Job finished with state ${finalJob.state}`)
  }
  return finalJob
}

const ServiceButton = ({ name: serviceName, client }) => {
  const [running, setRunning] = useState(false)
  const startService = async () => {
    try {
      setRunning(true)
      await startAndWaitService(client, serviceName)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e)
      Alerter.error(`Something wrong happened, see console.`)
    } finally {
      setRunning(false)
    }
  }
  return (
    <Button
      busy={running}
      label={`Run ${serviceName} service`}
      onClick={() => startService(serviceName)}
    />
  )
}

const DeviceToken = ({ client }) => {
  const notificationToken = getNotificationToken(client)
  return (
    <>
      <Typography variant="h5">Device token</Typography>
      <p>
        {notificationToken
          ? notificationToken
          : '⚠️ Cannot receive notifications'}
      </p>
    </>
  )
}

class DumbDebugSettings extends React.PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      notificationRoute: '/balances/details'
    }
    this.onChangeNotificationRoute = this.onChangeNotificationRoute.bind(this)
    this.onChangeNotificationAccount = this.onChangeNotificationAccount.bind(
      this
    )
  }

  toggleNoAccount() {
    const noAccountValue = !flag('balance.no-account')

    flag('balance.no-account', noAccountValue)
    if (noAccountValue) {
      flag('banks.balance.account-loading', false)
    }
  }

  toggleAccountsLoading() {
    const accountLoadingValue = !flag('banks.balance.account-loading')

    flag('banks.balance.account-loading', accountLoadingValue)
    if (accountLoadingValue) {
      flag('balance.no-account', false)
    }
  }

  async sendNotification() {
    const { client } = this.props

    try {
      const { notificationAccountId } = this.state
      let { notificationRoute } = this.state
      if (notificationRoute === '/balances/details' && notificationAccountId) {
        notificationRoute = `/balances/${notificationAccountId}/details`
      }
      await client.stackClient.fetchJSON('POST', '/notifications', {
        data: {
          type: 'io.cozy.notifications',
          attributes: {
            category: 'transaction-greater',
            title: 'Test notification',
            message: `It should redirect to ${notificationRoute}`,
            preferred_channels: ['mobile', 'mail'],
            content: 'This is a test notification text content',
            content_html: 'This is a test notification HTML content',
            data: {
              route: notificationRoute
            }
          }
        }
      })

      Alerter.success('Notification sent')
    } catch (err) {
      Alerter.error('Failed to send notification: ' + err)
    }
  }

  onChangeNotificationRoute(ev) {
    this.setState({ notificationRoute: ev.target.value })
  }

  onChangeNotificationAccount(ev) {
    this.setState({ notificationAccountId: ev.target.value })
  }

  render() {
    const noAccountChecked = !!flag('balance.no-account')
    const accountLoadingChecked = !!flag('banks.balance.account-loading')

    const { client, accounts } = this.props

    return (
      <Stack spacing="xl">
        <div>
          <a href="#/recurrencedebug">Recurrence debug</a>
          <br />
          <a href="#/transfers">Transfers</a>
          <br />
          <a href="#/search">Search</a>
        </div>
        <div>
          <Typography variant="h4" gutterBottom>
            Misc
          </Typography>
          <Checkbox
            defaultChecked={noAccountChecked}
            label="Display no account page"
            onClick={this.toggleNoAccount}
          />
          <Checkbox
            defaultChecked={accountLoadingChecked}
            label="Display accounts loading"
            onClick={this.toggleAccountsLoading}
          />
        </div>
        <div>
          <Typography variant="h4" gutterBottom>
            Client info
          </Typography>
          <Typography variant="h5">URI</Typography>
          <p>{client.stackClient.uri}</p>
          {client.stackClient.oauthOptions ? (
            <>
              <Typography variant="h5">OAuth document id</Typography>
              <p>{client.stackClient.oauthOptions.clientID}</p>
            </>
          ) : null}
        </div>
        <div>
          <Typography variant="h4" gutterBottom>
            Notifications
          </Typography>
          {isMobileApp() ? <DeviceToken client={client} /> : null}
          Route:{' '}
          <select
            value={this.state.notificationRoute}
            onChange={this.onChangeNotificationRoute}
          >
            <option value="/balances/details">transactions</option>
            <option value="/balances">balance</option>
            <option value="/analysis/categories">categories</option>
            <option value="/analysis/recurrence">recurrence</option>
          </select>
          <br />
          {this.state.notificationRoute === '/balances/details' ? (
            <>
              Sur le compte
              <select
                value={this.state.notificationAccountId}
                onChange={this.onChangeNotificationAccount}
              >
                <option value="">-</option>
                {accounts.data &&
                  accounts.data.map(account => (
                    <option key={account._id} value={account._id}>
                      {account.label}
                    </option>
                  ))}
              </select>
              <br />
            </>
          ) : null}
          <Button
            label="Send notification"
            onClick={() => this.sendNotification()}
          />
        </div>
        <div>
          <Typography variant="h4" gutterBottom>
            Services
          </Typography>
          <ServiceButton client={client} name="autogroups" />
          <ServiceButton client={client} name="stats" />
          <ServiceButton client={client} name="categorization" />
          <ServiceButton client={client} name="onOperationOrBillCreate" />
          <ServiceButton client={client} name="budgetAlerts" />
        </div>
        <div>
          <Typography variant="h4" gutterBottom>
            Flags
          </Typography>
          <FlagSwitcher.List />
        </div>
        <div>
          <Typography variant="h4" gutterBottom>
            Pin
          </Typography>
          Setting doc cache
          <br />
          <pre>{JSON.stringify(pinSettingStorage.load(), null, 2)}</pre>
          Last interaction cache
          <br />
          <pre>{JSON.stringify(lastInteractionStorage.load(), null, 2)}</pre>
        </div>
        <Versions />
      </Stack>
    )
  }
}

const DebugSettings = compose(
  withClient,
  queryConnect({
    accounts: accountsConn
  })
)(DumbDebugSettings)
export default DebugSettings
