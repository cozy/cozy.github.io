import React, { memo } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import styles from 'components/VerticalBox.styl'

const ContainerDumb = ({ children, className }) => (
  <div className={cx(styles.container, { [className]: className })}>
    {children}
  </div>
)

ContainerDumb.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
}

ContainerDumb.defaultProps = {
  className: undefined
}

export const Container = memo(ContainerDumb)

const ContentDumb = ({ children, top, center, bottom, className }) => (
  <div
    className={cx(styles.content, {
      [styles.top]: top,
      [styles.center]: center,
      [styles.bottom]: bottom,
      [className]: className
    })}
  >
    {children}
  </div>
)

ContentDumb.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  top: PropTypes.bool,
  center: PropTypes.bool,
  bottom: PropTypes.bool
}

ContentDumb.defaultProps = {
  className: undefined,
  top: false,
  center: false,
  bottom: false
}

export const Content = memo(ContentDumb)

const VerticalBoxDumb = ({ children, className, top, center, bottom }) => (
  <Container className={className}>
    <Content top={top} center={center} bottom={bottom}>
      {children}
    </Content>
  </Container>
)

VerticalBoxDumb.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  top: PropTypes.bool,
  center: PropTypes.bool,
  bottom: PropTypes.bool
}

VerticalBoxDumb.defaultProps = {
  className: undefined,
  top: false,
  center: false,
  bottom: false
}

export default memo(VerticalBoxDumb)
