import React from 'react'
import cx from 'classnames'
import Typography from 'cozy-ui/transpiled/react/Typography'
import styles from 'components/Section/Section.styl'
import Padded from 'components/Padded'

export const SectionTitle = props => {
  const { className, children, ...rest } = props

  return (
    <Padded className="u-pv-0">
      <Typography
        variant="h5"
        gutterBottom
        className={cx('u-pt-half', className)}
        {...rest}
      >
        {children}
      </Typography>
    </Padded>
  )
}

const Section = props => {
  const { className, children, ...rest } = props

  return (
    <section className={cx(styles.Section, className)} {...rest}>
      {children}
    </section>
  )
}

export default Section
