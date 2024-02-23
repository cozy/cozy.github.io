import range from 'lodash/range'
import React, { useState, useCallback } from 'react'
import SwipeableViews from 'react-swipeable-views'

import Icon from 'cozy-ui/transpiled/react/Icon'
import LeftIcon from 'cozy-ui/transpiled/react/Icons/Left'
import RightIcon from 'cozy-ui/transpiled/react/Icons/Right'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'

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

const Carrousel = ({ children, className }) => {
  const { t } = useI18n()
  const [action, setAction] = useState(null)
  const [index, handleChange, handlePrev, handleNext] = useCounter(
    0,
    children.length
  )

  const handleAction = useCallback(action => {
    setAction(action)
  }, [])

  const handleContentUpdate = useCallback(() => {
    if (typeof action?.updateHeight === 'function') {
      action.updateHeight()
    }
  }, [action])

  return (
    <div className={className}>
      <SwipeableViews animateHeight index={index} action={handleAction}>
        {React.Children.map(children, (child, i) => {
          return React.cloneElement(child, {
            active: i === index,
            onContentUpdate: handleContentUpdate
          })
        })}
      </SwipeableViews>
      <div className="u-flex u-flex-items-center u-flex-justify-center">
        <div className="u-w-2-half">
          {index !== 0 ? (
            <IconButton
              onClick={handlePrev}
              size="medium"
              aria-label={t('Carrousel.previous')}
              className="u-slateGrey"
            >
              <Icon icon={LeftIcon} />
            </IconButton>
          ) : null}
        </div>
        <div className="u-ta-center u-slateGrey u-c-pointer u-mh-half">
          {range(children.length).map((x, i) => (
            <span key={i} onClick={() => handleChange(i)}>
              {i === index ? '●' : '○'}
            </span>
          ))}
        </div>
        <div className="u-w-2-half">
          {index !== children.length - 1 ? (
            <IconButton
              onClick={handleNext}
              size="medium"
              aria-label={t('Carrousel.next')}
              className="u-slateGrey"
            >
              <Icon icon={RightIcon} />
            </IconButton>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default React.memo(Carrousel)
