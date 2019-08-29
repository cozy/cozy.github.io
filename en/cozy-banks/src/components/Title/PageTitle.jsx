import React from 'react'
import PropTypes from 'prop-types'
import Topbar from 'components/Topbar'
import Title from 'components/Title/Title'

class PageTitle extends React.PureComponent {
  render() {
    const { children, color } = this.props

    return (
      <Topbar>
        <Title color={color}>{children}</Title>
      </Topbar>
    )
  }
}

PageTitle.propTypes = {
  children: PropTypes.node.isRequired,
  color: PropTypes.oneOf(['default', 'primary'])
}

Title.defaultProps = {
  color: 'default'
}

export default PageTitle
