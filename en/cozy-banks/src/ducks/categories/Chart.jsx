/*
Component to render a pie chart from data (size from props too)
*/

import styles from 'ducks/categories/Chart.styl'
import React, { Component } from 'react'
import { Doughnut, Chart as ReactChart, defaults } from 'react-chartjs-2'
import pieceLabel from 'lib/chartjsPieLabels'
import flag from 'cozy-flags'

// Disable animating charts by default.
if (flag('analysis.no-animation')) {
  defaults.global.animation = false
}

class Chart extends Component {
  state = {
    data: {
      labels: this.props.labels,
      datasets: [
        {
          data: this.props.data,
          backgroundColor: this.props.colors,
          borderWidth: 0
        }
      ]
    },
    options: {
      cutoutPercentage: 74,
      legend: {
        display: false
      },
      responsive: false,
      maintainAspectRatio: false,
      tooltips: {
        callbacks: {
          label: (tooltipItem, data) => {
            const label = data.labels[tooltipItem.index]
            return `${label}`
          },
          afterLabel: (tooltipItem, data) => {
            const value = data.datasets[0].data[tooltipItem.index]
            return `${value} €`
          }
        },
        bodySpacing: 4,
        xPadding: 8
      }
    }
  }

  UNSAFE_componentWillMount() {
    ReactChart.pluginService.register(pieceLabel)
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({
      data: {
        labels: nextProps.labels,
        datasets: [
          {
            data: nextProps.data,
            backgroundColor: nextProps.colors,
            borderWidth: 0
          }
        ]
      }
    })
  }

  click = e => {
    const { onClick } = this.props
    if (onClick) {
      if (e.length > 0) {
        onClick(e[0]._index)
      } else {
        onClick(undefined)
      }
    }
  }

  render() {
    const { width, height } = this.props
    const { data, options } = this.state
    return (
      <div className={styles['bnk-chart']}>
        <Doughnut
          data={data}
          options={options}
          onElementsClick={this.click}
          width={width}
          height={height}
        />
      </div>
    )
  }
}

export default Chart
