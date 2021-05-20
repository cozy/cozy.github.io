import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import { Tab, Tabs } from 'cozy-ui/transpiled/react/MuiTabs'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import Header from 'components/Header'

import { useHistory } from 'components/RouterContext'

export const tabRoutes = {
  categories: 'analysis/categories',
  recurrence: 'analysis/recurrence'
}

export const activeTab = location =>
  location.pathname.includes('categories') ? 'categories' : 'recurrence'
export const tabNames = ['categories', 'recurrence']

const AnalysisTabs = ({ location }) => {
  const history = useHistory()
  const { t } = useI18n()
  const goTo = useCallback(url => () => history.push(url), [history])
  return (
    <Header fixed theme="inverted">
      <Tabs value={tabNames.indexOf(activeTab(location))}>
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

AnalysisTabs.PropTypes = {
  location: PropTypes.object.isRequired
}

export default React.memo(AnalysisTabs)
