import React from 'react'
import { omit } from 'lodash'

export const TransactionActionsContext = React.createContext()

export class DumbTransactionActionsProvider extends React.Component {
  render() {
    const value = omit(this.props, 'children')

    return (
      <TransactionActionsContext.Provider value={value}>
        {this.props.children}
      </TransactionActionsContext.Provider>
    )
  }
}
