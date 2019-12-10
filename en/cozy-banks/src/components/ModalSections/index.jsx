/**
 * Should be moved inside cozy-ui, see
 * https://github.com/cozy/cozy-ui/issues/1290
 */

import React from 'react'
import { ModalContent } from 'cozy-ui/transpiled/react'
import Row from 'components/Row'
import styles from './styles.styl'

export const ModalSection = ({ children, label }) => (
  <div>
    {label && (
      <ModalContent>
        <h5>{label}</h5>
      </ModalContent>
    )}
    {children}
  </div>
)

export const ModalSections = ({ children }) => {
  return <div className="u-stack-s">{children}</div>
}

export const ModalRow = props => <Row className={styles.ModalRow} {...props} />
