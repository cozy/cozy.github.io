import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Row from 'components/Row'

/**
 * Select like component to choose an option among a list of options.
 * Options can have children; selecting an option that has children
 * will show the children of the chosen option instead of selecting
 * the option
 */
class MultiSelect extends Component {
  constructor(props) {
    super(props)
    this.state = {
      history: [props.options]
    }
  }

  resetHistory() {
    this.setState({ history: [this.props.options] })
  }

  handleBack = () => {
    const [item, ...newHistory] = this.state.history
    this.setState({
      history: newHistory
    })
    return item
  }

  handleSelect = item => {
    if (item.children && item.children.length > 0) {
      const newHistory = [item, ...this.state.history]
      this.setState({
        history: newHistory
      })
    } else {
      this.props.onSelect(item)
      setTimeout(() => {
        this.resetHistory()
      }, 500)
    }
  }

  render() {
    const { ContentComponent, HeaderComponent } = this.props
    const { history } = this.state
    const current = history[0]
    const children = current.children || []
    return (
      <>
        {HeaderComponent ? (
          <HeaderComponent
            title={current.title}
            showBack={history.length > 1}
            onClickBack={this.handleBack}
          />
        ) : null}
        <ContentComponent>
          {children.map(item => (
            <Row
              key={item.title}
              isSelected={this.props.isSelected(item)}
              icon={item.icon}
              label={item.title}
              onClick={() => this.handleSelect(item)}
              hasArrow={item.children && item.children.length > 0}
            />
          ))}
        </ContentComponent>
      </>
    )
  }
}

MultiSelect.defaultProps = {
  ContentComponent: 'div',
  HeaderComponent: null
}

const ItemPropType = PropTypes.shape({
  icon: PropTypes.element.isRequired,
  title: PropTypes.string.isRequired
})

MultiSelect.propTypes = {
  onSelect: PropTypes.func.isRequired,
  isSelected: PropTypes.bool.isRequired,
  options: PropTypes.shape({
    children: PropTypes.arrayOf(ItemPropType)
  })
}

export default MultiSelect
