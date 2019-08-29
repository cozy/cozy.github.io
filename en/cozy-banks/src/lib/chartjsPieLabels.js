// From https://github.com/emn178/Chart.PieceLabel.js
// Just replaced format by labelFormater to work correctly

/* global Chart */

function drawArcText(
  context,
  str,
  centerX,
  centerY,
  radius,
  startAngle,
  endAngle
) {
  context.save()
  context.translate(centerX, centerY)
  startAngle += Math.PI / 2
  endAngle += Math.PI / 2
  let mertrics = context.measureText(str)
  startAngle += (endAngle - (mertrics.width / radius + startAngle)) / 2
  context.rotate(startAngle)
  for (let i = 0; i < str.length; i++) {
    const char = str.charAt(i)
    mertrics = context.measureText(char)
    context.save()
    context.translate(0, -1 * radius)
    context.fillText(char, 0, 0)
    context.restore()
    context.rotate(mertrics.width / radius)
  }
  context.restore()
}

export const pieLabelsPlugin = {
  afterDraw: function(chartInstance) {
    if (!chartInstance.options.pieceLabel) {
      return
    }
    const ctx = chartInstance.chart.ctx
    const options = chartInstance.config.options
    const arcText = chartInstance.options.pieceLabel.arcText
    const labelFormater = chartInstance.options.pieceLabel.labelFormater
    const precision = chartInstance.options.pieceLabel.precision || 0
    const fontSize =
      chartInstance.options.pieceLabel.fontSize || options.defaultFontSize
    const fontColor = chartInstance.options.pieceLabel.fontColor || '#fff'
    const fontStyle =
      chartInstance.options.pieceLabel.fontStyle || options.defaultFontStyle
    const fontFamily =
      chartInstance.options.pieceLabel.fontFamily || options.defaultFontFamily
    const hasTooltip =
      chartInstance.tooltip._active && chartInstance.tooltip._active.length

    chartInstance.config.data.datasets.forEach(dataset => {
      const meta = dataset._meta[Object.keys(dataset._meta)[0]]
      let totalPercentage = 0
      for (let i = 0; i < meta.data.length; i++) {
        const element = meta.data[i]
        const view = element._view

        if (hasTooltip) {
          element.draw()
        }

        let text, value, percentage
        switch (chartInstance.options.pieceLabel.mode) {
          case 'value':
            value = dataset.data[i]
            if (labelFormater) {
              value = labelFormater(value)
            }
            text = value.toString()
            break
          case 'label':
            text = chartInstance.config.data.labels[i]
            break
          case 'percentage':
          default:
            percentage = (view.circumference / options.circumference) * 100
            percentage = parseFloat(percentage.toFixed(precision))
            totalPercentage += percentage
            if (totalPercentage > 100) {
              percentage -= totalPercentage - 100
              // After adjusting the percentage, need to trim the numbers after decimal points again, otherwise it may not show
              // on chart due to very long number after decimal point.
              percentage = parseFloat(percentage.toFixed(precision))
            }
            text = percentage + '%'
            break
        }
        ctx.save()
        ctx.beginPath()
        ctx.font = Chart.helpers.fontString(fontSize, fontStyle, fontFamily)
        const mertrics = ctx.measureText(text)
        const tooltipPosition = element.tooltipPosition()
        const left = tooltipPosition.x - mertrics.width / 2
        const right = tooltipPosition.x + mertrics.width / 2
        const top = tooltipPosition.y - fontSize / 2
        const bottom = tooltipPosition.y + fontSize / 2
        const inRange =
          element.inRange(left, top) &&
          element.inRange(left, bottom) &&
          element.inRange(right, top) &&
          element.inRange(right, bottom)
        if (inRange) {
          ctx.fillStyle = fontColor
          if (arcText) {
            ctx.textBaseline = 'middle'
            drawArcText(
              ctx,
              text,
              view.x,
              view.y,
              (view.innerRadius + view.outerRadius) / 2,
              view.startAngle,
              view.endAngle
            )
          } else {
            ctx.textBaseline = 'top'
            ctx.textAlign = 'center'
            ctx.fillText(
              text,
              tooltipPosition.x,
              tooltipPosition.y - fontSize / 2
            )
          }
        }
        ctx.restore()
      }
    })

    if (hasTooltip) {
      chartInstance.tooltip.draw()
    }
  }
}

export default pieLabelsPlugin
