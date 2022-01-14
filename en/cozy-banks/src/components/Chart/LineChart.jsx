import React, { Component } from 'react'
import PropTypes from 'prop-types'
import * as d3 from 'utils/d3'
import memoize from 'lodash/memoize'
import keyBy from 'lodash/keyBy'
import minBy from 'lodash/minBy'
import max from 'lodash/max'
import styles from 'components/Chart/LineChart.styl'

// TODO replace by import { getCSSVariableValue } from 'cozy-ui/transpiled/utils/colors'
// when https://github.com/cozy/cozy-ui/issues/1153 is solved
const getCSSPropertyValue = memoize(varName => {
  const computedStyle = getComputedStyle(document.body)
  return computedStyle.getPropertyValue(varName)
})

const makeDownwardTriangle = (centerTop, size) => {
  const [x, y] = centerTop
  return [
    [x - size / 2, y],
    [x + size / 2, y],
    [x, y + Math.sqrt(Math.pow(size, 2) - Math.pow(size / 2, 2))] // 0.75 is approx
  ]
}

const tooltipDimensions = {
  arrowSize: 5,
  bgHeight: 20,
  bgPadding: [5, 5],
  fontSize: 11
}

const getDataByDate = memoize(data => keyBy(data, i => i.x.getTime()))

class LineChart extends Component {
  constructor(props) {
    super(props)

    this.createScales()
    this.updateDomains()

    this.dragging = false

    this.state = {
      itemKey: null, // Currently "selected" point
      prevData: null
    }
  }

  getSelectedItem = () => {
    const { data } = this.props
    const { itemKey } = this.state
    const dataByDate = getDataByDate(data)

    return dataByDate[itemKey]
  }

  componentDidMount() {
    this.createElements()
    if (this.props.animation) {
      this.enterAnimation()
    }
    this.updateElements()
    this.movePointToItem()
  }

  static getDerivedStateFromProps(props, state) {
    const { data } = props

    // If currently displayed data changes, we recompute selected itemkey
    if (!state || state.prevData !== data) {
      const dataByDate = getDataByDate(data)
      const itemKey = max(Object.keys(dataByDate))
      // Have to keep prevData in derivedState to access it in later calls
      // of getDerivedStateFromProps. See https://github.com/facebook/react/issues/12188
      return { prevData: data, itemKey }
    }

    return null
  }

  componentDidUpdate(prevProps, prevState) {
    const itemKeyUpdate = this.state.itemKey !== prevState.itemKey
    const widthUpdate = this.props.width !== prevProps.width
    const marginUpdate = this.props.margin !== prevProps.margin
    const dataUpdate = this.props.data !== prevProps.data

    if (marginUpdate) {
      this.updateRoot()
    }

    if (widthUpdate || dataUpdate) {
      this.updateScales()
      this.updateGradient()
      this.updateAxis()
      this.updateLine()
      this.movePointToItem()
    } else if (itemKeyUpdate) {
      this.movePointToItem()
    }
  }

  /**
   * Create all graph elements
   */
  createElements() {
    this.createRoot()
    this.createGradient()
    this.createPointLine()
    this.createLine()
    this.createPoint()
    this.createTooltip()
    this.createAxis()
  }

  updateElements() {
    this.updateRoot()
    this.updateScales()
    this.updateGradient()
    this.updateAxis()
    this.updateLine()
    this.updateTooltip()
  }

  /**
   * Creates the x and y scales used to transform values to pixels
   */
  createScales() {
    const { xScale, yScale } = this.props

    this.x = xScale().range([0, this.getInnerWidth()])
    this.y = yScale().range([this.getInnerHeight(), 0])
  }

  updateScales() {
    this.x.range([0, this.getInnerWidth()])
    this.y.range([this.getInnerHeight(), 0])

    this.updateDomains()
  }

  /**
   * Returns the width in which the chart will be drawn
   */
  getInnerWidth() {
    const { width, margin } = this.props
    return width - margin.left - margin.right
  }

  /**
   * Returns the height in which the chart will be drawn
   */
  getInnerHeight() {
    const { height, margin } = this.props
    return height - margin.top - margin.bottom
  }

  /**
   * Update the scales domains
   */
  updateDomains() {
    const { data } = this.props

    this.x.domain(d3.extent(data, d => d.x))

    let yDomain = d3.extent(data, d => d.y)

    // If min === max, the line will be drawn on the bottom, like
    // all values are the min. We want to opposite, so we set the
    // min to 0. This way the line will be drawn on the top
    if (yDomain[0] === yDomain[1]) {
      yDomain[0] = 0
    }

    this.y.domain(yDomain)
  }

  /**
   * Creates the element that will contains all others.
   * It is used to apply a translation on the whole chart content according to the margins we want to apply to it
   */
  createRoot() {
    this.svg = d3.select(this.root).append('g')
  }

  updateRoot() {
    const { margin } = this.props

    this.svg.attr('transform', `translate(${margin.left}, ${margin.top})`)
  }

  /**
   * Create the gradient element
   */
  createGradient() {
    const { gradient } = this.props

    if (!gradient) {
      return
    }

    this.areaGenerator = d3
      .area()
      .x(d => this.x(d.x))
      .y1(d => this.y(d.y))

    this.mask = this.svg
      .append('mask')
      .attr('id', 'maskurl')
      .append('path')
      .attr('fill', 'white')

    this.rect = this.svg
      .append('rect')
      .attr('id', 'gradient-rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('mask', 'url(#maskurl)')
      .attr('fill', 'url(#gradient)')
  }

  updateGradient() {
    if (this.rect) {
      const { data, showAxis, margin } = this.props
      const minY = this.getDataMin()
      const innerHeight = this.getInnerHeight()
      this.areaGenerator.y0(() => {
        let min = this.y(minY.y)

        if (min === 0) {
          min += innerHeight
        }

        if (!showAxis) {
          min += margin.bottom
        }

        return min
      })

      const height = innerHeight + (showAxis ? 0 : margin.bottom)

      this.rect.attr('width', this.getInnerWidth()).attr('height', height)

      this.mask.datum(data).attr('d', this.areaGenerator)
    }
  }

  /**
   * Generate the data line
   */
  createLine() {
    const { lineColor, lineWidth } = this.props

    this.lineGenerator = d3
      .line()
      .x(d => this.x(d.x))
      .y(d => this.y(d.y))

    this.line = this.svg
      .append('path')
      .attr('id', 'line')
      .attr('stroke', lineColor)
      .attr('fill', 'none')
      .attr('stroke-width', lineWidth)

    this.clickLine = this.svg
      .append('path')
      .attr('id', 'clickLine')
      .attr('stroke', 'transparent')
      .attr('stroke-width', 64)
      .style('cursor', 'pointer')
      .attr('fill', 'none')
      .on('click', this.onLineClick)

    this.updateLine()
  }

  updateLine() {
    const { data } = this.props

    this.line.datum(data).attr('d', this.lineGenerator)

    this.clickLine.datum(data).attr('d', this.lineGenerator)
  }

  /**
   * Generate the selected point
   */
  createPoint() {
    const { pointRadius, pointFillColor, pointStrokeColor, pointStrokeWidth } =
      this.props

    const drag = d3.drag()

    this.point = this.svg
      .append('circle')
      .attr('r', pointRadius)
      .attr('fill', pointFillColor)
      .attr('stroke-width', pointStrokeWidth)
      .attr('stroke', pointStrokeColor)

    // We set a radius of 24 so the point will have a diameter of 48,
    // respecting the standard dimensions for a touchable element
    const CLICK_POINT_RADIUS = 24

    this.clickPoint = this.svg
      .append('circle')
      .attr('r', CLICK_POINT_RADIUS)
      .attr('fill', 'transparent')
      .call(drag.on('start', this.startPointDrag))
      .call(drag.on('drag', this.pointDrag))
      .call(drag.on('end', this.stopPointDrag))
  }

  createTooltip() {
    const { bgHeight, arrowSize, fontSize } = tooltipDimensions

    // The tooltip group oriign will be positionned at the x,y-arrowSize
    // of the point on the curve
    this.tooltip = this.svg.append('g')

    // The width of the background will be automatically updated based on the
    // width of the text
    this.tooltipBg = this.tooltip
      .append('rect')
      .attr('fill', getCSSPropertyValue('--historyTooltipBackgroundColor'))
      .attr('y', -bgHeight)
      .attr('height', bgHeight)

    const trianglePoints = makeDownwardTriangle([0, 0], arrowSize)
      .map(p => p.join(','))
      .join(' ')
    this.tooltipArrow = this.tooltip
      .append('polygon')
      .attr('points', trianglePoints)
      .attr('fill', getCSSPropertyValue('--historyTooltipBackgroundColor'))

    this.tooltipText = this.tooltip
      .append('text')
      .attr('fill', getCSSPropertyValue('--historyTooltipTextColor'))
      .attr('style', `font-size: ${fontSize}px; font-family: Lato`)
      .attr('x', 0)
      .attr('y', -fontSize / 2) // half the font-size
  }

  updateTooltip() {
    const { bgPadding, arrowSize } = tooltipDimensions
    const item = this.getSelectedItem()
    if (!item) {
      return
    }
    const x = this.x(item.x)
    const y = -arrowSize
    this.tooltip.attr('transform', `translate(${x}, ${y})`)

    const tspans = this.props.getTooltipContent(item)
    this.tooltipText.selectAll('*').remove()

    tspans.forEach(tspan => {
      this.tooltipText
        .append('tspan')
        .text(tspan.content + ' ')
        .attr('style', tspan.style)
    })
    const tl = this.tooltipText.node().getComputedTextLength()

    const switchOrientation = x < tl

    const [paddingH] = bgPadding
    this.tooltipBg
      .attr('x', switchOrientation ? -paddingH : -tl - paddingH)
      .attr('width', tl + paddingH * 2)

    this.tooltipText.attr('text-anchor', switchOrientation ? 'start' : 'end')
  }

  updatePoint() {
    const item = this.getSelectedItem()
    if (!item) {
      return
    }
    const x = this.x(item.x)
    const y = this.y(item.y)

    this.point.attr('cx', x).attr('cy', y)
    this.clickPoint.attr('cx', x).attr('cy', y)
  }

  /**
   * Generate the vertical line that follows the point
   */
  createPointLine() {
    this.pointLine = this.svg
      .append('line')
      .attr('stroke-width', 1)
      .attr('stroke', this.props.lineColor)
      .attr('stroke-dasharray', '3,2')
  }

  updatePointLine() {
    const item = this.getSelectedItem()
    if (!item) {
      return
    }
    const { height, margin, tickPadding, showAxis } = this.props
    const x = this.x(item.x)
    let y2 = height - margin.top + tickPadding

    if (showAxis) {
      y2 -= margin.bottom
    }

    this.pointLine.attr('x1', x).attr('y1', 0).attr('x2', x).attr('y2', y2)
  }

  /**
   * Generate the horizontal axis
   */
  createAxis() {
    const {
      tickSizeOuter,
      tickSizeInner,
      tickPadding,
      nbTicks,
      tickFormat,
      showAxis
    } = this.props

    this.xAxisGenerator = d3
      .axisBottom(this.x)
      .tickSizeOuter(tickSizeOuter)
      .tickSizeInner(tickSizeInner)
      .tickPadding(tickPadding)

    if (nbTicks !== undefined) {
      this.xAxisGenerator.ticks(nbTicks)
    }

    if (tickFormat) {
      this.xAxisGenerator.tickFormat(tickFormat)
    }

    if (showAxis) {
      this.axis = this.svg.append('g')
    }
  }

  updateAxis() {
    const { axisColor, labelsColor, showAxis, axisMargin } = this.props

    if (showAxis) {
      this.axis.attr(
        'transform',
        `translate(0, ${this.getInnerHeight() + axisMargin})`
      )
      this.axis.call(this.xAxisGenerator)
      this.axis.selectAll('.domain').attr('stroke', axisColor)
      this.axis.selectAll('.tick line').attr('stroke', axisColor)
      this.axis
        .selectAll('.tick text')
        .attr('fill', labelsColor)
        .attr('font-family', 'Lato, sans-serif')
        .attr('font-size', '0.75rem')
        .attr('style', 'text-transform: uppercase')
    }
  }

  /**
   * Get the minimum y value in data
   */
  getDataMin() {
    return minBy(this.props.data, d => d.y)
  }

  enterAnimation() {
    const lineTotalLength = this.line.node().getTotalLength()

    this.tooltip.attr('style', 'opacity: 0')

    this.point.attr('r', 0).attr('stroke-width', 0)
    this.pointLine.attr('opacity', 0)

    if (this.mask) {
      this.mask.attr('opacity', 0)
    }

    // We do not know where exactly this comes from but without it a bit of the end
    // of the line is visible just before the animation as if the line was too offsetted.
    // This is why we need to remove a bit of the offset.
    const OFFSET = -60

    this.line
      .attr('stroke-dasharray', lineTotalLength)
      .attr('stroke-dashoffset', lineTotalLength + OFFSET)
      .transition()
      .duration(this.props.enterAnimationDuration)
      .ease(d3.easeExpInOut)
      .attr('stroke-dashoffset', 0)
      .on('end', () => {
        if (this.mask) {
          this.mask
            .transition()
            .duration(250)
            .ease(d3.easeLinear)
            .attr('opacity', 1)

          this.point
            .transition()
            .duration(200)
            .ease(d3.easeLinear)
            .attr('r', this.props.pointRadius)
            .attr('stroke-width', this.props.pointStrokeWidth)

          this.pointLine
            .transition()
            .duration(400)
            .ease(d3.easeExpIn)
            .attr('opacity', 1)

          this.tooltip
            .transition()
            .duration(200)
            .ease(d3.easeLinear)
            .style('opacity', 1)
        }

        this.line.attr('stroke-dasharray', null)
      })
  }

  onLineClick = () => {
    const [mouseX] = d3.mouse(this.clickLine.node())
    this.setItemFromMouseX(mouseX)
  }

  getItemAt(x) {
    const { data } = this.props
    const date = this.x.invert(x)

    const bisectX = d3.bisector(d => d.x).right
    const nearestIndex = bisectX(data, date)

    return data[nearestIndex]
  }

  movePointToItem() {
    if (!this.point) {
      return
    }

    this.updatePoint()
    this.updatePointLine()
    this.updateTooltip()
  }

  startPointDrag = () => {
    this.dragging = true
  }

  pointDrag = () => {
    if (!this.dragging) {
      return
    }

    const [mouseX] = d3.mouse(this.svg.node())
    this.setItemFromMouseX(mouseX)
  }

  setItemFromMouseX = mouseX => {
    const x = Math.min(mouseX, this.getInnerWidth() - 1)
    const itemKey = this.getItemAt(x).x.getTime()

    this.setState({ itemKey })
  }

  stopPointDrag = () => {
    this.dragging = false
  }

  render() {
    const { width, height, gradient } = this.props

    return (
      <div className={styles.LineChart}>
        <svg
          ref={node => (this.root = node)}
          width={width}
          height={height}
          className={styles.LineChartSVG}
        >
          {gradient && (
            <defs>
              <linearGradient id="gradient" x2="0%" y2="100%">
                {Object.entries(gradient).map(([offset, color]) => (
                  <stop key={offset} offset={offset} stopColor={color} />
                ))}
              </linearGradient>
            </defs>
          )}
        </svg>
      </div>
    )
  }
}

LineChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      x: PropTypes.any,
      y: PropTypes.any
    })
  ).isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  margin: PropTypes.shape({
    top: PropTypes.number,
    bottom: PropTypes.number,
    left: PropTypes.number,
    right: PropTypes.number
  }),
  lineWidth: PropTypes.number,
  lineColor: PropTypes.string,
  nbTicks: PropTypes.number,
  tickFormat: PropTypes.func,
  tickPadding: PropTypes.number,
  xScale: PropTypes.func,
  yScale: PropTypes.func,
  axisColor: PropTypes.string,
  axisMargin: PropTypes.number,
  gradient: PropTypes.object,
  enterAnimationDuration: PropTypes.number,
  showAxis: PropTypes.bool,
  pointRadius: PropTypes.number,
  pointFillColor: PropTypes.string,
  pointStrokeWidth: PropTypes.number,
  pointStrokeColor: PropTypes.string,
  getTooltipContent: PropTypes.func
}

LineChart.defaultProps = {
  margin: { top: 0, bottom: 0, left: 0, right: 0 },
  lineWidth: 2,
  lineColor: 'black',
  xScale: d3.scaleLinear,
  yScale: d3.scaleLinear,
  axisColor: 'black',
  labelsColor: 'black',
  axisMargin: 0,
  enterAnimationDuration: 1000,
  showAxis: false,
  tickPadding: 8,
  tickSizeOuter: 0,
  tickSizeInner: 5,
  pointRadius: 4,
  pointFillColor: 'black',
  pointStrokeWidth: 10,
  pointStrokeColor: 'rgba(0, 0, 0, 0.3)',
  animation: true
}

export default LineChart
