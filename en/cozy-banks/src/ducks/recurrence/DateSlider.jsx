import React, { useCallback } from 'react'
import addDays from 'date-fns/add_days'

import { ONE_DAY } from 'ducks/recurrence/constants'

const sliderStyle = { width: '500px' }

const DateSlider = ({ date, onChange }) => {
  const handleChange = useCallback(
    ev => {
      const deltaDays = parseInt(ev.target.value, 10)
      onChange(addDays(Date.now(), deltaDays).toISOString().slice(0, 10))
    },
    [onChange]
  )

  const value = Math.floor((new Date(date) - Date.now()) / ONE_DAY)
  return (
    <span>
      {date}{' '}
      <input
        type="range"
        value={value}
        min={-780}
        max={0}
        step={1}
        onChange={handleChange}
        style={sliderStyle}
      />
    </span>
  )
}

export default DateSlider
