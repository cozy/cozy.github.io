import React from 'react'
import { Title } from 'cozy-ui/transpiled/react/Text'
import cx from 'classnames'
import styles from './Sections.styl'

const SectionTitle = ({ children }) => (
  <Title className={styles.SectionTitle}>{children}</Title>
)

const SectionDescription = ({ children }) => (
  <div className={styles.SectionDescription}>{children}</div>
)

const SubSectionDescription = ({ children }) => (
  <div className={styles.SubSectionDescription}>{children}</div>
)

export const SubSectionTitle = props => {
  return <h5 {...props} styles={styles.SubSectionTitle} />
}

export const Section = ({ title, description, children }) => (
  <div className={cx(styles.Section, 'u-stack-m')}>
    {title ? <SectionTitle>{title}</SectionTitle> : null}
    {description ? (
      <SectionDescription>{description}</SectionDescription>
    ) : null}
    {children}
  </div>
)

export const SubSection = ({ children, title, description, className }) => (
  <div className={cx(styles.SubSection, className, 'u-stack-s')}>
    {title ? <SubSectionTitle>{title}</SubSectionTitle> : null}

    {description ? (
      <SubSectionDescription>{description}</SubSectionDescription>
    ) : null}
    {children}
  </div>
)
