import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import cx from 'classnames'
import distanceInWords from 'date-fns/distance_in_words'
import CompositeRow from 'cozy-ui/transpiled/react/deprecated/CompositeRow'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import { Bd, Img, Media } from 'cozy-ui/transpiled/react/deprecated/Media'
import Figure from 'cozy-ui/transpiled/react/Figure'
import CategoryIcon from 'ducks/categories/CategoryIcon'
import Table, { TdSecondary } from 'components/Table'

import frLocale from 'date-fns/locale/fr'
import enLocale from 'date-fns/locale/en'
import esLocale from 'date-fns/locale/es'

import styles from './styles.styl'
import {
  getAmount,
  getCategories,
  getCurrency,
  getFrequencyText,
  getLabel
} from './utils'

const BundleFrequency = ({ bundle }) => {
  const { t } = useI18n()
  return <>{getFrequencyText(t, bundle)}</>
}

const dateFnsLocales = {
  en: enLocale,
  fr: frLocale,
  es: esLocale
}

const BundleDistance = ({ bundle }) => {
  const { lang } = useI18n()
  const d = useMemo(
    () =>
      distanceInWords(Date.now(), bundle.latestDate, {
        addSuffix: true,
        locale: dateFnsLocales[lang] || dateFnsLocales.en
      }),
    [bundle, lang]
  )
  return <>{d}</>
}

const BundleMobileRow = ({ bundle }) => {
  const navigate = useNavigate()
  const catId = getCategories(bundle)[0]
  return (
    <CompositeRow
      onClick={() => navigate(`/analysis/recurrence/${bundle._id}`)}
      image={<CategoryIcon categoryId={catId} />}
      className={cx('u-pv-half u-ph-1 u-c-pointer', styles.BundleRow)}
      key={bundle._id}
      primaryText={getLabel(bundle)}
      secondaryText={
        <>
          <BundleDistance bundle={bundle} /> -{' '}
          <BundleFrequency bundle={bundle} />
        </>
      }
      right={<BundleAmount bundle={bundle} />}
    />
  )
}

const BundleAmount = ({ bundle }) => {
  const amount = getAmount(bundle)
  const currency = getCurrency(bundle)
  return <Figure total={amount} symbol={currency} coloredPositive />
}

const BundleDesktopRow = ({ bundle }) => {
  const navigate = useNavigate()
  const catId = getCategories(bundle)[0]
  return (
    <tr
      className="u-c-pointer"
      onClick={() => navigate(`/analysis/recurrence/${bundle._id}`)}
    >
      <td className={styles.ColumnSizeLabel}>
        <Media>
          <Img className="u-mr-1">
            <CategoryIcon categoryId={catId} />
          </Img>
          <Bd>{getLabel(bundle)}</Bd>
        </Media>
      </td>
      <TdSecondary className={styles.ColumnSizeLastOccurence}>
        <BundleDistance bundle={bundle} />
      </TdSecondary>
      <TdSecondary className={styles.ColumnSizeFrequency}>
        <BundleFrequency bundle={bundle} />
      </TdSecondary>
      <TdSecondary className={styles.ColumnSizeAmount}>
        <BundleAmount bundle={bundle} />
      </TdSecondary>
    </tr>
  )
}

const BundleRow = ({ bundle }) => {
  const { isMobile } = useBreakpoints()
  return isMobile ? (
    <BundleMobileRow bundle={bundle} />
  ) : (
    <BundleDesktopRow bundle={bundle} />
  )
}

const BundlesTableHead = () => {
  const { t } = useI18n()
  return (
    <Table color="primary">
      <thead>
        <tr>
          <td className={styles.ColumnSizeLabel}>
            {t('Recurrence.table.label')}
          </td>
          <td className={styles.ColumnSizeLastOccurence}>
            {t('Recurrence.table.last-occurence')}
          </td>
          <td className={styles.ColumnSizeFrequency}>
            {t('Recurrence.table.frequency')}
          </td>
          <td className={styles.ColumnSizeAmount}>
            {t('Recurrence.table.amount')}
          </td>
        </tr>
      </thead>
    </Table>
  )
}

const BundleMobileWrapper = ({ children }) => {
  return <div className="u-pt-3">{children}</div>
}

const BundlesTable = ({ children }) => {
  return (
    <Table>
      <tbody>{children}</tbody>
    </Table>
  )
}

export { BundleRow, BundlesTableHead, BundleMobileWrapper, BundlesTable }
