import React, { Component } from 'react'
import DefaultTableOfContents from 'react-styleguidist/lib/client/rsg-components/TableOfContents/TableOfContentsRenderer'

export default class TableOfContents extends Component {
  constructor(props) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
    this.state = {
      theme: localStorage.getItem('theme')
    }
  }

  handleChange(ev) {
    localStorage.setItem('theme', ev.target.value)
    window.location.reload()
  }

  render() {
    return (
      <>
        <select
          className="u-m-1 u-mb-0"
          value={this.state.theme}
          onChange={this.handleChange}
        >
          <option>normal</option>
          <option>inverted</option>
        </select>
        <DefaultTableOfContents {...this.props} />
      </>
    )
  }
}
