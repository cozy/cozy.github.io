import React, { useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import PropTypes from 'prop-types'

import Figure from 'cozy-ui/transpiled/react/Figure'

import { TRANSACTION_DOCTYPE } from 'doctypes'
import { getCurrencySymbol } from 'utils/currencySymbol'
import {
  useTrackPage,
  trackParentPage,
  trackPage,
  replaceLastPart
} from 'ducks/tracking/browser'
import useDocument from 'components/useDocument'
import RawContentDialog from 'components/RawContentDialog'
import TransactionModalInfoContent from 'ducks/transactions/TransactionModal/TransactionModalInfoContent'
import { useDisableEnforceFocusModal } from 'ducks/context/DisableEnforceFocusModalContext'

const TransactionModal = ({ requestClose, transactionId, ...props }) => {
  const transaction = useDocument(TRANSACTION_DOCTYPE, transactionId)
  const location = useLocation()
  const { disableEnforceFocus } = useDisableEnforceFocusModal()

  useTrackPage(lastTracked => {
    // We cannot simply add ":depense" to the last tracked page because
    // we need to limit the number of segments to 3 of the hit. This is
    // why when coming from the balances page, we change the page to
    // mon_compte:depense and when coming from the category details page, we
    // replace the :details portion by :depense by splitting & slicing.
    if (lastTracked == 'mon_compte:compte') {
      return 'mon_compte:depense'
    } else {
      return replaceLastPart(lastTracked, 'depense')
    }
  })

  const handleClose = useCallback(
    ev => {
      if (location.pathname.startsWith('/balances/details')) {
        trackPage('mon_compte:compte')
      } else if (location.pathname.startsWith('/analysis/categories')) {
        trackPage(lastTracked => replaceLastPart(lastTracked, 'details'))
      } else {
        trackParentPage()
      }
      ev.preventDefault()
      requestClose()
    },
    [location, requestClose]
  )

  if (!transaction) {
    return null // transaction is being deleted
  }

  return (
    <RawContentDialog
      size="medium"
      open
      onClose={handleClose}
      disableEnforceFocus={disableEnforceFocus}
      title={
        <div className="u-ta-center">
          <Figure
            total={transaction.amount}
            symbol={getCurrencySymbol(transaction.currency)}
            signed
          />
        </div>
      }
      content={
        <TransactionModalInfoContent
          {...props}
          transactionId={transactionId}
          requestClose={handleClose}
        />
      }
    />
  )
}

TransactionModal.propTypes = {
  requestClose: PropTypes.func.isRequired,
  transactionId: PropTypes.string.isRequired
}

export default TransactionModal
