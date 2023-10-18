import {
  findSuggestionForTransaction,
  normalizeSuggestions,
  findAppSuggestions
} from './services'
import { TRANSACTION_DOCTYPE } from '../../doctypes'
import { getBrands } from 'ducks/brandDictionary'
import { Document } from 'cozy-doctypes'
import CozyClient from 'cozy-client'
import fetch from 'node-fetch'
import brandsJSON from 'ducks/brandDictionary/brands'
import getClient from 'selectors/getClient'

jest.mock('selectors/getClient', () => jest.fn())
global.fetch = fetch

const client = new CozyClient({
  uri: 'http://localhost:8080'
})
Document.registerClient(client)

describe('findSuggestionForTransaction', () => {
  getClient.mockReturnValue({
    store: {
      getState: () => ({ brands: brandsJSON })
    }
  })
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

  it('should return null if no the app suggested has no konnectorSlug', async () => {
    const suggestion = await findSuggestionForTransaction(
      { _id: 'o1', label: 'spotify' },
      brands,
      []
    )
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

describe('findAppSuggestions', () => {
  it('should work with empty data', async () => {
    Document.fetchAll = jest.fn().mockResolvedValue([])
    Document.fetchChanges = jest.fn().mockResolvedValue({ documents: [] })
    await findAppSuggestions({}, brandsJSON)
  })
})
