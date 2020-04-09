/* global __DEVELOPMENT__ */

import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'cozy-ui/transpiled/react'
import Chip from 'cozy-ui/transpiled/react/Chip'
import flag from 'cozy-flags'
import FileOpener from 'ducks/transactions/FileOpener'
import FileIcon from 'ducks/transactions/actions/AttachedDocsAction/FileIcon'
import { Figure } from 'components/Figure'
import { AugmentedModalOpener, isAugmentedModalBill } from 'ducks/demo'
import { getBrands } from 'ducks/brandDictionary'

export class DumbBillChip extends React.PureComponent {
  static propTypes = {
    bill: PropTypes.object.isRequired
  }

  getInvoiceId(bill) {
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

  getChipLabel(vendorName) {
    const { t } = this.props

    return vendorName
      ? t('Transactions.actions.attachedDocs.billWithVendor', {
          vendorName: vendorName
        })
      : t('Transactions.actions.attachedDocs.billWithoutVendor')
  }

  render() {
    const { bill, transaction } = this.props

    let invoiceId

    try {
      invoiceId = this.getInvoiceId(bill)[1]
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(err)
      return null
    }

    const shouldUseAugmentedModal = flag('demo') && isAugmentedModalBill(bill)

    const Wrapper = shouldUseAugmentedModal ? AugmentedModalOpener : FileOpener

    // Bill's vendor can be a slug. We get the brand from our dictionary to be
    // sure that we show the brand name and not a konnector slug
    const [brand] = getBrands(
      brand => brand.name === bill.vendor || brand.konnectorSlug === bill.vendor
    )
    const vendorName = brand && brand.name

    return (
      <Wrapper fileId={invoiceId} key={invoiceId} transaction={transaction}>
        <Chip component="button" size="small" variant="outlined">
          <FileIcon
            color={bill.isRefund ? 'var(--emerald)' : undefined}
            className="u-flex-shrink-0"
          />
          {bill.isRefund ? (
            <>
              {vendorName && (
                <span className="u-valid u-mr-half">{vendorName}</span>
              )}
              <Figure total={bill.amount} coloredPositive signed symbol="€" />
            </>
          ) : (
            this.getChipLabel(vendorName)
          )}
        </Chip>
      </Wrapper>
    )
  }
}

const BillChip = translate()(DumbBillChip)

export default BillChip
