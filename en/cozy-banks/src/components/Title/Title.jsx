import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import { MainTitle } from 'cozy-ui/transpiled/react/Text'
import styles from 'components/Title/Title.styl'

class Title extends React.PureComponent {
  render() {
    const { children, color, className } = this.props

    return (
      <MainTitle
        tag="h1"
        ellipsis={true}
        className={cx(styles.Title, styles[`TitleColor_${color}`], className)}
      >
        {children}
      </MainTitle>
    )
  }
}

Title.propTypes = {
  children: PropTypes.node.isRequired,
  color: PropTypes.oneOf(['default', 'primary'])
}

Title.defaultProps = {
  color: 'default'
}

export default Title
