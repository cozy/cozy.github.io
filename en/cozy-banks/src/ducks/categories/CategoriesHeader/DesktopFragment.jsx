import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Empty from 'cozy-ui/transpiled/react/Empty'
import Stack from 'cozy-ui/transpiled/react/Stack'
import Fade from 'cozy-ui/transpiled/react/Fade'
import Breadcrumbs from 'cozy-ui/transpiled/react/legacy/Breadcrumbs'

import Table from 'components/Table'
import Header from 'components/Header'
import Padded from 'components/Padded'
import HeaderLoadingProgress from 'components/HeaderLoadingProgress'
import AddAccountButton from 'ducks/categories/AddAccountButton'
import CategoriesTableHead from 'ducks/categories/CategoriesHeader/CategoriesTableHead'
import AdvancedFilter from 'ducks/categories/CategoriesHeader/AdvancedFilter'
import styles from 'ducks/categories/CategoriesHeader/CategoriesHeader.styl'
import CategoryAccountSwitch from 'ducks/categories/CategoryAccountSwitch'
import catStyles from 'ducks/categories/styles.styl'

const stTableCategory = catStyles['bnk-table-category']

const DesktopFragment = React.memo(
  ({
    breadcrumbItems,
    chart,
    dateSelector,
    emptyIcon,
    hasAccount,
    hasData,
    isFetching,
    isFetchingNewData,
    selectedCategory,
    showAdvancedFilter
  }) => {
    const { t } = useI18n()

    return (
      <>
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
                      <Breadcrumbs className="u-mt-1" items={breadcrumbItems} />
                    </Fade>
                  )}
                  <AdvancedFilter
                    onClick={showAdvancedFilter}
                    className="u-mt-1"
                  />
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
        <HeaderLoadingProgress
          isFetching={!!isFetchingNewData && !isFetching}
        />
        {!hasData && !isFetching && !isFetchingNewData ? (
          <Empty
            className={styles.NoAccount_empty}
            icon={emptyIcon}
            text={t('Categories.title.empty-text')}
          />
        ) : null}
      </>
    )
  }
)

DesktopFragment.displayName = 'Desktop Fragment'

DesktopFragment.propTypes = {
  breadcrumbItems: PropTypes.array.isRequired,
  chart: PropTypes.node.isRequired,
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

export default DesktopFragment
