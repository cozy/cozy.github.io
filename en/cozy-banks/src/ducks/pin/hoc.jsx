import PinGuard from 'ducks/pin/PinGuard'
import React from 'react'

const pinGuarded = pinGuardProps => Component => {
  const Wrapped = props => (
    <PinGuard {...pinGuardProps}>
      <Component {...props} />
    </PinGuard>
  )
  Wrapped.displayName = `PinGuarded(${Component.displayName})`
  return Wrapped
}

export default pinGuarded
