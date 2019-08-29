import React from 'react'
import { shallow } from 'enzyme'
import { flatten, merge } from 'lodash'
import Figure from './Figure'

const combine = (...iterables) => {
  if (iterables.length === 1) {
    return iterables[0].map(x => [x])
  } else {
    const combinationsNMinus1 = combine.apply(null, iterables.slice(1))
    return flatten(
      combinationsNMinus1.map(c => iterables[0].map(item => [item, ...c]))
    )
  }
}

const formatAttrs = attrs => {
  return Object.keys(attrs)
    .map(x => `${x}: ${attrs[x]}`)
    .join(', ')
}

describe('Figure', () => {
  const amounts = [-100, 100, 500, 4]

  const coloredAttributes = [
    'coloredPositive',
    'coloredNegative',
    'coloredWarning'
  ]

  const combinations = combine
    .apply(null, coloredAttributes.map(x => [{ [x]: true }, { [x]: false }]))
    .map(attrs => {
      return merge.apply(null, [{}, ...attrs])
    })

  for (let amount of amounts) {
    for (let attrs of combinations) {
      it(`should render correctly ${amount} ${formatAttrs(attrs)}`, () => {
        const el = shallow(
          <Figure warningLimit={110} total={amount} {...attrs} />
        ).getElement()
        expect(el).toMatchSnapshot()
      })
    }
  }
})
