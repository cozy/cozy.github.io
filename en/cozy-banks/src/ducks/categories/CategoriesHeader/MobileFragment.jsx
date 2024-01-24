import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import Empty from 'cozy-ui/transpiled/react/Empty'

import Header from 'components/Header'
import Padded from 'components/Padded'
import AddAccountButton from 'ducks/categories/AddAccountButton'
import HeaderLoadingProgress from 'components/HeaderLoadingProgress'
import LegalMention from 'ducks/legal/LegalMention'
import DateSelectorHeader from 'ducks/categories/DateSelectorHeader'
import AdvancedFilter from 'ducks/categories/CategoriesHeader/AdvancedFilter'
import styles from 'ducks/categories/CategoriesHeader/CategoriesHeader.styl'

const MobileFragment = React.memo(props => {
  const { t } = useI18n()
  const { isMobile } = useBreakpoints()
  const {
    breadcrumbItems,
    chart,
    classes,
    dateSelector,
    emptyIcon,
    hasAccount,
    hasData,
    incomeToggle,
    isFetching,
    isFetchingNewData,
    selectedCategory,
    showAdvancedFilter,
    selectedTags
  } = props

  return (
    <Fragment>
      <DateSelectorHeader
        dateSelector={dateSelector}
        selectedCategory={selectedCategory}
        breadcrumbItems={breadcrumbItems}
      />
      {hasAccount ? (
        <Header
          className={cx(styles.CategoriesHeader, classes.header, {
            [styles.NoAccount]: !hasAccount
          })}
          theme={isMobile ? 'normal' : 'inverted'}
        >
          <AdvancedFilter
            onClick={showAdvancedFilter}
            selectedTagsLength={selectedTags.length}
          />
          <HeaderLoadingProgress
            isFetching={!!isFetchingNewData && !isFetching}
          />
          {!hasData && !isFetching && !isFetchingNewData && (
            <Empty
              className={cx('u-mt-3', styles.NoAccount_empty)}
              icon={emptyIcon}
              text={t('Categories.title.empty-text')}
            />
          )}
          {incomeToggle && chart ? <Padded>{chart}</Padded> : null}
        </Header>
      ) : (
        <div className={cx(styles.NoAccount_container)}>
          <LegalMention className="u-mt-3 u-pt-1 u-mr-1" />

          <Padded className={styles.NoAccount_box}>
            {chart}
            <AddAccountButton absolute label={t('Accounts.add-bank')} />
          </Padded>
        </div>
      )}
    </Fragment>
  )
})

MobileFragment.displayName = 'Mobile Fragment'

MobileFragment.propTypes = {
  breadcrumbItems: PropTypes.array.isRequired,
  chart: PropTypes.node.isRequired,
  classes: PropTypes.object,
  dateSelector: PropTypes.node.isRequired,
  emptyIcon: PropTypes.node.isRequired,
  hasAccount: PropTypes.bool.isRequired,
  hasData: PropTypes.bool.isRequired,
  incomeToggle: PropTypes.node.isRequired,
  isFetching: PropTypes.bool.isRequired,
  isFetchingNewData: PropTypes.bool.isRequired,
  selectedCategory: PropTypes.object,
  showAdvancedFilter: PropTypes.func
}

export default MobileFragment
