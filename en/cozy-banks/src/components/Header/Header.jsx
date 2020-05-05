import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import styles from 'components/Header/Header.styl'
import CozyTheme from 'cozy-ui/transpiled/react/CozyTheme'

class Header extends React.PureComponent {
  render() {
    const { children, className, theme, fixed } = this.props

    return (
      <CozyTheme variant={theme}>
        <div
          className={cx(
            styles[`HeaderColor_${theme}`],
            { [styles.HeaderFixed]: fixed },
            className
          )}
        >
          {children}
        </div>
      </CozyTheme>
    )
  }
}

Header.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  theme: PropTypes.oneOf(['normal', 'inverted'])
}

Header.defaultProps = {
  theme: 'normal',
  fixed: false
}

export default Header
