/* global __DEVELOPMENT__ */

import React from 'react'
import PropTypes from 'prop-types'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Chip from 'cozy-ui/transpiled/react/deprecated/Chip'
import flag from 'cozy-flags'
import FileOpener from 'ducks/transactions/FileOpener'
import FileIcon from 'ducks/transactions/actions/AttachedDocsAction/FileIcon'
import Figure from 'cozy-ui/transpiled/react/Figure'
import { AugmentedModalOpener, isAugmentedModalBill } from 'ducks/demo'
import { getBrands } from 'ducks/brandDictionary'

const getChipLabel = (t, vendorName) => {
  return vendorName
    ? t('Transactions.actions.attachedDocs.billWithVendor', {
        vendorName: vendorName
      })
    : t('Transactions.actions.attachedDocs.billWithoutVendor')
}

const getInvoiceId = bill => {
  if (!bill.invoice) {
    if (__DEVELOPMENT__) {
      console.warn('Bill without invoice', bill) // eslint-disable-line no-console
    }
    throw new Error('Bill without invoice')
  }

  const [doctype, id] = bill.invoice.split(':')

  if (!doctype || !id) {
    throw new Error('Invoice is malformed. invoice: ' + bill.invoice)
  }

  return [doctype, id]
}

const BillChip = props => {
  const { t } = useI18n()
  const { bill, transaction } = props
  const brands = getBrands()
  // Bill's vendor can be a slug. We get the brand from our dictionary to be
  // sure that we show the brand name and not a konnector slug
  const brand = brands.find(
    brand =>
      brand.name === bill.vendor ||
      (brand.konnectorSlug && brand.konnectorSlug === bill.vendor)
  )

  let invoiceId
  try {
    invoiceId = getInvoiceId(bill)[1]
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(err)
    return null
  }

  const shouldUseAugmentedModal = flag('demo') && isAugmentedModalBill(bill)
  const Wrapper = shouldUseAugmentedModal ? AugmentedModalOpener : FileOpener
  const vendorName = brand && brand.name

  if (flag('hide.healthTheme.enabled') && brand.health) {
    return null
  }

  return (
    <Wrapper fileId={invoiceId} key={invoiceId} transaction={transaction}>
      <Chip component="button" size="small" variant="outlined">
        <FileIcon
          color={bill.isRefund ? 'var(--successColor)' : undefined}
          className="u-flex-shrink-0"
        />
        {bill.isRefund ? (
          <>
            {vendorName && (
              <span className="u-success u-mr-half">{vendorName}</span>
            )}
            <Figure total={bill.amount} coloredPositive signed symbol="€" />
          </>
        ) : (
          getChipLabel(t, vendorName)
        )}
      </Chip>
    </Wrapper>
  )
}

BillChip.propTypes = {
  bill: PropTypes.object.isRequired
}

export default BillChip
