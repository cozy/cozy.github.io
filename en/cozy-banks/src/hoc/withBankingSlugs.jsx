import React from 'react'
import useBankingSlug from 'hooks/useBankingSlugs'

/**
 * @function
 * @description HOC to banking slugs and banking slugs functions
 *
 * @param  {Component} WrappedComponent - wrapped component
 * @returns {Function} - Component that will receive banking slugs and function as props
 */
const withBankingSlugs = WrappedComponent => {
  const Wrapped = props => {
    const { bankingSlugs, isBankTrigger, isBankKonnector } = useBankingSlug()
    return (
      <WrappedComponent
        {...props}
        bankingSlugs={bankingSlugs}
        isBankTrigger={isBankTrigger}
        isBankKonnector={isBankKonnector}
      />
    )
  }
  Wrapped.displayName = `withBankingSlugs(${
    WrappedComponent.displayName || WrappedComponent.name
  })`
  return Wrapped
}

export default withBankingSlugs
