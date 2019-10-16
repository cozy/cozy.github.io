import React, { Component } from 'react'
import { connect } from 'react-redux'
import * as d3 from 'utils/d3'
import { withBreakpoints, translate } from 'cozy-ui/react'
import LineChart from 'components/Chart/LineChart'
import styles from 'ducks/balance/History.styl'
import { flowRight as compose } from 'lodash'
import cx from 'classnames'
import { getCssVariableValue } from 'cozy-ui/react/utils/color'
import { lighten } from '@material-ui/core/styles/colorManipulator'
import flag from 'cozy-flags'
import 'element-scroll-polyfill'
import { getChartDataSelector as getChartData } from 'ducks/chart/selectors'
import { withRouter } from 'react-router'

// on iOS white transparency on SVG failed so we should calculate hexa color
const gradientColor = getCssVariableValue('historyGradientColor') || '#297ef2'
const gradientStyle = {
  '0%': lighten(gradientColor, 0.48),
  '100%': gradientColor
}

class HistoryChart extends Component {
  container = React.createRef()

  getTooltipContent = item => {
    const date = this.props.f(item.x, 'D MMM')
    const balance = item.y.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })

    return [
      { content: date },
      {
        content: flag('amount_blur') ? 'XXX' : balance,
        style: 'font-weight: bold'
      },
      { content: '€' }
    ]
  }

  componentDidMount() {
    const container = this.container.current
    container.scrollTo(container.scrollWidth, 0)
  }

  render() {
    const { data, height, minWidth, className, animation } = this.props
    const intervalBetweenPoints = 2
    const width = Math.max(minWidth, intervalBetweenPoints * data.length)

    return (
      <div className={cx(styles.HistoryChart, className)} ref={this.container}>
        <LineChart
          animation={animation}
          xScale={d3.scaleTime}
          lineColor="white"
          axisColor="white"
          labelsColor="rgba(255, 255, 255, 0.64)"
          gradient={gradientStyle}
          pointFillColor="white"
          pointStrokeColor="rgba(255, 255, 255, 0.3)"
          getTooltipContent={this.getTooltipContent}
          data={data}
          width={width}
          height={height}
          {...this.props}
        />
      </div>
    )
  }
}

const EnhancedHistoryChart = compose(
  withRouter,
  withBreakpoints(),
  translate()
)(HistoryChart)

export const ConnectedHistoryChart = compose(
  withRouter,
  connect((state, ownProps) => ({
    data: getChartData(state, ownProps)
  })),
  withBreakpoints(),
  translate()
)(HistoryChart)

export default EnhancedHistoryChart
