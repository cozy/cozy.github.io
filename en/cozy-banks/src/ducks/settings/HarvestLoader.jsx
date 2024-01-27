import React from 'react'
import CozyClient, { isQueryLoading, Q, Query } from 'cozy-client'

import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Spinner from 'cozy-ui/transpiled/react/Spinner'

import {
  COZY_ACCOUNT_DOCTYPE,
  konnectorTriggersConn,
  KONNECTOR_DOCTYPE
} from 'doctypes'

const HarvestSpinner = () => {
  return (
    <div className="u-m-2 u-ta-center">
      <Spinner size="xxlarge" />
    </div>
  )
}

const HarvestError = () => {
  const { t } = useI18n()
  return <div className="u-m-2 u-error">{t('Loading.error')}</div>
}

const fetchPolicy = CozyClient.fetchPolicies.olderThan(30 * 1000)

/**
 * Data fetching component that fetches data necessary to render Harvest
 * components related to a particular connection.
 */
const HarvestLoader = ({ connectionId, children }) => {
  return (
    <Query
      query={() => Q(COZY_ACCOUNT_DOCTYPE).getById(connectionId)}
      as={`accounts/${connectionId}`}
      fetchPolicy={fetchPolicy}
    >
      {accountCol => {
        const { data: account, fetchStatus, lastUpdate } = accountCol
        // Can happen for a short while when the account is deleted
        if (!account) {
          return null
        }
        if (isQueryLoading(accountCol) && !lastUpdate) {
          return <HarvestSpinner />
        } else if (fetchStatus === 'error') {
          return <HarvestError />
        } else {
          const konnectorSlug = account.account_type
          return (
            <Query
              query={Q(KONNECTOR_DOCTYPE).getById(
                `${KONNECTOR_DOCTYPE}/${konnectorSlug}`
              )}
              as={`konnectors/${connectionId}`}
              fetchPolicy={fetchPolicy}
            >
              {konnectorKol => {
                const { data, fetchStatus, lastUpdate } = konnectorKol
                if (isQueryLoading(konnectorKol) && !lastUpdate) {
                  return <HarvestSpinner />
                }

                if (fetchStatus === 'error') {
                  return <HarvestError />
                }

                const { attributes: konnector } = data

                // We do not query directly the triggers for the connection as
                // we need to use the /jobs/triggers route. This route is only
                // used by cozy-client when all triggers are fetched
                // Related issue : https://github.com/cozy/cozy-client/issues/767
                return (
                  <Query
                    query={konnectorTriggersConn.query}
                    as={konnectorTriggersConn.as}
                    fetchPolicy={konnectorTriggersConn.fetchPolicy}
                  >
                    {triggerCol => {
                      const {
                        data: allTriggers,
                        fetchStatus,
                        lastUpdate
                      } = triggerCol
                      const triggers = allTriggers.filter(trigger => {
                        return (
                          trigger.message &&
                          trigger.message.account === account._id
                        )
                      })
                      if (isQueryLoading(triggerCol) && !lastUpdate) {
                        return <HarvestSpinner />
                      } else if (fetchStatus === 'error') {
                        return <HarvestError />
                      } else {
                        const accountsAndTriggers = [account]
                          .map(account => ({
                            account,
                            trigger: triggers[0]
                          }))
                          .filter(x => x.trigger)
                        return children({
                          triggers,
                          konnector,
                          accountsAndTriggers
                        })
                      }
                    }}
                  </Query>
                )
              }}
            </Query>
          )
        }
      }}
    </Query>
  )
}

export { HarvestLoader }
