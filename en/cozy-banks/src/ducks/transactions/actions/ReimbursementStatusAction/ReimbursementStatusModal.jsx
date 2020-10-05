import React, { memo } from 'react'
import cx from 'classnames'

import flag from 'cozy-flags'

import Modal, { ModalContent } from 'cozy-ui/transpiled/react/Modal'
import Icon from 'cozy-ui/transpiled/react/Icon'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import { Title, Text } from 'cozy-ui/transpiled/react/Text'

import { List, Row, Radio } from 'components/List'
import { useParams } from 'components/RouterContext'
import { useTrackPage } from 'ducks/tracking/browser'
import iconReimbursement from 'assets/icons/icon-reimbursement-detailed.svg'
import styles from 'ducks/transactions/actions/ReimbursementStatusAction/ReimbursementStatusModal.styl'
import { getReimbursementStatus, getLabel } from 'ducks/transactions/helpers'
import { isHealthExpense } from 'ducks/categories/helpers'
import ContactItem from 'ducks/transactions/actions/ReimbursementStatusAction/ContactItem'

const ReimbursementStatusModal = memo(function ReimbursementStatusModal(props) {
  const { isMobile } = useBreakpoints()
  const { t } = useI18n()
  const { transaction, onChange, className, brands, ...rest } = props
  const choices = ['pending', 'reimbursed', 'no-reimbursement']
  const status = getReimbursementStatus(transaction)

  const showContacts =
    flag('reimbursements-contacts') && isHealthExpense(transaction)

  const { categoryName, subcategoryName } = useParams()

  useTrackPage(
    categoryName && subcategoryName
      ? `analyse:${categoryName}:depense-remboursement`
      : `mon_compte:depense:remboursement`
  )

  return (
    <Modal
      mobileFullscreen
      className={cx('u-flex', 'u-flex-column', className)}
      {...rest}
    >
      <ModalContent className="u-ph-0">
        <header className="u-ta-center">
          <Icon icon={iconReimbursement} size={56} color="var(--slateGrey)" />
          <Title className="u-mt-1">
            {t('Transactions.actions.reimbursementStatus.modal.title')}
          </Title>
          <Text className={styles.ReimbursementStatusModal__transactionLabel}>
            {getLabel(transaction)}
          </Text>
        </header>
        <form className="u-mt-1">
          <List border="vertical">
            {choices.map(choice => (
              <Row key={choice}>
                <Radio
                  key={choice}
                  name="reimbursementStatus"
                  value={choice}
                  label={t(`Transactions.reimbursementStatus.${choice}`)}
                  checked={status === choice}
                  onChange={onChange}
                  className={cx('u-mb-0', styles.Radio)}
                />
              </Row>
            ))}
          </List>
        </form>
        {showContacts ? (
          <div
            className={cx(styles.ReimbursementStatusModal__contact, 'u-pt-2', {
              'u-mt-auto': isMobile
            })}
          >
            {brands
              .filter(
                brand => brand.health && brand.hasTrigger && brand.contact
              )
              .map((brand, index) => (
                <ContactItem
                  brand={brand}
                  key={brand.name}
                  // TODO use stack layout when https://github.com/cozy/cozy-banks/pull/1312 has been merged (see https://github.com/cozy/cozy-banks/pull/1312/commits/2bc1d75a25fe2c61f219579ac56407e356997105 more particularly)
                  className={cx({
                    'u-mt-1-half': index !== 0
                  })}
                />
              ))}
          </div>
        ) : null}
      </ModalContent>
    </Modal>
  )
})

export default ReimbursementStatusModal
