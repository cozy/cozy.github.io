import React, { PureComponent } from 'react'
import { isIOSApp, hasSafariPlugin } from '.'

export const withHasSafariPlugin = () => {
  return (WrappedComponent: React.ElementType): typeof PureComponent => {
    return class withHasSafariPluginComponent extends PureComponent {
      state = {
        hasSafariPlugin: false
      }

      checkSafariPlugin = async (): Promise<void> => {
        if (isIOSApp) {
          const checked = await hasSafariPlugin()
          this.setState({ hasSafariPlugin: checked })
        }
      }

      componentDidMount(): void {
        void this.checkSafariPlugin()
      }

      render(): JSX.Element {
        return <WrappedComponent {...this.props} {...this.state} />
      }
    }
  }
}

export default withHasSafariPlugin
