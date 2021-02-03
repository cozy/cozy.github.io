import React, { Component } from 'react'
import DefaultSectionsRenderer from 'react-styleguidist/lib/client/rsg-components/Sections/SectionsRenderer'
import IconSprite from '../../react/Icon/Sprite'

export default class SectionsRenderer extends Component {
  render() {
    return (
      <>
        <DefaultSectionsRenderer>{this.props.children}</DefaultSectionsRenderer>
      </>
    )
  }
}
