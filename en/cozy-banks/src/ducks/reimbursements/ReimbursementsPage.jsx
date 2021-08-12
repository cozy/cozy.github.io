import React, { useMemo } from 'react'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'
import Header from 'components/Header'
import Padded from 'components/Padded'
import { PageTitle } from 'components/Title'
import cx from 'classnames'
import BackButton from 'components/BackButton'
import { ConnectedSelectDates } from 'components/SelectDates'
import Reimbursements from 'ducks/reimbursements/Reimbursements'
import styles from 'ducks/reimbursements/ReimbursementsPage.styl'
import useFilteringDoc from 'ducks/filters/useFilteringDoc'
import { getCategoryName } from 'ducks/categories/categoriesMap'
import { GROUP_DOCTYPE } from 'doctypes'
import {
  subMonths,
  format,
  endOfDay,
  differenceInCalendarMonths
} from 'date-fns'

const getTitleTranslationKey = doc => {
  const base = 'Reimbursements.title'
  let lastPart

  if (doc._type === GROUP_DOCTYPE) {
    lastPart = 'group'
  } else if (doc.categoryId) {
    lastPart = getCategoryName(doc.categoryId)
  } else {
    lastPart = 'othersExpenses'
  }

  const key = [base, lastPart].join('.')

  return key
}

const Title = ({ doc }) => {
  const { t } = useI18n()
  const translationKey = getTitleTranslationKey(doc)
  return <PageTitle>{t(translationKey)}</PageTitle>
}

const start2016 = new Date(2015, 11, 31)

const getDefaultOptions = () => {
  const options = []
  const now = endOfDay(new Date())

  for (let i = 0; i < differenceInCalendarMonths(now, start2016); i++) {
    const month = format(subMonths(now, i), 'YYYY-MM')
    options.push({
      yearMonth: month
    })
  }

  return options
}

const ReimbursementsPage = () => {
  const { isMobile } = useBreakpoints()
  const filteringDoc = useFilteringDoc()
  const options = useMemo(() => getDefaultOptions(), [])

  return (
    <>
      <Header theme="inverted" fixed>
        <Padded
          className={cx({
            'u-ph-half': isMobile,
            'u-pv-0': isMobile,
            'u-pb-half': isMobile
          })}
        >
          <div className={styles.ReimbursementsPage__title}>
            <BackButton theme="primary" arrow />
            <Title doc={filteringDoc} />
          </div>
          <ConnectedSelectDates
            showFullYear
            color="primary"
            options={options}
          />
        </Padded>
      </Header>
      <Reimbursements />
    </>
  )
}

export default ReimbursementsPage
