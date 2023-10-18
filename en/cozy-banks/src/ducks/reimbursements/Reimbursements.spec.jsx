import React from 'react'
import { DumbReimbursements } from './Reimbursements'
import fixtures from 'test/fixtures/unit-tests.json'
import AppLike from 'test/AppLike'
import format from 'date-fns/format'
import { createMockClient } from 'cozy-client'
import { render } from '@testing-library/react'
import { getCategoryIdFromName } from 'ducks/categories/helpers'
import { getT, enLocaleOption } from 'utils/lang'
import brands from 'ducks/brandDictionary/brands'
import getClient from 'selectors/getClient'

jest.mock('selectors/getClient', () => jest.fn())

// Mock useVisible so that it considers all element as visible in the
// viewport (IntersectionObserver not available during tests)
jest.mock('hooks/useVisible', () => () => [null, true])

// Needed to prevent unwanted updates (async component)
// Otherwise we have an error "Warning: An update to StoreLink inside a test was not wrapped in act"
jest.mock('hooks/useRedirectionURL', () => {
  return () => ['https://cozy.tools:8080', () => {}]
})

describe('Reimbursements', () => {
  getClient.mockReturnValue({
    store: {
      getState: () => ({ brands })
    }
  })
  const baseProps = {
    fetchStatus: 'loaded',
    t: getT(enLocaleOption),
    f: format,
    triggers: { fetchStatus: 'loaded' },
    transactions: { fetchStatus: 'loaded' },
    groupedExpenses: {},
    addFilterByPeriod: jest.fn(),
    brands: [],
    currentPeriod: '2020-01'
  }

  const client = createMockClient({})
  client.intents = {
    getRedirectionURL: jest
      .fn()
      .mockResolvedValue('http://store.cozy.tools:8080')
  }

  it('should show a loading if the transactions are loading', () => {
    const props = {
      ...baseProps,
      transactions: { fetchStatus: 'loading' }
    }

    const { getByText } = render(
      <AppLike client={client}>
        <DumbReimbursements {...props} />
      </AppLike>
    )

    expect(getByText(/loading/i)).toBeDefined()
  })

  it('should show a loading if the brands are loading', () => {
    const props = {
      ...baseProps,
      triggers: { fetchStatus: 'loading' }
    }

    const { getByText } = render(
      <AppLike client={client}>
        <DumbReimbursements {...props} />
      </AppLike>
    )

    expect(getByText(/loading/i)).toBeDefined()
  })

  describe('when viewing a reimbursements account', () => {
    it('should show the pending reimbursements', () => {
      const pending = fixtures['io.cozy.bank.operations'].filter(
        transaction => transaction._id === 'paiementdocteur2'
      )

      const props = {
        ...baseProps,
        groupedExpenses: {
          pending
        },
        filteringDoc: {
          categoryId: getCategoryIdFromName('healthExpenses')
        }
      }

      const { getByText } = render(
        <AppLike client={client}>
          <DumbReimbursements {...props} />
        </AppLike>
      )

      expect(getByText(pending[0].label)).toBeDefined()
    })

    it('should show the reimbursed transactions', () => {
      const reimbursed = fixtures['io.cozy.bank.operations'].filter(
        transaction => transaction._id === 'paiementdocteur'
      )

      const props = {
        ...baseProps,
        groupedExpenses: {
          reimbursed
        },
        filteringDoc: {
          categoryId: getCategoryIdFromName('healthExpenses')
        }
      }

      const { getByText } = render(
        <AppLike client={client}>
          <DumbReimbursements {...props} />
        </AppLike>
      )

      expect(getByText(reimbursed[0].label)).toBeDefined()
    })
  })

  describe('when viewing health reimbursements account', () => {
    const reimbursementsProps = {
      ...baseProps,
      filteringDoc: {
        categoryId: getCategoryIdFromName('healthExpenses')
      }
    }

    describe('when there is no pending reimbursement', () => {
      it('should show a message indicating there is no pending reimbursement', () => {
        const { getByText } = render(
          <AppLike client={client}>
            <DumbReimbursements {...reimbursementsProps} />
          </AppLike>
        )

        expect(
          getByText(
            'No awaiting reimbursement for health expenses in January 2020'
          )
        ).toBeDefined()
      })
    })

    describe('when there is no reimbursed transactions', () => {
      it('should show a message indicating there is no reimbursed transaction', () => {
        const { getByText } = render(
          <AppLike client={client}>
            <DumbReimbursements {...reimbursementsProps} />
          </AppLike>
        )

        expect(
          getByText(
            'Automatically detect your health reimbursements by connecting your health insurance to your Cozy.'
          )
        ).toBeDefined()
      })

      describe('when there is no health brand with trigger', () => {
        it('should show a « my reimbursements » button redirecting to the store', () => {
          const { getByText } = render(
            <AppLike client={client}>
              <DumbReimbursements {...reimbursementsProps} />
            </AppLike>
          )

          expect(getByText('My reimbursements')).toBeDefined()
        })
      })
    })
  })

  describe('when viewing professional expenses reimbursements account', () => {
    const reimbursementsProps = {
      ...baseProps,
      filteringDoc: {
        categoryId: getCategoryIdFromName('professionalExpenses')
      }
    }

    describe('when there is no pending reimbursement', () => {
      it('should show a message indicating there is no pending reimbursement', () => {
        const { getByText } = render(
          <AppLike client={client}>
            <DumbReimbursements {...reimbursementsProps} />
          </AppLike>
        )

        expect(
          getByText(
            'No awaiting reimbursement for professional expenses in January 2020'
          )
        ).toBeDefined()
      })
    })

    describe('when there is no reimbursed transactions', () => {
      it('should show a message indicating there is no reimbursed transaction', () => {
        const { getByText } = render(
          <AppLike client={client}>
            <DumbReimbursements {...reimbursementsProps} />
          </AppLike>
        )

        expect(
          getByText(
            'Categorize some expenses to « professional expense » to follow their reimbursements'
          )
        ).toBeDefined()
      })
    })
  })

  describe('when viewing others expenses reimbursements account', () => {
    const reimbursementsProps = {
      ...baseProps,
      filteringDoc: {}
    }

    describe('when there is no pending reimbursement', () => {
      it('should show a message indicating there is no pending reimbursement', () => {
        const { getByText } = render(
          <AppLike client={client}>
            <DumbReimbursements {...reimbursementsProps} />
          </AppLike>
        )

        expect(
          getByText('No awaiting reimbursement for expenses in January 2020')
        ).toBeDefined()
      })
    })

    describe('when there is no reimbursed transactions', () => {
      it('should show a message indicating there is no reimbursed transaction', () => {
        const { getByText } = render(
          <AppLike client={client}>
            <DumbReimbursements {...reimbursementsProps} />
          </AppLike>
        )

        expect(
          getByText(
            'Manually add some pending reimbursements on expenses to follow their reimbursements'
          )
        ).toBeDefined()
      })
    })
  })

  describe('when viewing the reimbursements group', () => {
    const props = {
      ...baseProps,
      filteringDoc: {
        _type: 'io.cozy.bank.groups'
      }
    }

    describe('when there is no pending reimbursement', () => {
      it('should show a message indicating there is no pending reimbursement', () => {
        const { getByText } = render(
          <AppLike client={client}>
            <DumbReimbursements {...props} />
          </AppLike>
        )

        expect(
          getByText('No awaiting reimbursement for expenses in January 2020')
        ).toBeDefined()
      })
    })

    describe('when there is no reimbursed transactions', () => {
      it('should show a message indicating there is no reimbursed transaction', () => {
        const { getByText } = render(
          <AppLike client={client}>
            <DumbReimbursements {...props} />
          </AppLike>
        )

        expect(
          getByText(
            'Manually add an awaiting reimbursement on expenses to follow their reimbursement, or categorize it with "out of budget / professional expenses" or "health expenses" to have an automatic tracking'
          )
        ).toBeDefined()
      })
    })
  })
})
