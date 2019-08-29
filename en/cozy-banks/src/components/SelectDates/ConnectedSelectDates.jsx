import { connect } from 'react-redux'
import { getPeriod, addFilterByPeriod } from 'ducks/filters'
import SelectDates from 'components/SelectDates/SelectDates'

const mapStateToProps = state => ({
  value: getPeriod(state)
})

const mapDispatchToProps = dispatch => ({
  onChange: period => {
    dispatch(addFilterByPeriod(period))
  }
})

export const ConnectedSelectDates = connect(
  mapStateToProps,
  mapDispatchToProps
)(SelectDates)
