import React, { useMemo } from 'react'

import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'

import { GROUP_DOCTYPE } from 'doctypes'
import Padded from 'components/Padded'
import StoreLink from 'components/StoreLink'
import { KonnectorChip } from 'components/KonnectorChip'
import { getCategoryName } from 'ducks/categories/categoriesMap'
import Caption from 'ducks/reimbursements/Caption'

export const makeMessage = ({ doc, categoryName, t }) => {
  let message

  if (doc._type === GROUP_DOCTYPE) {
    message = t('Reimbursements.noReimbursed.group')
  } else if (categoryName) {
    message = t(`Reimbursements.noReimbursed.${categoryName}`)
  } else {
    message = t('Reimbursements.noReimbursed.generic')
  }

  return message
}

const NoReimbursedExpenses = ({ hasHealthBrands, doc }) => {
  const { t } = useI18n()

  const categoryName = useMemo(
    () => (doc.categoryId ? getCategoryName(doc.categoryId) : null),
    [doc.categoryId]
  )

  const message = useMemo(
    () => makeMessage({ doc, categoryName, t }),
    [categoryName, doc, t]
  )

  return (
    <Padded className="u-pv-0">
      <Caption>{message}</Caption>
      {!hasHealthBrands && categoryName === 'healthExpenses' && (
        <StoreLink type="konnector" category="insurance">
          <KonnectorChip konnectorType="health" />
        </StoreLink>
      )}
    </Padded>
  )
}

export default NoReimbursedExpenses
