import React, { useRef, useCallback, useEffect } from 'react'
import { connect } from 'react-redux'
import { useParams } from 'react-router-dom'
import cx from 'classnames'
import * as d3 from 'utils/d3'
import compose from 'lodash/flowRight'
import 'element-scroll-polyfill'

import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import { lighten } from '@material-ui/core/styles'

import LineChart from 'components/Chart/LineChart'
import styles from 'ducks/balance/History.styl'
import flag from 'cozy-flags'
import { getChartDataSelector as getChartData } from 'ducks/chart/selectors'

// on iOS white transparency on SVG failed so we should calculate hexa color
const gradientColor = '#297ef2'
const gradientStyle = {
  '0%': lighten(gradientColor, 0.48),
  '100%': gradientColor
}

const getTooltipContent = (item, f) => {
  const date = f(item.x, 'D MMM')
  const balance = item.y.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

  return [
    { content: date },
    {
      content: flag('amount-blur') ? 'XXX' : balance,
      style: 'font-weight: bold'
    },
    { content: '€' }
  ]
}

const HistoryChart = props => {
  const { f } = useI18n()
  const container = useRef()
  const { data, height, minWidth, className, animation } = props
  const intervalBetweenPoints = 2
  const width = Math.max(minWidth, intervalBetweenPoints * data.length)
  const getTooltipContentCb = useCallback(
    item => {
      return getTooltipContent(item, f)
    },
    [f]
  )

  useEffect(() => {
    const currContainer = container.current
    currContainer.scrollTo(currContainer.scrollWidth, 0)
  }, [])

  return (
    <div className={cx(styles.HistoryChart, className)} ref={container}>
      <LineChart
        animation={animation}
        xScale={d3.scaleTime}
        lineColor="white"
        axisColor="white"
        labelsColor="rgba(255, 255, 255, 0.64)"
        gradient={gradientStyle}
        pointFillColor="white"
        pointStrokeColor="rgba(255, 255, 255, 0.3)"
        getTooltipContent={getTooltipContentCb}
        data={data}
        width={width}
        height={height}
        {...props}
      />
    </div>
  )
}

const EnhancedHistoryChart = HistoryChart

const ConnectedHistoryChart = compose(
  connect((state, ownProps) => ({
    data: getChartData(state, ownProps)
  }))
)(HistoryChart)

const ConnectedHistoryChartWrapper = ({ children, ...props }) => {
  const params = useParams()
  return (
    <ConnectedHistoryChart params={params} {...props}>
      {children}
    </ConnectedHistoryChart>
  )
}

export { ConnectedHistoryChartWrapper as ConnectedHistoryChart }

export default EnhancedHistoryChart
