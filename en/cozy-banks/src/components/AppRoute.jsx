import React from 'react'
import { IndexRoute, Route, Redirect } from 'react-router'
import App from 'components/App'
import { isWebApp } from 'cozy-device-helper'
import flag from 'cozy-flags'

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
import UserActionRequired from 'components/UserActionRequired'
import scrollToTopOnMount from 'components/scrollToTopOnMount'
import PlannedTransactionsPage from 'ducks/future/PlannedTransactionsPage'
import SetFilterAndRedirect from 'ducks/balance/SetFilterAndRedirect'
import TagPage from 'ducks/tags/TagPage'

// Use a function to delay instantation and have access to AppRoute.renderExtraRoutes
const AppRoute = () => (
  <Route component={UserActionRequired}>
    <Route component={App}>
      {isWebApp() && <Redirect from="/" to="balances" />}
      <Route path="balances">
        <IndexRoute component={scrollToTopOnMount(Balance)} />
        <Route
          path="details"
          component={scrollToTopOnMount(BalanceDetailsPage)}
        />
        <Route
          path="future"
          component={scrollToTopOnMount(PlannedTransactionsPage)}
        />
        <Route
          path=":accountOrGroupId/:page"
          component={SetFilterAndRedirect}
        />
      </Route>
      <Route path="categories">
        <Redirect from="*" to="analysis/categories" />
      </Route>
      <Route path="recurrence">
        <Redirect from="*" to="analysis/recurrence" />
      </Route>
      <Route path="analysis" component={scrollToTopOnMount(AnalysisPage)}>
        <Route path="categories">
          <IndexRoute component={scrollToTopOnMount(CategoriesPage)} />
          <Route
            path=":categoryName/:subcategoryName"
            component={scrollToTopOnMount(CategoriesPage)}
          />
          <Route
            path=":categoryName"
            component={scrollToTopOnMount(CategoriesPage)}
          />
        </Route>
        <Route path="recurrence">
          <IndexRoute component={scrollToTopOnMount(RecurrencesPage)} />
          <Route
            path=":bundleId"
            component={scrollToTopOnMount(RecurrencePage)}
          />
        </Route>
      </Route>
      <Route path="settings">
        <Route
          path="groups/new"
          component={scrollToTopOnMount(NewGroupSettings)}
        />
        <Route
          path="groups/:groupId"
          component={scrollToTopOnMount(ExistingGroupSettings)}
        />

        <Redirect from="accounts/:accountId" to="accounts" />
        <Route component={scrollToTopOnMount(Settings)}>
          <IndexRoute component={Configuration} />
          <Route path="accounts" component={AccountsSettings} />
          <Route path="groups" component={GroupsSettings} />
          {flag('banks.tags.enabled') && (
            <Route path="tags" component={TagsSettings} />
          )}
          <Route path="configuration" component={Configuration} />
        </Route>
      </Route>
      {flag('banks.tags.enabled') && (
        <Route path="tag/:tagId" component={scrollToTopOnMount(TagPage)} />
      )}
      <Route path="transfers" component={scrollToTopOnMount(TransferPage)} />
      <Route path="search" component={scrollToTopOnMount(SearchPage)} />
      <Route path="search/:search" component={scrollToTopOnMount(SearchPage)} />
      <Route
        path="recurrencedebug"
        component={scrollToTopOnMount(DebugRecurrencePage)}
      />
      {AppRoute.renderExtraRoutes()}
      {isWebApp() && <Redirect from="*" to="balances" />}
    </Route>
  </Route>
)

// Ability to overrides easily
AppRoute.renderExtraRoutes = () => null

export default AppRoute
