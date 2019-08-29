/* global __VERSIONS__ */

import React from 'react'
import Checkbox from 'cozy-ui/react/Checkbox'
import Button from 'cozy-ui/react/Button'
import Alerter from 'cozy-ui/react/Alerter'
import Stack from 'cozy-ui/react/Stack'
import { Title as UITitle, SubTitle } from 'cozy-ui/react/Text'
import flag, { FlagSwitcher } from 'cozy-flags'
import { withClient } from 'cozy-client'
import { isMobileApp } from 'cozy-device-helper'
import cx from 'classnames'
import { getRegistrationToken } from 'ducks/mobile/push'

const Title = ({ className, ...props }) => (
  <UITitle {...props} className={cx(className, 'u-mb-1')} />
)

const Versions = () => {
  const versions = typeof __VERSIONS__ !== 'undefined' ? __VERSIONS__ : {}
  return (
    <div>
      <Title>Library versions</Title>
      {Object.entries(versions).map(([pkg, version]) => (
        <div key={pkg}>
          {pkg}: {version} -{' '}
          <img src={`https://img.shields.io/npm/v/${pkg}?style=flat-square}`} />
        </div>
      ))}
    </div>
  )
}

class DumbDebugSettings extends React.PureComponent {
  toggleNoAccount() {
    const noAccountValue = !flag('no-account')

    flag('no-account', noAccountValue)
    if (noAccountValue) {
      flag('account-loading', false)
    }
  }

  toggleAccountsLoading() {
    const accountLoadingValue = !flag('account-loading')

    flag('account-loading', accountLoadingValue)
    if (accountLoadingValue) {
      flag('no-account', false)
    }
  }

  async sendNotification() {
    const { client } = this.props

    try {
      await client.stackClient.fetchJSON('POST', '/notifications', {
        data: {
          type: 'io.cozy.notifications',
          attributes: {
            category: 'transaction-greater',
            title: 'Test notification',
            message: 'This is a test notification message',
            preferred_channels: ['mail', 'mobile'],
            content: 'This is a test notification text content',
            content_html: 'This is a test notification HTML content'
          }
        }
      })

      Alerter.success('Notification sent')
    } catch (err) {
      Alerter.error('Failed to send notification: ' + err)
    }
  }

  render() {
    const noAccountChecked = !!flag('no-account')
    const accountLoadingChecked = !!flag('account-loading')

    const { client } = this.props

    return (
      <Stack spacing="xl">
        <div>
          <Title>Misc</Title>
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
          <Title>Client info</Title>
          <SubTitle>URI</SubTitle>
          <p>{this.props.client.stackClient.uri}</p>
          {client.stackClient.oauthOptions ? (
            <>
              <SubTitle>OAuth document id</SubTitle>
              <p>{client.stackClient.oauthOptions.clientID}</p>
            </>
          ) : null}
        </div>
        <div>
          <Title>Notifications</Title>
          {isMobileApp() ? (
            <>
              <SubTitle>Device token</SubTitle>
              <p>{getRegistrationToken(client)}</p>
            </>
          ) : null}
          <Button
            label="Send notification"
            onClick={() => this.sendNotification()}
          />
        </div>
        <div>
          <Title>Flags</Title>
          <FlagSwitcher.List />
        </div>
        <Versions />
      </Stack>
    )
  }
}

const DebugSettings = withClient(DumbDebugSettings)
export default DebugSettings
