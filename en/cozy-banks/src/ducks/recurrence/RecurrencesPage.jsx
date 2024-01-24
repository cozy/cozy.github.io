import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import orderBy from 'lodash/orderBy'
import groupBy from 'lodash/groupBy'

import flag from 'cozy-flags'
import { hasQueryBeenLoaded, isQueryLoading, useQuery } from 'cozy-client'
import { ButtonLink } from 'cozy-ui/transpiled/react/deprecated/Button'
import Empty from 'cozy-ui/transpiled/react/Empty'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Breadcrumbs from 'cozy-ui/transpiled/react/legacy/Breadcrumbs'
import ListSubheader from 'cozy-ui/transpiled/react/ListSubheader'
import { withStyles } from 'cozy-ui/transpiled/react/styles'
import Button from 'cozy-ui/transpiled/react/Buttons'

import Loading from 'components/Loading'
import { recurrenceConn } from 'doctypes'
import BarTheme from 'ducks/bar/BarTheme'

import Padded from 'components/Padded'
import Header from 'components/Header'
import BackButton from 'components/BackButton'
import PageTitle from 'components/Title/PageTitle'
import withError from 'components/withError'

import { useTrackPage } from 'ducks/tracking/browser'
import LegalMention from 'ducks/legal/LegalMention'
import { isDeprecatedBundle } from 'ducks/future/selectors'
import { getCategories } from './utils'
import {
  BundleRow,
  BundlesTableHead,
  BundleMobileWrapper,
  BundlesTable
} from 'ducks/recurrence/Bundles'

const sortBundlesForViewing = bundles => {
  return orderBy(
    bundles,
    [bundle => bundle.latestDate, bundle => getCategories(bundle)[0]],
    ['desc', 'desc']
  )
}

const DeprecatedNotice = withStyles(theme => ({
  root: {
    textTransform: 'none',
    justifyContent: 'center',
    fontWeight: 'normal',
    textIndent: '0',
    height: 'auto',
    padding: '.5rem 2rem',
    [theme.breakpoints.down('sm')]: {
      textAlign: 'center',
      padding: '.5rem 1rem',
      top: '6rem', // twice the cozy-bar height
      zIndex: 1 // goes above the category icons
    }
  }
}))(ListSubheader)

export const RecurrencesPage = ({ emptyIcon, showTitle }) => {
  const navigate = useNavigate()
  const { isMobile } = useBreakpoints()
  const [areDeprecatedBundleShown, setAreDeprecatedBundleShown] =
    useState(false)
  const bundleCol = useQuery(recurrenceConn.query, recurrenceConn)
  const { data: rawBundles } = bundleCol
  const { live: liveBundles, deprecated: deprecatedBundles } = useMemo(() => {
    const sorted = sortBundlesForViewing(rawBundles)
    return groupBy(sorted, x => (isDeprecatedBundle(x) ? 'deprecated' : 'live'))
  }, [rawBundles])
  const hasBundles =
    (typeof liveBundles !== 'undefined' && liveBundles.length) ||
    (typeof deprecatedBundles !== 'undefined' && deprecatedBundles.length)
  const { t } = useI18n()
  const BundlesWrapper = isMobile ? BundleMobileWrapper : BundlesTable

  useTrackPage('recurrences')

  return (
    <>
      <BarTheme theme="primary" />
      <Header fixed theme="inverted">
        {!isMobile ? (
          <>
            <Padded>
              <Breadcrumbs
                items={[
                  {
                    name: t('Recurrence.title'),
                    onClick: () => navigate('/analysis/recurrence')
                  }
                ]}
                theme="primary"
              />
              {flag('debug') ? (
                <Link to="/recurrencedebug">Go to debug</Link>
              ) : null}
            </Padded>
            <BackButton theme="primary" />
            {isMobile ? null : <BundlesTableHead />}
          </>
        ) : null}
        {isMobile ? (
          <>
            <PageTitle>{showTitle && t('Recurrence.title')}</PageTitle>
          </>
        ) : null}
      </Header>
      {isQueryLoading(bundleCol) && !hasQueryBeenLoaded(bundleCol) ? (
        <Padded>
          <Loading />
        </Padded>
      ) : hasBundles ? (
        <BundlesWrapper>
          <LegalMention className="u-m-1" />
          {typeof liveBundles !== 'undefined' &&
            liveBundles.map(bundle => (
              <BundleRow key={bundle._id} bundle={bundle} />
            ))}
          {typeof deprecatedBundles !== 'undefined' &&
            deprecatedBundles.length && (
              <>
                {!areDeprecatedBundleShown && (
                  <Button
                    className="u-mh-1 u-mv-half u-flex-self-start"
                    variant="text"
                    label={t('Recurrence.show-deprecated-bundles', {
                      number: deprecatedBundles.length
                    })}
                    size="small"
                    onClick={() => setAreDeprecatedBundleShown(true)}
                  />
                )}
                {areDeprecatedBundleShown && (
                  <>
                    <DeprecatedNotice>
                      {t('Recurrence.deprecated-bundles-help')}
                    </DeprecatedNotice>
                    {deprecatedBundles.map(bundle => (
                      <BundleRow key={bundle._id} bundle={bundle} />
                    ))}
                  </>
                )}
              </>
            )}
        </BundlesWrapper>
      ) : (
        <Padded>
          <LegalMention className="u-mt-3" style={{ marginBottom: '-3rem' }} />
          <Empty
            icon={emptyIcon}
            title={t('Recurrence.no-recurrences.title')}
            text={t('Recurrence.no-recurrences.text')}
          />
        </Padded>
      )}
    </>
  )
}

RecurrencesPage.defaultProps = {
  emptyIcon: 'cozy',
  showTitle: true
}

const RecurrenceError = ({ error }) => {
  const { t } = useI18n()

  return (
    <Padded>
      <p>{t('Recurrence.display-error')}</p>
      <ButtonLink
        href="#/recurrencedebug"
        label={t('Recurrence.go-to-debug-page')}
      />
      <pre>
        {error.message}
        {error.stack}
      </pre>
    </Padded>
  )
}

export default withError(RecurrencesPage, RecurrenceError)
