import React, { Fragment, useMemo, useCallback } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import Fade from '@material-ui/core/Fade'
import Breadcrumb from 'cozy-ui/transpiled/react/Breadcrumbs'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'
import Stack from 'cozy-ui/transpiled/react/Stack'

import { useSelector, useDispatch } from 'react-redux'

import { useRouter } from 'components/RouterContext'
import Header from 'components/Header'
import Padded from 'components/Padded'
import TransactionSelectDates from 'ducks/transactions/TransactionSelectDates'
import { getPeriod, addFilterByPeriod } from 'ducks/filters'

import CategoriesChart from 'ducks/categories/CategoriesChart'
import {
  getGlobalCurrency,
  getTransactionsTotal
} from 'ducks/categories/helpers'
import styles from 'ducks/categories/CategoriesHeader.styl'
import AddAccountButton from 'ducks/categories/AddAccountButton'
import { onSubcategory } from 'ducks/categories/utils'
import catStyles from 'ducks/categories/styles.styl'

import Table from 'components/Table'
import { useParams } from 'components/RouterContext'
import LegalMention from 'ducks/legal/LegalMention'
import Empty from 'cozy-ui/transpiled/react/Empty'
import DateSelectorHeader from 'ducks/categories/DateSelectorHeader'
import CategoryAccountSwitch from 'ducks/categories/CategoryAccountSwitch'
import IncomeToggle from 'ducks/categories/IncomeToggle'

const stAmount = catStyles['bnk-table-amount']
const stCategory = catStyles['bnk-table-category-category']
const stPercentage = catStyles['bnk-table-percentage']
const stTotal = catStyles['bnk-table-total']
const stTableCategory = catStyles['bnk-table-category']

const makeBreadcrumbs = (router, categoryName, subcategoryName, t) => {
  const breadcrumbs = [
    {
      name: t('Categories.title.general'),
      onClick: () => router.push('/analysis/categories')
    }
  ]
  if (categoryName) {
    breadcrumbs.push({
      name: t(`Data.categories.${categoryName}`),
      onClick: () => router.push(`/analysis/categories/${categoryName}`)
    })
  }
  if (subcategoryName) {
    breadcrumbs.push({
      name: t(`Data.subcategories.${subcategoryName}`)
    })
  }
  return breadcrumbs
}

const CategoriesTableHead = props => {
  const { selectedCategory } = props
  const { isDesktop, isTablet } = useBreakpoints()
  const { t } = useI18n()
  return (
    <thead>
      <tr>
        <td className={stCategory}>
          {selectedCategory
            ? t('Categories.headers.subcategories')
            : t('Categories.headers.categories')}
        </td>
        {(isDesktop || isTablet) && (
          <td className={catStyles['bnk-table-operation']}>
            {t('Categories.headers.transactions.plural')}
          </td>
        )}
        {isDesktop && (
          <td className={stAmount}>{t('Categories.headers.credit')}</td>
        )}
        {isDesktop && (
          <td className={stAmount}>{t('Categories.headers.debit')}</td>
        )}
        <td className={stTotal}>{t('Categories.headers.total')}</td>
        <td className={stPercentage}>%</td>
      </tr>
    </thead>
  )
}

const CategoriesHeader = props => {
  const { t } = useI18n()
  const { isMobile } = useBreakpoints()
  const {
    emptyIcon,
    hasAccount,
    selectedCategory,
    withIncome,
    onWithIncomeToggle,
    categories,
    chartSize,
    isFetching,
    categoryName,
    subcategoryName,
    classes
  } = props

  const hasData = categories.length > 0 && categories[0].transactionsNumber > 0
  const showIncomeToggle = hasData && selectedCategory === undefined
  const globalCurrency = getGlobalCurrency(categories)
  const transactionsTotal = getTransactionsTotal(categories)
  const params = useParams()
  const isSubcategory = onSubcategory(params)

  const router = useRouter()
  const breadcrumbItems = useMemo(() => {
    return makeBreadcrumbs(router, categoryName, subcategoryName, t)
  }, [router, categoryName, subcategoryName, t])

  const dispatch = useDispatch()
  const period = useSelector(getPeriod)
  const onChangePeriod = useCallback(
    newPeriod => {
      dispatch(addFilterByPeriod(newPeriod))
    },
    [dispatch]
  )

  const incomeToggle = showIncomeToggle ? (
    <IncomeToggle withIncome={withIncome} onToggle={onWithIncomeToggle} />
  ) : null

  const chart =
    isFetching || isSubcategory ? null : (
      <CategoriesChart
        width={chartSize}
        height={chartSize}
        categories={
          selectedCategory ? selectedCategory.subcategories : categories
        }
        selectedCategory={selectedCategory}
        total={selectedCategory ? selectedCategory.amount : transactionsTotal}
        currency={globalCurrency}
        label={t('Categories.title.total')}
        hasAccount={hasAccount}
        className={cx(
          hasAccount ? null : styles.NoAccount_chart,
          selectedCategory ? styles.SubcategoryChart : null
        )}
      />
    )

  const dateSelector = (
    <TransactionSelectDates
      value={period}
      onChange={onChangePeriod}
      showFullYear
      className={classes.selectDates}
    />
  )

  if (isMobile) {
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
            <LegalMention className="u-flex u-flex-items-center u-flex-justify-around u-mr-1">
              {incomeToggle}
            </LegalMention>

            {!hasData && (
              <div className={styles.NoAccount_empty}>
                <Empty
                  icon={emptyIcon}
                  title=""
                  text={t('Categories.title.empty-text')}
                />
              </div>
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
  }

  return (
    <Header theme="inverted" fixed>
      <Padded
        className={cx(styles.CategoriesHeader, {
          [styles.NoAccount]: !hasAccount
        })}
      >
        {hasAccount ? (
          <>
            <div>
              <Stack spacing="m">
                <CategoryAccountSwitch
                  selectedCategory={selectedCategory}
                  breadcrumbItems={breadcrumbItems}
                />
                {dateSelector}
              </Stack>
              {breadcrumbItems.length > 1 && (
                <Fade in>
                  <Breadcrumb className="u-mt-1" items={breadcrumbItems} />
                </Fade>
              )}
              {incomeToggle}
            </div>
            {chart}
          </>
        ) : (
          <AddAccountButton label={t('Accounts.add-bank')} />
        )}
      </Padded>
      {hasAccount ? (
        <Table className={stTableCategory}>
          <CategoriesTableHead selectedCategory={selectedCategory} />
        </Table>
      ) : null}
    </Header>
  )
}

CategoriesHeader.defaultProps = {
  chartSize: 182,
  emptyIcon: 'cozy',
  classes: {
    header: '',
    legalMention: 'u-mt-2 u-pt-1',
    selectDates: 'u-pt-half'
  }
}

CategoriesHeader.propTypes = {
  categoryName: PropTypes.string,
  subcategoryName: PropTypes.string,
  selectedCategory: PropTypes.object,
  withIncome: PropTypes.bool.isRequired,
  onWithIncomeToggle: PropTypes.func.isRequired,
  chartSize: PropTypes.number,
  hasAccount: PropTypes.bool.isRequired,
  categories: PropTypes.array.isRequired
}

export default CategoriesHeader
