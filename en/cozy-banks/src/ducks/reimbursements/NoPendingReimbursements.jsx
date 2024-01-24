import React from 'react'

import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'

import Padded from 'components/Padded'
import { getCategoryName } from 'ducks/categories/categoriesMap'
import Caption from 'ducks/reimbursements/Caption'

const NoPendingReimbursements = ({ period, doc }) => {
  const { t } = useI18n()

  const categoryName = doc.categoryId ? getCategoryName(doc.categoryId) : null
  const message = categoryName
    ? t(`Reimbursements.noPending.${categoryName}`, { period })
    : t('Reimbursements.noPending.generic', { period })

  return (
    <Padded className="u-pv-0">
      <Caption>{message}</Caption>
    </Padded>
  )
}

export default NoPendingReimbursements
