import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Row, { RowBody } from 'components/Row'
import { translate, Button } from 'cozy-ui/react'

export const ChooseButton = translate()(({ onClick, t }) => (
  <Button
    className="u-m-0 u-ph-half"
    theme="secondary"
    label={t('General.choose')}
    size="small"
    onClick={onClick}
  />
))
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

  componentWillUnmount() {
    this.unmounted = true
  }

  resetHistory() {
    if (this.unmounted) {
      return
    }
    this.setState({ history: [this.props.options] })
  }

  handleBack = () => {
    const [item, ...newHistory] = this.state.history
    this.setState({
      history: newHistory
    })
    return item
  }

  handleNavToChildren = item => {
    const newHistory = [item, ...this.state.history]
    this.setState({
      history: newHistory
    })
  }

  handleSelect = item => {
    this.props.onSelect(item)
    setTimeout(() => {
      this.resetHistory()
    }, 500)
  }

  handleClickItem = item => {
    if (item.children && item.children.length > 0) {
      this.handleNavToChildren(item)
    } else {
      this.handleSelect(item)
    }
  }

  render() {
    const { ContentComponent, HeaderComponent, canSelectParent } = this.props
    const { history } = this.state
    const current = history[0]
    const children = current.children || []
    const level = history.length - 1
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
              isSelected={this.props.isSelected(item, level)}
              icon={item.icon}
              onClick={() => this.handleClickItem(item)}
              hasArrow={item.children && item.children.length > 0}
            >
              <RowBody>{item.title}</RowBody>
              {item.children && canSelectParent ? (
                <ChooseButton onClick={() => this.handleSelect(item)} />
              ) : null}
            </Row>
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
  isSelected: PropTypes.func.isRequired,
  options: PropTypes.shape({
    children: PropTypes.arrayOf(ItemPropType)
  }),
  canSelectParent: PropTypes.bool
}

export default MultiSelect
