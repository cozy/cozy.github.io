import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import styles from 'components/Header/Header.styl'
import CozyTheme from 'cozy-ui/transpiled/react/providers/CozyTheme'

class Header extends React.PureComponent {
  render() {
    const { children, className, theme, fixed, paper, style } = this.props

    return (
      <CozyTheme variant={theme} ignoreItself={false}>
        <div
          role="header"
          className={cx(
            styles[`HeaderColor_${theme}`],
            {
              [styles['Header--fixed']]: fixed,
              [styles['Header--paper']]: paper
            },
            className
          )}
          style={style}
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
  fixed: false,
  paper: true
}

export default Header
