import React from 'react'
import cx from 'classnames'
import styles from 'components/Section/Section.styl'

const Section = props => {
  const { className, ...rest } = props

  return <section className={cx(styles.Section, className)} {...rest} />
}

export default Section
