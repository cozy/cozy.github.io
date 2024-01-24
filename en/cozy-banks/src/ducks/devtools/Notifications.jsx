import React, { useState } from 'react'

import { useClient, useQuery } from 'cozy-client'
import Alerter from 'cozy-ui/transpiled/react/deprecated/Alerter'
import Typography from 'cozy-ui/transpiled/react/Typography'
import Button from 'cozy-ui/transpiled/react/deprecated/Button'
import { PanelContent } from 'cozy-client/dist/devtools'

import { accountsConn } from 'doctypes'

const sendNotification = async (
  client,
  originalNotificationRoute,
  notificationAccountId
) => {
  let notificationRoute = originalNotificationRoute
  try {
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
            appName: 'Banks',
            route: notificationRoute,
            redirectLink: `banks/#${notificationRoute}`
          }
        }
      }
    })

    Alerter.success('Notification sent')
  } catch (err) {
    Alerter.error('Failed to send notification: ' + err)
  }
}

const Notifications = () => {
  const client = useClient()
  const accounts = useQuery(accountsConn.query, accountsConn)
  const [notificationRoute, setNotificationRoute] =
    useState('/balances/details')
  const [notificationAccountId, setNotificationAccountId] = useState(null)

  return (
    <PanelContent>
      <Typography variant="subtitle1" gutterBottom>
        Notifications
      </Typography>
      <div>
        Route :{' '}
        <select
          value={notificationRoute}
          onChange={ev => setNotificationRoute(ev.target.value)}
        >
          <option value="/balances/details">transactions</option>
          <option value="/balances">balance</option>
          <option value="/analysis/categories">categories</option>
          <option value="/analysis/recurrence">recurrence</option>
          <option value="/settings/accounts">konnector alerts</option>
        </select>
      </div>
      {notificationRoute === '/balances/details' && (
        <div className="u-mt-half">
          Sur le compte :{' '}
          <select
            value={notificationAccountId}
            onChange={ev => setNotificationAccountId(ev.target.value)}
          >
            <option value="">-</option>
            {accounts.data &&
              accounts.data.map(account => (
                <option key={account._id} value={account._id}>
                  {account.label}
                </option>
              ))}
          </select>
        </div>
      )}
      <Button
        className="u-mt-1"
        label="Send notification"
        onClick={() =>
          sendNotification(client, notificationRoute, notificationAccountId)
        }
      />
    </PanelContent>
  )
}

export default Notifications
