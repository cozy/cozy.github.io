import React, { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import cx from 'classnames'

import Typography from 'cozy-ui/transpiled/react/Typography'
import { Media, Bd, Img } from 'cozy-ui/transpiled/react/deprecated/Media'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'

import Padded from 'components/Padded'
import Header from 'components/Header'
import BackButton from 'components/BackButton'
import BarTheme from 'ducks/bar/BarTheme'
import AccountSwitch from 'ducks/account/AccountSwitch'
import LegalMention from 'ducks/legal/LegalMention'
import HeaderInfoCard from 'ducks/future/HeaderInfoCard'

import styles from './styles.styl'

const PlannedTransactionsPageHeader = () => {
  const { isMobile } = useBreakpoints()
  const navigate = useNavigate()
  const { t } = useI18n()

  const handleBack = useCallback(() => {
    navigate('/balances/details')
  }, [navigate])

  return (
    <Header theme="inverted" fixed className={styles.Header}>
      <BarTheme theme="primary" />
      <Padded>
        {isMobile ? (
          <>
            <BackButton theme="primary" onClick={handleBack} />
            <div className={cx(styles['Title--mobile'])}>
              <AccountSwitch insideBar={false} />
            </div>
            <HeaderInfoCard />
          </>
        ) : (
          <Media>
            <Img>
              <BackButton arrow onClick={handleBack} theme="primary" />
            </Img>
            <Bd className="u-stack-xs">
              <AccountSwitch size="normal" />
              <div>
                <Typography color="primary" variant="h3">
                  {t('EstimatedBudget.page-title')}
                </Typography>
              </div>
            </Bd>
            <Img>
              <HeaderInfoCard />
            </Img>
          </Media>
        )}
        <LegalMention className="u-mt-1" />
      </Padded>
    </Header>
  )
}

export default React.memo(PlannedTransactionsPageHeader)
