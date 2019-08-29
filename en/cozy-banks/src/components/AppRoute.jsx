import React from 'react'
import { IndexRoute, Route, Redirect } from 'react-router'
import App from 'components/App'
import { isWebApp } from 'cozy-device-helper'

import { TransactionsPageWithBackButton } from 'ducks/transactions'
import { ReimbursementsPage } from 'ducks/reimbursements'
import { CategoriesPage } from 'ducks/categories'
import {
  Settings,
  AccountSettings,
  AccountsSettings,
  GroupsSettings,
  GroupSettings,
  NewGroupSettings,
  Configuration,
  Debug
} from 'ducks/settings'
import { Balance } from 'ducks/balance'
import { TransferPage } from 'ducks/transfers'
import UserActionRequired from 'components/UserActionRequired'

// Use a function to delay instantation and have access to AppRoute.renderExtraRoutes
const AppRoute = () => (
  <Route component={UserActionRequired}>
    <Route component={App}>
      {isWebApp() && <Redirect from="/" to="balances" />}
      <Route path="balances">
        <IndexRoute component={Balance} />
        <Route path="reimbursements" component={ReimbursementsPage} />
        <Route path="details" component={TransactionsPageWithBackButton} />
      </Route>
      <Route path="categories">
        <IndexRoute component={CategoriesPage} />
        <Route
          path=":categoryName/:subcategoryName"
          component={TransactionsPageWithBackButton}
        />
        <Route path=":categoryName" component={CategoriesPage} />
      </Route>
      <Route path="settings">
        <Route path="groups/new" component={NewGroupSettings} />
        <Route path="groups/:groupId" component={GroupSettings} />
        <Route path="accounts/:accountId" component={AccountSettings} />
        <Route component={Settings}>
          <IndexRoute component={Configuration} />
          <Route path="accounts" component={AccountsSettings} />
          <Route path="groups" component={GroupsSettings} />
          <Route path="configuration" component={Configuration} />
          <Route path="debug" component={Debug} />
        </Route>
      </Route>
      <Route path="transfers" component={TransferPage} />
      <Route path="transfers/:slideName" component={TransferPage} />
      {AppRoute.renderExtraRoutes()}
      {isWebApp() && <Redirect from="*" to="balances" />}
    </Route>
  </Route>
)

// Ability to overrides easily
AppRoute.renderExtraRoutes = () => null

export default AppRoute
