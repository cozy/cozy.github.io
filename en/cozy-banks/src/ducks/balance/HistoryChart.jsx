import React, { Component, Fragment } from 'react'
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

// on iOS white transparency on SVG failed so we should calculate hexa color
const gradientColor = getCssVariableValue('historyGradientColor')
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

    return (
      <Fragment>
        {date}
        <strong
          className={cx(styles.HistoryChart__tooltipBalance, {
            [styles.Balance_blur]: flag('amount_blur')
          })}
        >
          {balance} €
        </strong>
      </Fragment>
    )
  }

  componentDidMount() {
    const container = this.container.current
    container.scrollTo(container.scrollWidth, 0)
  }

  render() {
    const { data, height, width, className, animation } = this.props
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

export default compose(
  withBreakpoints(),
  translate()
)(HistoryChart)
