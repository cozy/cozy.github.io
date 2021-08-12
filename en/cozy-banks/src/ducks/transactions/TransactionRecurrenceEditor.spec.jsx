import keyBy from 'lodash/keyBy'
import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { mount } from 'enzyme'

import { createMockClient } from 'cozy-client/dist/mock'
import { findOptions } from 'cozy-ui/transpiled/react/NestedSelect/testing'

import AppLike from 'test/AppLike'
import fixtures from 'test/fixtures/unit-tests.json'
import {
  schema,
  TRANSACTION_DOCTYPE,
  RECURRENCE_DOCTYPE,
  ACCOUNT_DOCTYPE
} from 'doctypes'

import TransactionRecurrenceEditor, {
  makeOptionFromRecurrence
} from './TransactionRecurrenceEditor'
import { getT, enLocaleOption } from 'utils/lang'

describe('makeOptionFromRecurrence', () => {
  it('should work', () => {
    const accountsById = keyBy(fixtures[ACCOUNT_DOCTYPE], x => x._id)
    const t = getT(enLocaleOption)
    const option = makeOptionFromRecurrence(
      fixtures[RECURRENCE_DOCTYPE][0],
      t,
      accountsById
    )
    expect(option.description).toEqual(
      'every month · 3870.54€ · Compte courant Isabelle'
    )
  })
})

describe('transaction recurrence editor', () => {
  const setup = ({ renderFn }) => {
    const client = createMockClient({
      queries: {
        transactions: {
          doctype: TRANSACTION_DOCTYPE,
          data: fixtures[TRANSACTION_DOCTYPE]
        },
        recurrence: {
          doctype: RECURRENCE_DOCTYPE,
          data: fixtures[RECURRENCE_DOCTYPE]
        },
        accounts: {
          doctype: ACCOUNT_DOCTYPE,
          data: fixtures[ACCOUNT_DOCTYPE]
        }
      },
      clientOptions: {
        schema
      }
    })
    client.ensureStore()
    const onSelect = jest.fn()

    const transaction = client.hydrateDocument(
      client.getDocumentFromState(TRANSACTION_DOCTYPE, 'salaireisa1')
    )

    const root = renderFn(
      <AppLike client={client}>
        <TransactionRecurrenceEditor
          transaction={transaction}
          onSelect={onSelect}
        />
      </AppLike>
    )

    return { root }
  }

  it('should correctly render', () => {
    const { root } = setup({ renderFn: mount })
    const options = findOptions(root)
    const optionTexts = options.map(option => option.text())
    expect(optionTexts[0]).toContain('Occasional transaction')
    expect(optionTexts[1]).toContain('Recurrent transaction')
    expect(optionTexts[1]).toContain('Salaire')
    const recurrentOption = options.at(1)
    const recurrentOptionProps = recurrentOption.props()
    expect(recurrentOptionProps.isSelected).toBe(true)
  })

  it('should sort recurrences', () => {
    const { root } = setup({ renderFn: render })
    const recurrentItem = root.getByText('Recurrent transaction')
    fireEvent.click(recurrentItem)
    const buttons = root.getAllByRole('button')
    const texts = buttons.map(btn => btn.textContent)
    expect(texts).toEqual([
      expect.stringContaining('New recurrence'),
      expect.stringContaining('A recurrence that should be listed first'),
      expect.stringContaining('Salaire'),
      expect.stringContaining('Salaire')
    ])
  })
})
