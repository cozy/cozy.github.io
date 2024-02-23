import React from 'react'
import { render, act, fireEvent, screen } from '@testing-library/react'
import Carrousel from './Carrousel'
import AppLike from 'test/AppLike'

const Slide = ({ children }) => {
  return <div>{children}</div>
}

describe('Carrousel', () => {
  it('should render correctly', () => {
    const root = render(
      <AppLike>
        <Carrousel>
          <Slide>Slide 1</Slide>
          <Slide>Slide 2</Slide>
          <Slide>Slide 3</Slide>
        </Carrousel>
      </AppLike>
    )
    expect(root.getByText('Slide 1')).toBeTruthy()
    expect(root.queryByText('Slide 2')).toBeFalsy()
    expect(screen.queryByLabelText(/previous/i)).toBeNull()
    act(() => {
      fireEvent.click(screen.getByLabelText(/next/i))
    })
    expect(root.queryByText('Slide 1')).toBeFalsy()
    expect(root.getByText('Slide 2')).toBeTruthy()
    act(() => {
      fireEvent.click(screen.getByLabelText(/previous/i))
    })
    expect(root.getByText('Slide 1')).toBeTruthy()
    expect(root.queryByText('Slide 2')).toBeFalsy()
  })
})
