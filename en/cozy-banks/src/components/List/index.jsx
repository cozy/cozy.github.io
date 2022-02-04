import React from 'react'
import PropTypes from 'prop-types'
import styles from 'components/List/List.styl'
import UIRadio from 'cozy-ui/transpiled/react/Radios'
import cx from 'classnames'

export const Radio = ({ className, ...props }) => {
  return <UIRadio {...props} className={cx(styles.Radio, className)} />
}

const _List = props => {
  const { className, border, paper, ...rest } = props

  return (
    <div
      className={cx(
        {
          [styles['List--bordered']]: border === true,
          [styles['List--papered']]: paper === true,
          [styles['List--bordered-h']]: border === 'horizontal',
          [styles['List--bordered-v']]: border === 'vertical'
        },
        className
      )}
      {...rest}
    />
  )
}

export const List = React.memo(_List)

List.propTypes = {
  border: PropTypes.oneOf([true, 'horizontal', 'vertical']),
  paper: PropTypes.bool
}

const _Row = ({ className, onRef, ...rest }) => (
  <div ref={onRef} className={cx(styles['c-list-row'], className)} {...rest} />
)

export const Row = React.memo(_Row)
