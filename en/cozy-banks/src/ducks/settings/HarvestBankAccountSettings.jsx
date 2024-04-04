import React, { useMemo } from 'react'

import { VaultUnlockProvider, VaultUnlockPlaceholder } from 'cozy-keys-lib'
import EditAccountModal from 'cozy-harvest-lib/dist/components/EditAccountModal'
import ConfigurationTab from 'cozy-harvest-lib/dist/components/KonnectorConfiguration/ConfigurationTab'
import HarvestVaultProvider from 'cozy-harvest-lib/dist/components/HarvestVaultProvider'

import { TrackingContext as HarvestTrackingContext } from 'cozy-harvest-lib/dist/components/hoc/tracking'

import { useTracker } from 'ducks/tracking/browser'
import HarvestAccountModal from 'ducks/settings/HarvestAccountModal'
import HarvestSwitch from 'ducks/settings/HarvestSwitch'
import { HarvestLoader } from 'ducks/settings/HarvestLoader'
import HarvestModal from './HarvestModal'

const makeTrackerForHarvest = tracker => {
  const trackPage = harvestPageName => {
    const pageName = `parametres:comptes:${harvestPageName}`
    tracker.trackPage(pageName)
  }
  const trackEvent = event => tracker.trackEvent(event)
  return { trackPage, trackEvent }
}

const HarvestTrackingProvider = ({ children }) => {
  const tracker = useTracker()
  const harvestTracker = useMemo(() => {
    return makeTrackerForHarvest(tracker)
  }, [tracker])

  return (
    <HarvestTrackingContext.Provider value={harvestTracker}>
      {children}
    </HarvestTrackingContext.Provider>
  )
}

/**
 * Shows a modal displaying the AccountModal from Harvest
 */
const HarvestBankAccountSettings = ({
  connectionId,
  onDismiss,
  intentsApi
}) => {
  return (
    <HarvestVaultProvider>
      <VaultUnlockProvider>
        <HarvestTrackingProvider>
          <HarvestModal onDismiss={onDismiss}>
            <HarvestSwitch
              initialFragment={`/accounts/${connectionId}`}
              routes={[
                [
                  '/accounts/:connectionId',
                  connectionId => (
                    <HarvestLoader connectionId={connectionId}>
                      {({ triggers, konnector, accountsAndTriggers }) => {
                        return (
                          <HarvestAccountModal
                            accountId={connectionId}
                            triggers={triggers}
                            intentsApi={intentsApi}
                            konnector={konnector}
                            accountsAndTriggers={accountsAndTriggers}
                            onDismiss={() => {
                              onDismiss()
                            }}
                            Component={ConfigurationTab}
                          />
                        )
                      }}
                    </HarvestLoader>
                  )
                ],
                ['/accounts', () => null],
                [
                  '/accounts/:connectionId/edit?reconnect',
                  connectionId => (
                    // TODO Avoid passing reconnect in props,
                    // prefer to use location instead.
                    <EditModal
                      connectionId={connectionId}
                      reconnect={true}
                      intentsApi={intentsApi}
                    />
                  )
                ],
                [
                  '/accounts/:connectionId/edit',
                  connectionId => (
                    <EditModal
                      connectionId={connectionId}
                      reconnect={false}
                      intentsApi={intentsApi}
                    />
                  )
                ]
              ]}
            />
          </HarvestModal>
        </HarvestTrackingProvider>
        <VaultUnlockPlaceholder />
      </VaultUnlockProvider>
    </HarvestVaultProvider>
  )
}

const EditModal = React.memo(({ reconnect, connectionId, intentsApi }) => {
  return (
    <HarvestLoader connectionId={connectionId}>
      {({ konnector, accountsAndTriggers }) => {
        return (
          <EditAccountModal
            konnector={konnector}
            intentsApi={intentsApi}
            accountId={connectionId}
            accounts={accountsAndTriggers}
            reconnect={reconnect}
          />
        )
      }}
    </HarvestLoader>
  )
})
EditModal.displayName = 'EditAccountModalBanks'

export default HarvestBankAccountSettings
