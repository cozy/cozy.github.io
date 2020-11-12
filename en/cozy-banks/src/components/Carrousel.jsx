import React, { useState, useCallback } from 'react'
import SwipeableViews from 'react-swipeable-views'

import { Media, Bd, Img } from 'cozy-ui/transpiled/react/Media'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'

import Icon from 'cozy-ui/transpiled/react/Icon'
import range from 'lodash/range'

import LeftIcon from 'cozy-ui/transpiled/react/Icons/Left'
import RightIcon from 'cozy-ui/transpiled/react/Icons/Right'

const hidden = {
  visibility: 'hidden'
}

const useCounter = (min, max) => {
  const [index, setIndex] = useState(min)
  const handleChange = useCallback(
    i => {
      setIndex(i)
    },
    [setIndex]
  )
  const handlePrev = useCallback(() => {
    setIndex(Math.max(min, index - 1))
  }, [index, min])
  const handleNext = useCallback(() => {
    setIndex(Math.min(max - 1, index + 1))
  }, [max, index])
  return [index, handleChange, handlePrev, handleNext]
}

const Carrousel = props => {
  const { children, className } = props
  const [index, handleChange, handlePrev, handleNext] = useCounter(
    0,
    children.length
  )
  const { isMobile } = useBreakpoints()

  return (
    <Media className={className}>
      <Img
        style={index === 0 ? hidden : null}
        className="u-c-pointer u-slateGrey"
        onClick={handlePrev}
        data-testid="carrousel-previous"
      >
        <Icon className={isMobile ? 'u-mh-half' : 'u-mh-1'} icon={LeftIcon} />
      </Img>
      <Bd>
        <SwipeableViews animateHeight disabled index={index}>
          {React.Children.map(children, (child, i) => {
            return React.cloneElement(child, { active: i === index })
          })}
        </SwipeableViews>
        <div className="u-ta-center u-slateGrey u-c-pointer">
          {range(children.length).map((x, i) => (
            <span key={i} onClick={() => handleChange(i)}>
              {i === index ? '●' : '○'}
            </span>
          ))}
        </div>
      </Bd>
      <Img
        style={index === children.length - 1 ? hidden : null}
        className="u-c-pointer u-slateGrey"
        onClick={handleNext}
        data-testid="carrousel-next"
      >
        <Icon className={isMobile ? 'u-mh-half' : 'u-mh-1'} icon={RightIcon} />
      </Img>
    </Media>
  )
}

export default React.memo(Carrousel)
