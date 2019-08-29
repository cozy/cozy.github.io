import React from 'react'
import { Title } from 'cozy-ui/react/Text'
import styles from 'ducks/settings/TogglePane.styl'

class TogglePane extends React.PureComponent {
  render() {
    return <div className="u-pb-1-half">{this.props.children}</div>
  }
}

export class TogglePaneTitle extends React.PureComponent {
  render() {
    return (
      <Title className={styles.TogglePaneTitle}>{this.props.children}</Title>
    )
  }
}

export class TogglePaneSubtitle extends React.PureComponent {
  render() {
    return <h5 className={styles.TogglePaneSubtitle}>{this.props.children}</h5>
  }
}

export class TogglePaneText extends React.PureComponent {
  render() {
    return <p className="u-coolGrey">{this.props.children}</p>
  }
}

export default TogglePane
