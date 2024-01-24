/* global mount */

import React from 'react'

import pick from 'lodash/pick'
import mapValues from 'lodash/mapValues'
import { SyncTransactionActions } from './TransactionActions'
import { findMatchingActions } from 'ducks/transactions/actions'

import Chip from 'cozy-ui/transpiled/react/deprecated/Chip'
import AppLike from 'test/AppLike'
import data from 'test/fixtures'
import store, { normalizeData } from 'test/store'
import getClient from 'test/client'
import { getBrands } from 'ducks/brandDictionary'

jest.mock('ducks/brandDictionary', () => ({
  ...jest.requireActual('ducks/brandDictionary'),
  getBrands: jest.fn(() => require('ducks/brandDictionary/brands'))
}))

const brands = getBrands()

const brandInMaintenance = {
  name: 'Maintenance',
  regexp: '\\bmaintenance\\b',
  konnectorSlug: 'maintenance',
  maintenance: true
}

brands.push(brandInMaintenance)

jest.mock('cozy-ui/transpiled/react/Icon', () => {
  const OriginalIcon = jest.requireActual('cozy-ui/transpiled/react/Icon')
  const mockIcon = props => {
    const icon = props.icon
    return OriginalIcon.default.isProperIcon(icon) || icon.name ? (
      <span data-icon-id={icon.id || icon.name || icon} />
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
  ['paiementdocteur', null, 'Ameli+17,50€|Malakoff Mederic+7,50€', 'SvgFileOutline|SvgFileOutline', 'AttachedDocs'],
  ['paiementdocteur2', 'error', 'Late reimbursement', 'SvgHourglass', 'ReimbursementStatus'],
  ['depsantelou1', 'error', 'Late reimbursement', 'SvgHourglass', 'ReimbursementStatus'],
  ['depsantegene4', 'error', 'Late reimbursement', 'SvgHourglass', 'ReimbursementStatus'],
  ['depsanteisa2', 'error', 'Late reimbursement', 'SvgHourglass', 'ReimbursementStatus'],
  ['depsantecla3', 'error', 'Late reimbursement', 'SvgHourglass', 'ReimbursementStatus'],
  ['facturebouygues', null, 'Invoice', 'SvgFileOutline', 'AttachedDocs', {
    brands: brands.filter(x => x.name === 'Bouygues Telecom').map(b => ({ ...b, hasTrigger: true }))
  }],
  ['salaireisa1', null, 'Accéder à votre paie', 'SvgOpenwith', 'url'],
  ['fnac', null, 'Accéder au site Fnac', 'SvgOpenwith', 'url', {
    brands: brands.filter(x => x.name === 'FNAC TERNES').map(b => ({ ...b, hasTrigger: true }))
  }],
  ['edf', null, 'EDF', null, 'app'],
  ['remboursementcomplementaire', null, 'Invoice', null, 'AttachedDocs', {
    brands: brands.filter(x => x.name == 'Malakoff Mederic')
  }, 'remboursementcomplementaire konnector not installed'],
  ['remboursementcomplementaire', null, 'Invoice', null, 'AttachedDocs', {
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
      theme,
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
          expect(root.find(SyncTransactionActions).html()).toBe('')
        })
      }

      if (actionName) {
        it('should render the correct text', () => {
          root.update() // https://github.com/airbnb/enzyme/issues/1233#issuecomment-340017108
          const chips = root.find(Chip)
          const chipTexts = chips.map(node => node.text()).join('|')
          expect(chipTexts).toEqual(expect.stringContaining(text))
        })
      }

      if (icon) {
        it('should render the correct icon', () => {
          expect(
            root
              .find(`[data-icon-id]`)
              .map(node => node.props()['data-icon-id'])
              .join('|')
          ).toBe(icon)
        })
      }

      if (theme) {
        it('should render the correct chip theme', () => {
          const chip = root.find(Chip)
          expect(chip.props().theme).toBe(theme)
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
