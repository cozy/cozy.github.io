import React, { PureComponent } from 'react'
import { isIOSApp, hasSafariPlugin } from '.'

export const withHasSafariPlugin = () => {
  return WrappedComponent => {
    return class withHasSafariPluginComponent extends PureComponent {
      state = {
        hasSafariPlugin: false
      }

      checkSafariPlugin = async () => {
        if (isIOSApp) {
          const checked = await hasSafariPlugin()
          this.setState({ hasSafariPlugin: checked })
        }
      }

      componentDidMount() {
        this.checkSafariPlugin()
      }

      render() {
        return <WrappedComponent {...this.props} {...this.state} />
      }
    }
  }
}

export default withHasSafariPlugin
