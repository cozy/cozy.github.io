import React from 'react'
import cx from 'classnames'
import styles from './Sections.styl'
import Typography from 'cozy-ui/transpiled/react/Typography'

const SectionTitle = ({ children }) => (
  <Typography variant="h5" className="u-mb-half">
    {children}
  </Typography>
)

const SubSectionDescription = ({ children }) => (
  <Typography variant="body1" color="textSecondary">
    {children}
  </Typography>
)

export const SubSectionTitle = props => {
  return <Typography variant="h6" className="u-mb-half" {...props} />
}

export const Section = ({ title, description, children }) => (
  <div className={cx(styles.Section, 'u-stack-m')}>
    {title ? <SectionTitle>{title}</SectionTitle> : null}
    {description ? (
      <Typography variant="body1" color="textSecondary">
        {description}
      </Typography>
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
