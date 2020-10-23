import React from 'react'
import { Tabs, Tab } from 'cozy-ui/transpiled/react/MuiTabs'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import Header from 'components/Header'

import { useLocation, useHistory } from 'components/RouterContext'

const tabRoutes = {
  categories: 'analysis/categories',
  recurrence: 'analysis/recurrence'
}

const AnalysisTabs = () => {
  const history = useHistory()
  const location = useLocation()
  const { t } = useI18n()
  const tabNames = ['categories', 'recurrence']

  const goTo = url => () => {
    history.push(url)
  }

  const activeTab = location.pathname.includes('categories')
    ? 'categories'
    : 'recurrence'

  return (
    <Header fixed theme="inverted">
      <Tabs value={tabNames.indexOf(activeTab)}>
        {tabNames.map(tabName => (
          <Tab
            disableRipple
            label={t(`Nav.${tabName}`)}
            key={tabName}
            name={tabName}
            onClick={goTo(tabRoutes[tabName])}
          />
        ))}
      </Tabs>
    </Header>
  )
}

export default AnalysisTabs
