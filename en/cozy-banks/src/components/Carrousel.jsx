import React from 'react'
import compose from 'lodash/flowRight'
import SwipeableViews from 'react-swipeable-views'
import { Media, Bd, Img } from 'cozy-ui/transpiled/react/Media'
import { withBreakpoints } from 'cozy-ui/transpiled/react'
import Icon from 'cozy-ui/transpiled/react/Icon'
import range from 'lodash/range'

const hidden = {
  visibility: 'hidden'
}

class Carrousel extends React.PureComponent {
  constructor(props, context) {
    super(props, context)
    this.state = { currentIndex: 0 }
    this.handleChange = this.handleChange.bind(this)
    this.handlePrev = this.handlePrev.bind(this)
    this.handleNext = this.handleNext.bind(this)
  }

  handleChange(i) {
    this.setState({ currentIndex: i })
  }

  handlePrev() {
    this.setState({ currentIndex: Math.max(0, this.state.currentIndex - 1) })
  }

  handleNext() {
    this.setState({
      currentIndex: Math.min(
        this.props.children.length - 1,
        this.state.currentIndex + 1
      )
    })
  }

  render() {
    const { currentIndex } = this.state
    const {
      children,
      className,
      breakpoints: { isMobile }
    } = this.props
    return (
      <Media className={className}>
        <Img
          style={currentIndex === 0 ? hidden : null}
          className="u-c-pointer u-slateGrey"
          onClick={this.handlePrev}
        >
          <Icon className={isMobile ? 'u-mh-half' : 'u-mh-1'} icon="left" />
        </Img>
        <Bd>
          <SwipeableViews animateHeight disabled index={currentIndex}>
            {React.Children.map(children, (child, i) => {
              return React.cloneElement(child, { active: i === currentIndex })
            })}
          </SwipeableViews>
          <div className="u-ta-center u-slateGrey u-c-pointer">
            {range(children.length).map((x, i) => (
              <span key={i} onClick={this.handleChange.bind(this, i)}>
                {i === currentIndex ? '●' : '○'}
              </span>
            ))}
          </div>
        </Bd>
        <Img
          style={currentIndex === children.length - 1 ? hidden : null}
          className="u-c-pointer u-slateGrey"
          onClick={this.handleNext}
        >
          <Icon className={isMobile ? 'u-mh-half' : 'u-mh-1'} icon="right" />
        </Img>
      </Media>
    )
  }
}

export default compose(
  withBreakpoints(),
  React.memo
)(Carrousel)
