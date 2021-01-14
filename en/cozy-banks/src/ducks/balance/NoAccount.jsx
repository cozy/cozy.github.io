import React, { memo } from 'react'
import { useI18n, useBreakpoints } from 'cozy-ui/transpiled/react'
import Button from 'cozy-ui/transpiled/react/Button'
import CozyTheme from 'cozy-ui/transpiled/react/CozyTheme'

import HeaderTitle from 'ducks/balance/HeaderTitle'
import AddAccountLink from 'ducks/settings/AddAccountLink'
import { Container, Content } from 'components/VerticalBox'
import BarTheme from 'ducks/bar/BarTheme'
import styles from 'ducks/balance/NoAccount.styl'

import PlusIcon from 'cozy-ui/transpiled/react/Icons/Plus'
import Icon from 'cozy-ui/transpiled/react/Icon'

export const NoAccount = ({ buttonTheme }) => {
  const { isMobile } = useBreakpoints()
  const { t, lang } = useI18n()
  const timelineImg = require(`./timeline_${isMobile ? 'mobile' : 'desktop'}_${
    lang === 'fr' ? 'fr' : 'en'
  }.svg`)
  const contentProps = isMobile ? { center: true } : { bottom: true }
  return (
    <CozyTheme variant="inverted">
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
            theme={buttonTheme}
            icon={<Icon icon={PlusIcon} />}
            size="large"
            className={styles.NoAccount_addButton}
            label={t('Accounts.add_bank')}
          />
        </AddAccountLink>
      </Container>
    </CozyTheme>
  )
}

NoAccount.defaultProps = {
  buttonTheme: 'highlight'
}

export default memo(NoAccount)
