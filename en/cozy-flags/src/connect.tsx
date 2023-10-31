import { IMicroEE } from 'microee'
import React, { ComponentType, ReactNode } from 'react'

import flag from './flag'

/**
 * The store has been enhanced at this point with the MicroEE mixin.
 * We need to cast it to the IMicroEE interface to be able to use the methods.
 * This is a bit hacky, the long term solution would be to properly type the store.
 */
const store = flag.store as unknown as IMicroEE

/**
 * Connects a component to the flags. The wrapped component
 * will be refreshed when a flag changes.
 */
const connect = <P extends object>(Component: ComponentType<P>): ReactNode => {
  class Wrapped extends React.Component<P> {
    static displayName: string

    componentDidMount(): void {
      store.on('change', this.handleChange)
    }

    componentWillUnmount(): void {
      store.removeListener('change', this.handleChange)
    }

    handleChange = (): void => {
      this.forceUpdate()
    }

    render(): ReactNode {
      return <Component {...this.props} />
    }
  }

  Wrapped.displayName = `withFlags(${Component.displayName ?? Component.name})`

  return Wrapped
}

export default connect
