import React from 'react'
import { connect } from 'react-redux'
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
import { getCategoryName } from 'ducks/categories/categoriesMap'
import { GROUP_DOCTYPE } from 'doctypes'

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

const RawReimbursementsPage = props => {
  const { isMobile } = useBreakpoints()
  const { filteringDoc } = props

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
          <ConnectedSelectDates showFullYear color="primary" />
        </Padded>
      </Header>
      <Reimbursements />
    </>
  )
}

function mapStateToProps(state) {
  return {
    filteringDoc: state.filters.filteringDoc
  }
}

const ReimbursementsPage = connect(mapStateToProps)(RawReimbursementsPage)

export default ReimbursementsPage
