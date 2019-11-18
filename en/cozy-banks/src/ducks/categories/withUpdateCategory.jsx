import React, { Component } from 'react'
import CategoryChoice from 'ducks/categories/CategoryChoice'
import { getCategoryId } from 'ducks/categories/helpers'
import { withClient } from 'cozy-client'
import { updateTransactionCategory } from 'ducks/transactions/helpers'

export default (options = {}) => Wrapped =>
  withClient(
    class WithUpdateCategoryWrapper extends Component {
      state = {
        displaying: false
      }

      show = ev => {
        ev.stopPropagation() // otherwise the modal is closed immediately
        this.setState({ displaying: true })
      }

      hide = () => {
        this.setState({ displaying: false })
      }

      handleSelect = category => {
        this.hide()
        const { client, transaction } = this.props
        updateTransactionCategory(client, transaction, category)
      }

      render() {
        const { displaying } = this.state
        return (
          <React.Fragment>
            {!displaying && options.hideDisplaying ? null : (
              <Wrapped {...this.props} showCategoryChoice={this.show} />
            )}
            {displaying && (
              <CategoryChoice
                categoryId={getCategoryId(this.props.transaction)}
                onSelect={this.handleSelect}
                onCancel={this.hide}
              />
            )}
          </React.Fragment>
        )
      }
    }
  )
