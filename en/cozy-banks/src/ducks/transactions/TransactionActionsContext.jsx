import React, { createContext } from 'react'
import omit from 'lodash/omit'
import { getBrands } from 'ducks/brandDictionary'

export const TransactionActionsContext = createContext()

export const DumbTransactionActionsProvider = props => {
  const propsWithoutChildren = omit(props, 'children')
  const brands = getBrands()

  const value = Object.assign({}, propsWithoutChildren, { brands })

  return (
    <TransactionActionsContext.Provider value={value}>
      {props.children}
    </TransactionActionsContext.Provider>
  )
}
