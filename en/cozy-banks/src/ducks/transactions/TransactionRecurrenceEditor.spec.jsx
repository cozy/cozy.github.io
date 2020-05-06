import React from 'react'
import { mount } from 'enzyme'
import TransactionRecurrenceEditor from './TransactionRecurrenceEditor'
import AppLike from 'test/AppLike'
import { createMockClient } from 'cozy-client/dist/mock'
import fixtures from 'test/fixtures/unit-tests.json'
import { schema, TRANSACTION_DOCTYPE, RECURRENCE_DOCTYPE } from 'doctypes'
import Radio from 'cozy-ui/transpiled/react/Radio'
import { findOptions } from 'cozy-ui/transpiled/react/NestedSelect/testing'

describe('transaction recurrence editor', () => {
  const setup = () => {
    const client = createMockClient({
      queries: {
        transactions: {
          doctype: TRANSACTION_DOCTYPE,
          data: fixtures[TRANSACTION_DOCTYPE]
        },
        recurrence: {
          doctype: RECURRENCE_DOCTYPE,
          data: fixtures[RECURRENCE_DOCTYPE]
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

    const root = mount(
      <AppLike client={client}>
        <TransactionRecurrenceEditor
          transaction={transaction}
          onSelect={onSelect}
        />
      </AppLike>
    )

    return { root, mount }
  }

  it('should correctly render', () => {
    const { root } = setup()
    const options = findOptions(root)
    const optionTexts = options.map(option => option.text())
    expect(optionTexts[0]).toContain('Occasional transaction')
    expect(optionTexts[1]).toContain('Recurrent transaction')
    expect(optionTexts[1]).toContain('Salaire')
    expect(
      options
        .at(1)
        .find(Radio)
        .props().checked
    ).toBe(true)
  })
})
