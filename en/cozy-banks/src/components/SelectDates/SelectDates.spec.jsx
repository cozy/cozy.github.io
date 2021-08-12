import React, { useState, useMemo } from 'react'
import { render, fireEvent } from '@testing-library/react'
import AppLike from 'test/AppLike'

import SelectDates from './SelectDates'
import { findSelectDatesInput } from 'test/selectDates'

import Select from 'react-select'
Select.defaultProps.menuIsOpen = true

const isButtonActive = node => node.getAttribute('aria-disabled') !== 'true'

const findButtons = root => {
  const prev = root.getByLabelText('Previous month')
  const next = root.getByLabelText('Next month')
  return { prev, next }
}

describe('SelectDates', () => {
  beforeEach(() => {})
  const options = [
    { yearMonth: '2017-10' },
    { yearMonth: '2017-11' },
    { yearMonth: '2018-01' },
    { yearMonth: '2018-02' },
    { yearMonth: '2018-04' }
  ]

  const tests = [
    {
      value: '2018-04',
      prev: false,
      next: true
    },
    {
      value: '2018-11',
      prev: true,
      next: true
    },
    {
      value: '2017-10',
      prev: true,
      next: false
    }
  ]

  for (let test of tests) {
    if (test.disabled) {
      continue
    }
    it(
      'should render correctly prev and next when value is ' + test.value,
      () => {
        const root = render(
          <AppLike>
            <SelectDates
              value={test.value}
              options={options}
              onChange={x => x}
            />
          </AppLike>
        )
        const { prev, next } = findButtons(root)
        expect(isButtonActive(prev)).toBe(test.prev)
        expect(isButtonActive(next)).toBe(test.next)
      }
    )
  }

  it('should behave correctly with undefined value', async () => {
    const onChange = jest.fn()
    const root = render(
      <AppLike>
        <SelectDates value={undefined} options={options} onChange={onChange} />
      </AppLike>
    )

    // When value is undefined, the first option is displayed
    expect(findSelectDatesInput(root).map(n => n.textContent)).toEqual([
      '2017',
      'October'
    ])
    const { prev, next } = findButtons(root)

    // Clicking on prev goes to the second option
    fireEvent.click(prev)
    expect(onChange).toHaveBeenCalledWith('2017-11')

    onChange.mockReset()

    fireEvent.click(next)
    // Already at latest, since onChange does nothing
    expect(onChange).not.toHaveBeenCalled()
  })

  it('should behave correctly with undefined value', async () => {
    const onChange = jest.fn()
    const root = render(
      <AppLike>
        <SelectDates
          value={undefined}
          options={[{ yearMonth: '2017-10' }]}
          onChange={onChange}
        />
      </AppLike>
    )

    // When value is undefined, the first option is displayed
    expect(findSelectDatesInput(root).map(n => n.textContent)).toEqual([
      '2017',
      'October'
    ])
  })

  it('should call on change if options changes', () => {
    const StatefulExample = ({ initialValue, onChange }) => {
      const [state, setState] = useState('A')
      const [value, setValue] = useState(initialValue)
      const handleChange = value => {
        setValue(value)
        onChange(value)
      }
      const options = useMemo(() => {
        switch (state) {
          case 'A':
            return [{ yearMonth: '2017-10' }]
          case 'B':
            return [{ yearMonth: '2021-01' }]
          case 'C':
            return [{ yearMonth: '2021-01' }, { yearMonth: '2021-02' }]
        }
      }, [state])
      return (
        <AppLike>
          <button onClick={() => setState('A')}>set state A</button>
          <button onClick={() => setState('B')}>set state B</button>
          <button onClick={() => setState('C')}>set state C</button>
          <SelectDates
            value={value}
            options={options}
            onChange={handleChange}
          />
        </AppLike>
      )
    }

    const onChange = jest.fn()
    const root = render(
      <StatefulExample initialValue="2017-10" onChange={onChange} />
    )

    expect(findSelectDatesInput(root).map(n => n.textContent)).toEqual([
      '2017',
      'October'
    ])
    fireEvent.click(root.getByText('set state B'))
    // 2017-10 is not contained in state A options: onChange is called
    // with the nearest value from state B options
    expect(onChange).toHaveBeenLastCalledWith('2021-01')
    expect(findSelectDatesInput(root).map(n => n.textContent)).toEqual([
      '2021',
      'January'
    ])
    fireEvent.click(root.getByText('set state A'))
    // 2021-01 is not contained in state A options: onChange is called
    // with the nearest value from state A options
    expect(onChange).toHaveBeenLastCalledWith('2017-10')
    expect(findSelectDatesInput(root).map(n => n.textContent)).toEqual([
      '2017',
      'October'
    ])
    fireEvent.click(root.getByText('set state B'))
    onChange.mockReset()
    // The value does not need to change here, no need to call onChange
    fireEvent.click(root.getByText('set state C'))
    expect(onChange).not.toHaveBeenCalled()
  })
})
