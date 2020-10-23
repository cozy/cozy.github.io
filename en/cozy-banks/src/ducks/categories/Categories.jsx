import React, { Component } from 'react'
import { withRouter } from 'react-router'
import cx from 'classnames'
import { translate, withBreakpoints } from 'cozy-ui/transpiled/react'
import Text, { Caption } from 'cozy-ui/transpiled/react/Text'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import { Media, Bd, Img } from 'cozy-ui/transpiled/react/Media'
import CategoryIcon from 'ducks/categories/CategoryIcon'
import { Table, TdSecondary } from 'components/Table'
import Figure from 'cozy-ui/transpiled/react/Figure'
import styles from 'ducks/categories/styles.styl'
import { flowRight as compose } from 'lodash'
import { getCurrencySymbol } from 'utils/currencySymbol'
import PercentageLine from 'components/PercentageLine'
import Padded from 'components/Spacing/Padded'

const stAmount = styles['bnk-table-amount']
const stCategory = styles['bnk-table-category-category']
const stPercentage = styles['bnk-table-percentage']
const stRow = styles['bnk-table-row']
const stTableCategory = styles['bnk-table-category']
const stTotal = styles['bnk-table-total']
const stUncollapsed = styles['bnk-table-row--uncollapsed']
const stCatTotalMobile = styles['bnk-category-total-mobile']

class Categories extends Component {
  toggle = categoryName => {
    const { selectedCategory, selectCategory } = this.props
    selectedCategory ? selectCategory(undefined) : selectCategory(categoryName)
  }

  render() {
    const { t, categories: categoriesProps, selectedCategory } = this.props
    let categories = categoriesProps || []
    if (selectedCategory) {
      categories = [selectedCategory]
    }
    const hasData =
      categories.length > 0 && categories[0].transactionsNumber > 0

    return (
      <>
        {!hasData && (
          <Padded>
            <p>{t('Categories.title.empty_text')}</p>
          </Padded>
        )}
        {hasData && (
          <Table className={stTableCategory}>
            <tbody>
              {categories.map(category =>
                this.renderCategory(
                  category,
                  selectedCategory && selectedCategory.name
                )
              )}
            </tbody>
          </Table>
        )}
      </>
    )
  }

  renderCategory(category) {
    const {
      selectedCategory,
      breakpoints: { isDesktop, isTablet }
    } = this.props

    const selectedCategoryName = selectedCategory && selectedCategory.name

    const isCollapsed = selectedCategoryName !== category.name
    if (selectedCategoryName !== undefined && isCollapsed) return

    const renderer =
      isDesktop || isTablet
        ? 'renderCategoryDesktopTablet'
        : 'renderCategoryMobile'
    return this[renderer](category)
  }

  handleClick = (category, subcategory) => {
    const { router } = this.props
    if (subcategory) {
      router.push(`/analysis/categories/${category.name}/${subcategory.name}`)
    } else {
      this.toggle(category.name)
    }
  }

  renderCategoryDesktopTablet(category, subcategory) {
    const {
      t,
      selectedCategory,
      breakpoints: { isDesktop }
    } = this.props
    const {
      name,
      subcategories,
      credit,
      debit,
      percentage,
      currency,
      transactionsNumber
    } = subcategory || category
    const selectedCategoryName = selectedCategory && selectedCategory.name
    const isCollapsed = selectedCategoryName !== category.name
    const type = subcategory ? 'subcategories' : 'categories'
    const rowClass = stRow
    const onClick = subcategory || isCollapsed ? this.handleClick : () => {}
    const key = (subcategory || category).name
    const total = credit + debit
    return [
      (subcategory || isCollapsed) && (
        <tr
          key={key}
          className={rowClass}
          onClick={() => onClick(category, subcategory)}
        >
          <PercentageLine value={percentage} color={category.color} />
          <TdSecondary className={cx(stCategory)}>
            <Media className={styles['bnk-table-category-name-icon']}>
              <Img className="u-mr-1">
                <CategoryIcon categoryId={(subcategory || category).id} />
              </Img>
              <Bd>{t(`Data.${type}.${name}`)}</Bd>
            </Media>
          </TdSecondary>
          <TdSecondary className={styles['bnk-table-operation']}>
            {transactionsNumber}
          </TdSecondary>
          {isDesktop && (
            <TdSecondary className={stAmount}>
              {credit ? (
                <Figure
                  total={credit}
                  symbol={getCurrencySymbol(currency)}
                  signed
                  default="-"
                  className={styles['bnk-table-amount-figure']}
                  totalClassName={styles['bnk-table-amount-figure-total']}
                />
              ) : (
                '－'
              )}
            </TdSecondary>
          )}
          {isDesktop && (
            <TdSecondary className={stAmount}>
              {debit ? (
                <Figure
                  total={debit}
                  symbol={getCurrencySymbol(currency)}
                  signed
                  default="-"
                  className={styles['bnk-table-amount-figure']}
                  totalClassName={styles['bnk-table-amount-figure-total']}
                />
              ) : (
                '－'
              )}
            </TdSecondary>
          )}
          <TdSecondary className={stTotal}>
            <Figure
              total={total || '－'}
              symbol={getCurrencySymbol(currency)}
              coloredPositive
              signed
            />
          </TdSecondary>
          <TdSecondary className={stPercentage}>
            {!subcategory && selectedCategoryName ? '100' : `${percentage}`}
            <span className={styles['bnk-table-percentage-sign']}>%</span>
          </TdSecondary>
        </tr>
      ),
      ...(isCollapsed || subcategory
        ? []
        : subcategories.map(subcategory =>
            this.renderCategoryDesktopTablet(category, subcategory)
          ))
    ]
  }

  renderCategoryMobile(category, subcategory) {
    const { t, selectedCategory } = this.props
    const {
      name,
      subcategories,
      credit,
      debit,
      currency,
      percentage,
      transactionsNumber
    } = subcategory || category
    const selectedCategoryName = selectedCategory && selectedCategory.name

    // subcategories are always collapsed
    const isCollapsed = selectedCategoryName !== category.name
    const type = subcategory ? 'subcategories' : 'categories'
    const categoryName = (subcategory || category).name
    const total = credit + debit

    return [
      (subcategory || isCollapsed) && (
        <tr
          key={categoryName}
          className={isCollapsed ? stRow : stUncollapsed}
          onClick={() => this.handleClick(category, subcategory)}
        >
          <td className="u-ph-1">
            <Media>
              <Img className="u-pr-half">
                <CategoryIcon categoryId={(subcategory || category).id} />
              </Img>
              <Bd className={cx('u-ph-half', stCategory)}>
                <ListItemText>
                  <Text>{t(`Data.${type}.${name}`)}</Text>
                  <Caption className={styles['bnk-table-row-caption']}>
                    <span className={styles['bnk-table-percentage-caption']}>
                      {!subcategory && selectedCategoryName
                        ? '100%'
                        : `${percentage}%`}
                    </span>
                    <span>
                      {`· ${transactionsNumber} ${t(
                        `Categories.headers.transactions.${
                          transactionsNumber > 1 ? 'plural' : 'single'
                        }`
                      )}`}
                    </span>
                  </Caption>
                </ListItemText>
              </Bd>
              <Img className={cx('u-pl-half', stAmount)}>
                <Figure
                  className={stCatTotalMobile}
                  total={total || '－'}
                  symbol={getCurrencySymbol(currency)}
                  coloredPositive
                  signed
                />
              </Img>
            </Media>
            <PercentageLine
              className={styles.PercentageLine}
              value={percentage}
              color={category.color}
            />
          </td>
        </tr>
      ),
      ...(isCollapsed || subcategory
        ? []
        : subcategories.map(subcategory =>
            this.renderCategoryMobile(category, subcategory)
          ))
    ]
  }
}

export default compose(
  withRouter,
  withBreakpoints(),
  translate()
)(Categories)
