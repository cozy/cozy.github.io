import React from 'react'
import { withRouter } from 'react-router'
import { Tabs, TabList, Tab } from 'cozy-ui/transpiled/react/Tabs'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import styles from 'components/Tabs.styl'
import flag from 'cozy-flags'

const AnalysisTabs = ({ router, location }) => {
  const { t } = useI18n()
  const tabNames = ['categories', 'recurrence']

  const goTo = url => () => {
    router.push(url)
  }

  const activeTab = location.pathname.includes('categories')
    ? 'categories'
    : 'recurrence'

  const tabs = tabNames.map(tabName => (
    <Tab key={tabName} name={tabName} onClick={goTo(`${tabName}`)}>
      {t(`Nav.${tabName}`)}
    </Tab>
  ))

  return flag('banks.recurrence') ? (
    <Tabs className={styles['Tabs']} initialActiveTab={activeTab}>
      <TabList inverted className={styles['TabList']}>
        {tabs}
      </TabList>
    </Tabs>
  ) : null
}

export default withRouter(AnalysisTabs)
