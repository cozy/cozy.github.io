import React, { memo } from 'react'
import { flowRight as compose } from 'lodash'
import { withBreakpoints, useI18n } from 'cozy-ui/transpiled/react'
import Button from 'cozy-ui/transpiled/react/Button'
import HeaderTitle from 'ducks/balance/components/HeaderTitle'
import AddAccountLink from 'ducks/settings/AddAccountLink'
import { Container, Content } from 'components/VerticalBox'
import BarTheme from 'ducks/bar/BarTheme'

import styles from 'ducks/balance/components/NoAccount.styl'

const NoAccount = ({ lang, breakpoints: { isMobile } }) => {
  const { t } = useI18n()
  const timelineImg = require(`./timeline_${isMobile ? 'mobile' : 'desktop'}_${
    lang === 'fr' ? 'fr' : 'en'
  }.svg`)
  const contentProps = isMobile ? { center: true } : { bottom: true }
  return (
    <Container className={styles.NoAccount}>
      <BarTheme theme="primary" />
      <Content {...contentProps}>
        <HeaderTitle balance={0} subtitle={t('Accounts.no_account')} />
      </Content>
      <div className={styles.NoAccount_bottom}>
        <div className={styles.NoAccount_chart} />
        <img src={timelineImg} alt="" className={styles.NoAccount_timeline} />
      </div>
      <AddAccountLink>
        <Button
          theme="highlight"
          icon="plus"
          size="large"
          className={styles.NoAccount_addButton}
          label={t('Accounts.add_bank')}
        />
      </AddAccountLink>
    </Container>
  )
}

export default compose(
  withBreakpoints(),
  memo
)(NoAccount)
