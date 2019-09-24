/* global mount */

import React from 'react'

import pick from 'lodash/pick'
import mapValues from 'lodash/mapValues'
import { SyncTransactionActions } from './TransactionActions'
import { findMatchingActions } from 'ducks/transactions/actions'

import brands from 'ducks/brandDictionary/brands'
import AppLike from 'test/AppLike'
import data from 'test/fixtures'
import store, { normalizeData } from 'test/store'
import getClient from 'test/client'

const brandInMaintenance = {
  name: 'Maintenance',
  regexp: '\\bmaintenance\\b',
  konnectorSlug: 'maintenance',
  maintenance: true
}

brands.push(brandInMaintenance)

jest.mock('cozy-ui/react/Icon', () => {
  const OriginalIcon = jest.requireActual('cozy-ui/react/Icon')
  const mockIcon = props => {
    const icon = props.icon
    return OriginalIcon.default.isProperIcon(icon) ? (
      <span data-icon-id={icon.id || icon} />
    ) : (
      icon
    )
  }
  mockIcon.propTypes = OriginalIcon.default.propTypes
  mockIcon.isProperIcon = OriginalIcon.default.isProperIcon
  mockIcon.iconPropType = OriginalIcon.iconPropType
  return mockIcon
})

/* eslint-disable */
const tests = [
  // transaction id, class variant, text, icon, action name, [action props], [test name]
  ['paiementdocteur', null, '2 reimbursements', 'file', 'HealthExpenseStatus'],
  ['paiementdocteur2', '.c-actionbtn--error', 'No reimbursement yet', 'hourglass', 'HealthExpenseStatus'],
  ['depsantelou1', '.c-actionbtn--error', 'No reimbursement yet', 'hourglass', 'HealthExpenseStatus'],
  ['depsantegene4', '.c-actionbtn--error', 'No reimbursement yet', 'hourglass', 'HealthExpenseStatus'],
  ['depsanteisa2', '.c-actionbtn--error', 'No reimbursement yet', 'hourglass', 'HealthExpenseStatus'],
  ['depsantecla3', '.c-actionbtn--error', 'No reimbursement yet', 'hourglass', 'HealthExpenseStatus'],
  ['facturebouygues', null, '1 invoice', 'file', 'bill', {
    brands: brands.filter(x => x.name === 'Bouygues Telecom').map(b => ({ ...b, hasTrigger: true }))
  }],
  ['salaireisa1', null, 'Accéder à votre paie', 'openwith', 'url'],
  ['fnac', null, 'Accéder au site Fnac', 'openwith', 'url'],
  ['edf', null, 'EDF', null, 'app'],
  ['remboursementcomplementaire', null, '1 invoice', null, 'bill', {
    brands: brands.filter(x => x.name == 'Malakoff Mederic')
  }, 'remboursementcomplementaire konnector not installed'],
  ['remboursementcomplementaire', null, '1 invoice', null, 'bill', {
    brands: brands.filter(x => x.name == 'Malakoff Mederic').map(b => ({ ...b, hasTrigger: true }))
  }, 'remboursementcomplementaire konnector installed'],
  ['normalshopping', null, 'toto', null],
  ['maintenance', null, null, null, null]
]
/* eslint-enable */

const actionProps = {
  urls: {
    COLLECT: 'collect',
    edf: 'edf-url://',
    maif: 'maifurl'
  },
  brands: brands
}

let client, transactionsById
beforeAll(() => {
  client = getClient()

  // the store is not a real one so we fake the getDocumentFromState
  const datastore = normalizeData(
    pick(
      data,
      'io.cozy.bank.operations',
      'io.cozy.bank.accounts',
      'io.cozy.bills'
    )
  )
  jest
    .spyOn(client, 'getDocumentFromState')
    .mockImplementation((doctype, id) => {
      return datastore[doctype][id]
    })
  transactionsById = mapValues(
    datastore['io.cozy.bank.operations'],
    transaction => client.hydrateDocument(transaction)
  )
})

describe('transaction action defaults', () => {
  for (let test of tests) {
    const [
      id,
      variant,
      text,
      icon,
      actionName,
      specificActionProps = {},
      extraName = ''
    ] = test
    describe(`${id} ${extraName}`, () => {
      let root, actions
      beforeAll(async () => {
        const transaction = transactionsById[test[0]]
        const mergedActionProps = { ...actionProps, ...specificActionProps }
        actions = await findMatchingActions(transaction, mergedActionProps)
        root = mount(
          <AppLike store={store}>
            <SyncTransactionActions
              onlyDefault
              transaction={transaction}
              actions={actions}
              actionProps={mergedActionProps}
            />
          </AppLike>
        )
      })

      if (actionName) {
        it('should render the correct action', () => {
          expect(actions.default).not.toBe(undefined)
          expect(actions.default.name).toBe(actionName)
        })
      } else {
        it('should not render an action', () => {
          expect(actions.default).toBe(undefined)
        })
      }

      if (actionName) {
        it('should render the correct text', () => {
          root.update() // https://github.com/airbnb/enzyme/issues/1233#issuecomment-340017108
          const btn = root.find('.c-actionbtn')
          const btnText = btn.text()
          expect(btnText).toEqual(expect.stringContaining(text))
        })
      }

      if (icon) {
        it('should render the correct icon', () => {
          expect(root.find(`[data-icon-id="${icon}"]`).length).toBe(1)
        })
      }

      if (variant) {
        it('should render the correct button', () => {
          expect(root.find(variant).length).toBe(1)
        })
      }
    })
  }
})

describe('transaction action menu', () => {
  for (let test of tests) {
    const [id, , , , , specificActionProps = {}, extraName = ''] = test
    it(`should render correctly ${id} ${extraName}`, async () => {
      const transaction = transactionsById[id]
      const mergedActionProps = { ...actionProps, ...specificActionProps }
      const actions = await findMatchingActions(transaction, mergedActionProps)
      const root = mount(
        <AppLike store={store}>
          <SyncTransactionActions
            transaction={transaction}
            actions={actions}
            actionProps={mergedActionProps}
          />
        </AppLike>
      )
      const texts = root.find('.TransactionAction').map(x => x.text())
      expect(texts).toMatchSnapshot()
    })
  }
})
