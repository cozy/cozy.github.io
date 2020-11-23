import { Document } from 'cozy-doctypes'
import head from 'lodash/head'
import { TRANSACTION_DOCTYPE } from 'doctypes'

class AppSuggestion extends Document {
  static fetchBySlug(slug) {
    return this.queryAll({ slug }).then(head)
  }

  static linkTransaction(suggestion, transaction) {
    const transactionRelationship = {
      _id: transaction._id,
      _type: TRANSACTION_DOCTYPE
    }

    // We slice 9 existing transactions because we want to store only 10 items
    // in the transactions relationship
    suggestion.relationships.transactions.data = [
      transactionRelationship,
      ...suggestion.relationships.transactions.data.slice(0, 9)
    ]
  }

  static init(slug, reasonCode) {
    return {
      slug,
      silenced: false,
      reason: {
        code: reasonCode
      },
      relationships: {
        transactions: {
          data: []
        }
      }
    }
  }
}

AppSuggestion.doctype = 'io.cozy.apps.suggestions'
AppSuggestion.idAttributes = ['slug']
AppSuggestion.createdByApp = 'banks'

export default AppSuggestion
