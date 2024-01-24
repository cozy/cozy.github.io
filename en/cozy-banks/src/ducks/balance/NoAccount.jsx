import React, { memo } from 'react'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Button from 'cozy-ui/transpiled/react/deprecated/Button'
import CozyTheme from 'cozy-ui/transpiled/react/providers/CozyTheme'
import PageTitle from 'components/Title/PageTitle'
import HeaderTitle from 'ducks/balance/HeaderTitle'
import LegalMention from 'ducks/legal/LegalMention'
import AddAccountLink from 'ducks/settings/AddAccountLink'
import { Container, Content } from 'components/VerticalBox'
import BarTheme from 'ducks/bar/BarTheme'
import styles from 'ducks/balance/NoAccount.styl'

import PlusIcon from 'cozy-ui/transpiled/react/Icons/Plus'
import Icon from 'cozy-ui/transpiled/react/Icon'

export const NoAccount = ({ buttonTheme, children }) => {
  const { isMobile } = useBreakpoints()
  const { t, lang } = useI18n()
  const timelineImg = require(`./timeline_${isMobile ? 'mobile' : 'desktop'}_${
    lang === 'fr' ? 'fr' : 'en'
  }.svg`)
  const contentProps = isMobile ? { center: true } : { bottom: true }
  return (
    <CozyTheme variant="inverted">
      {isMobile && <PageTitle>{t('Balance.title')}</PageTitle>}
      <Container className={styles.NoAccount}>
        <BarTheme theme="primary" />
        <Content {...contentProps}>
          <HeaderTitle balance={0} subtitle={t('Accounts.no-account')} />
        </Content>
        <div className={styles.NoAccount_bottom}>
          <div className={styles.NoAccount_chart} />
          <img src={timelineImg} alt="" className={styles.NoAccount_timeline} />
        </div>
        <LegalMention className="u-mb-3 u-mr-1" />
        <AddAccountLink>
          <Button
            theme={buttonTheme}
            icon={<Icon icon={PlusIcon} />}
            size="large"
            className={styles.NoAccount_addButton}
            label={t('Accounts.add-bank')}
          />
        </AddAccountLink>
      </Container>
      {children}
    </CozyTheme>
  )
}

NoAccount.defaultProps = {
  buttonTheme: 'highlight'
}

export default memo(NoAccount)
