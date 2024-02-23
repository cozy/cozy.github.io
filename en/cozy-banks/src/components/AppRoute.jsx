import React from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import * as Sentry from '@sentry/react'

import App from 'components/App'

import { CategoriesPage } from 'ducks/categories'
import {
  Settings,
  AccountsSettings,
  GroupsSettings,
  ExistingGroupSettings,
  NewGroupSettings,
  TagsSettings,
  Configuration
} from 'ducks/settings'
import { Balance, BalanceDetailsPage } from 'ducks/balance'
import {
  DebugRecurrencePage,
  RecurrencesPage,
  RecurrencePage
} from 'ducks/recurrence'
import { TransferPage } from 'ducks/transfers'
import { SearchPage } from 'ducks/search'
import { AnalysisPage } from 'ducks/analysis'
import ScrollToTopOnMountWrapper from 'components/scrollToTopOnMount'
import PlannedTransactionsPage from 'ducks/future/PlannedTransactionsPage'
import SetFilterAndRedirect from 'ducks/balance/SetFilterAndRedirect'
import TagPage from 'ducks/tags/TagPage'
import Export from 'ducks/settings/Export'
import Import from 'ducks/settings/Import/Import'
import HarvestRoutes from 'ducks/transactions/TransactionPageErrors/HarvestRoutes'

const OutletWrapper = ({ Component }) => (
  <>
    <Component />
    <Outlet />
  </>
)

const SentryRoutes = Sentry.withSentryReactRouterV6Routing(Routes)

// Use a function to delay instantation and have access to AppRoute methods
const AppRoute = () => {
  const { routes, condition } = AppRoute.renderExtraRoutesOnly()
  if (condition) {
    return <Routes>{routes}</Routes>
  }

  return (
    <SentryRoutes>
      <Route path="/" element={<App />}>
        <Route index element={<Navigate to="balances" replace />} />
        <Route path="balances">
          <Route
            index
            element={
              <ScrollToTopOnMountWrapper>
                <Balance />
              </ScrollToTopOnMountWrapper>
            }
          />
          <Route
            path="details"
            element={
              <ScrollToTopOnMountWrapper>
                <BalanceDetailsPage />
              </ScrollToTopOnMountWrapper>
            }
          >
            <Route
              path="harvest/:connectorSlug/*"
              element={<HarvestRoutes />}
            />
          </Route>
          <Route
            path="future"
            element={
              <ScrollToTopOnMountWrapper>
                <PlannedTransactionsPage />
              </ScrollToTopOnMountWrapper>
            }
          />
          <Route
            path=":accountOrGroupId/:page"
            element={<SetFilterAndRedirect />}
          />
        </Route>
        <Route
          path="categories/*"
          element={<Navigate to="../analysis/categories" replace />}
        ></Route>
        <Route
          path="recurrence/*"
          element={<Navigate to="../analysis/recurrence" replace />}
        ></Route>
        <Route
          path="analysis"
          element={
            <ScrollToTopOnMountWrapper>
              <AnalysisPage />
            </ScrollToTopOnMountWrapper>
          }
        >
          <Route path="categories">
            <Route
              index
              element={
                <ScrollToTopOnMountWrapper>
                  <CategoriesPage />
                </ScrollToTopOnMountWrapper>
              }
            />
            <Route
              path=":categoryName"
              element={
                <ScrollToTopOnMountWrapper>
                  <CategoriesPage />
                </ScrollToTopOnMountWrapper>
              }
            />
            <Route
              path=":categoryName/:subcategoryName"
              element={
                <ScrollToTopOnMountWrapper>
                  <CategoriesPage />
                </ScrollToTopOnMountWrapper>
              }
            />
          </Route>
          <Route path="recurrence">
            <Route
              index
              element={
                <ScrollToTopOnMountWrapper>
                  <RecurrencesPage />
                </ScrollToTopOnMountWrapper>
              }
            />
            <Route
              path=":bundleId"
              element={
                <ScrollToTopOnMountWrapper>
                  <RecurrencePage />
                </ScrollToTopOnMountWrapper>
              }
            />
          </Route>
        </Route>
        <Route path="settings">
          <Route
            path="import"
            element={<Navigate to="../configuration/import" replace />}
          />
          <Route
            path="configuration/export"
            element={<Navigate to="../export" replace />}
          />
          <Route path="export" element={<Export />} />
          <Route
            element={
              <ScrollToTopOnMountWrapper>
                <Settings />
              </ScrollToTopOnMountWrapper>
            }
          >
            <Route index element={<Configuration />} />
            <Route path="accounts" element={<AccountsSettings />} />
            <Route path="groups" element={<GroupsSettings />} />
            <Route path="tags" element={<TagsSettings />} />
            <Route
              path="configuration"
              element={<OutletWrapper Component={Configuration} />}
            >
              <Route path="import" element={<Import />} />
            </Route>
          </Route>
          <Route
            path="groups/new"
            element={
              <ScrollToTopOnMountWrapper>
                <NewGroupSettings />
              </ScrollToTopOnMountWrapper>
            }
          />
          <Route
            path="groups/:groupId"
            element={
              <ScrollToTopOnMountWrapper>
                <ExistingGroupSettings />
              </ScrollToTopOnMountWrapper>
            }
          />
          <Route
            path="accounts/:accountId"
            element={<Navigate to="../accounts" replace />}
          />
        </Route>
        <Route
          path="tag/:tagId"
          element={
            <ScrollToTopOnMountWrapper>
              <TagPage />
            </ScrollToTopOnMountWrapper>
          }
        />
        <Route
          path="transfers"
          element={
            <ScrollToTopOnMountWrapper>
              <TransferPage />
            </ScrollToTopOnMountWrapper>
          }
        />
        <Route
          path="search"
          element={
            <ScrollToTopOnMountWrapper>
              <SearchPage />
            </ScrollToTopOnMountWrapper>
          }
        />
        <Route
          path="search/:search"
          element={
            <ScrollToTopOnMountWrapper>
              <SearchPage />
            </ScrollToTopOnMountWrapper>
          }
        />
        <Route
          path="recurrencedebug"
          element={
            <ScrollToTopOnMountWrapper>
              <DebugRecurrencePage />
            </ScrollToTopOnMountWrapper>
          }
        />
        {AppRoute.renderExtraRoutes()}
        <Route path="*" element={<Navigate to="balances" replace />} />
      </Route>
    </SentryRoutes>
  )
}

// Ability to overrides easily
AppRoute.renderExtraRoutes = () => null
AppRoute.renderExtraRoutesOnly = () => ({ routes: [], conditon: false })

export default AppRoute
