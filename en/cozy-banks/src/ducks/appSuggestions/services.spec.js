import { findSuggestionForTransaction, normalizeSuggestions } from './services'
import { TRANSACTION_DOCTYPE } from '../../doctypes'
import { getBrands } from '../brandDictionary'

describe('findSuggestionForTransaction', () => {
  const brands = getBrands()
  const transaction = { _id: 'o1', label: 'boulanger' }

  it('should return a fresh io.cozy.apps.suggestions document', async () => {
    const suggestions = []
    const suggestion = await findSuggestionForTransaction(
      transaction,
      brands,
      suggestions
    )

    expect(suggestion).toMatchSnapshot()
  })

  it('should update an existing io.cozy.apps.suggestions document', async () => {
    const suggestions = [
      {
        slug: 'boulanger',
        silenced: false,
        reason: {
          code: 'FOUND_TRANSACTION'
        },
        relationships: {
          transactions: {
            data: [{ _id: 'o2', _type: TRANSACTION_DOCTYPE }]
          }
        }
      }
    ]

    const suggestion = await findSuggestionForTransaction(
      transaction,
      brands,
      suggestions
    )

    expect(suggestion).toMatchSnapshot()
  })

  it('should return null if no suggestion found', async () => {
    const suggestion = await findSuggestionForTransaction(transaction, [])

    expect(suggestion).toBe(null)
  })
})

describe('normalizeSuggestions', () => {
  it('should merge suggestions with the same slug', () => {
    const suggestions = [
      {
        slug: 'boulanger',
        relationships: {
          transactions: {
            data: [
              { _id: 'o1', _type: TRANSACTION_DOCTYPE },
              { _id: 'o2', _type: TRANSACTION_DOCTYPE }
            ]
          }
        }
      },
      {
        slug: 'boulanger',
        relationships: {
          transactions: {
            data: [
              { _id: 'o3', _type: TRANSACTION_DOCTYPE },
              { _id: 'o4', _type: TRANSACTION_DOCTYPE }
            ]
          }
        }
      },
      {
        slug: 'ovh',
        relationships: {
          transactions: {
            data: [{ _id: 'o5', _type: TRANSACTION_DOCTYPE }]
          }
        }
      }
    ]

    expect(normalizeSuggestions(suggestions)).toMatchSnapshot()
  })
})
