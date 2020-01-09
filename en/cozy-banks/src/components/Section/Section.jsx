import React from 'react'
import cx from 'classnames'
import { Title as BaseTitle } from 'cozy-ui/transpiled/react/Text'
import styles from 'components/Section/Section.styl'
import { Padded } from 'components/Spacing'

const SectionTitle = props => {
  const { className, children, ...rest } = props

  return (
    <BaseTitle className={cx(styles.SectionTitle, className)} {...rest}>
      <Padded className="u-pv-0">{children}</Padded>
    </BaseTitle>
  )
}

const Section = props => {
  const { className, title, children, ...rest } = props

  return (
    <section className={cx(styles.Section, className)} {...rest}>
      {title && <SectionTitle>{title}</SectionTitle>}
      {children}
    </section>
  )
}

export default Section
