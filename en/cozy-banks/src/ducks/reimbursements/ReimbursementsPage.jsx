import React from 'react'
import { connect } from 'react-redux'
import { flowRight as compose } from 'lodash'
import { translate, withBreakpoints } from 'cozy-ui/react'
import Header from 'components/Header'
import { Padded } from 'components/Spacing'
import { PageTitle } from 'components/Title'
import cx from 'classnames'
import BackButton from 'components/BackButton'
import { ConnectedSelectDates } from 'components/SelectDates'
import HealthReimbursements from 'ducks/reimbursements/HealthReimbursements'
import styles from 'ducks/reimbursements/ReimbursementsPage.styl'

function getSubComponent(filteringDoc) {
  switch (filteringDoc._id) {
    case 'health_reimbursements':
    case 'Reimbursements':
      return HealthReimbursements

    default:
      throw new Error()
  }
}

class RawReimbursementsPage extends React.Component {
  render() {
    const {
      breakpoints: { isMobile },
      t,
      filteringDoc
    } = this.props

    const SubComponent = getSubComponent(filteringDoc)

    return (
      <>
        <Header color="primary" fixed>
          <Padded
            className={cx({
              'u-ph-half': isMobile,
              'u-pv-0': isMobile,
              'u-pb-half': isMobile
            })}
          >
            <div className={styles.ReimbursementsPage__title}>
              <BackButton theme="primary" arrow />
              <PageTitle color="primary">{t('Reimbursements.title')}</PageTitle>
            </div>
            <ConnectedSelectDates showFullYear color="primary" />
          </Padded>
        </Header>
        <SubComponent />
      </>
    )
  }
}

function mapStateToProps(state) {
  return {
    filteringDoc: state.filters.filteringDoc
  }
}

const ReimbursementsPage = compose(
  translate(),
  withBreakpoints(),
  connect(mapStateToProps)
)(RawReimbursementsPage)
export default ReimbursementsPage
