import React from 'react'
import { fireEvent, render, wait } from '@testing-library/react'

import AppLike from 'test/AppLike'
import getClient from 'test/client'

import TagAddNewTagModal from './TagAddNewTagModal'

const setup = ({
  mockSave = jest.fn(),
  onClose = jest.fn(),
  onClick = jest.fn()
} = {}) => {
  const client = getClient()
  const defautlMockSave = mockSave.mockResolvedValue({ data: [] })
  client.save = defautlMockSave
  return render(
    <AppLike client={client}>
      <TagAddNewTagModal onClose={onClose} onClick={onClick} />
    </AppLike>
  )
}

describe('TagAddNewTagModal', () => {
  it('should not save a new tag if the field contains only spaces', () => {
    const mockSave = jest.fn()
    const { getByTestId } = setup({ mockSave })

    const newTagInput = getByTestId('TagAddNewTagModal-TextField')
    const submitButton = getByTestId('TagAddNewTagModal-Button-submit')

    fireEvent.change(newTagInput, { target: { value: '   ' } })
    expect(submitButton).toHaveProperty('disabled', true)
    expect(newTagInput).toHaveProperty('value', '')

    fireEvent.click(submitButton)
    expect(mockSave).toBeCalledTimes(0)
  })

  it('should not set value if start with a space', () => {
    const mockSave = jest.fn()
    const { getByTestId } = setup({ mockSave })

    const newTagInput = getByTestId('TagAddNewTagModal-TextField')
    const submitButton = getByTestId('TagAddNewTagModal-Button-submit')

    fireEvent.change(newTagInput, { target: { value: ' abc' } })
    expect(submitButton).toHaveProperty('disabled', true)
    expect(newTagInput).toHaveProperty('value', '')

    fireEvent.click(submitButton)
    expect(mockSave).toBeCalledTimes(0)
  })

  it('should not save a new tag if the field is empty', () => {
    const mockSave = jest.fn()
    const { getByTestId } = setup({ mockSave })

    const newTagInput = getByTestId('TagAddNewTagModal-TextField')
    const submitButton = getByTestId('TagAddNewTagModal-Button-submit')

    fireEvent.change(newTagInput, { target: { value: '' } })
    expect(submitButton).toHaveProperty('disabled', true)
    expect(newTagInput).toHaveProperty('value', '')

    fireEvent.click(submitButton)
    expect(mockSave).toBeCalledTimes(0)
  })

  it('should remove spaces after label before saving them', () => {
    const mockSave = jest.fn()
    const { getByTestId } = setup({ mockSave })

    const newTagInput = getByTestId('TagAddNewTagModal-TextField')
    const submitButton = getByTestId('TagAddNewTagModal-Button-submit')

    fireEvent.change(newTagInput, { target: { value: 'text value    ' } })
    expect(newTagInput).toHaveProperty('value', 'text value    ')

    fireEvent.click(submitButton)
    expect(mockSave).toBeCalledWith({
      _type: 'io.cozy.tags',
      label: 'text value'
    })
  })

  it('should call "onClick" prop, if exist, after save new tag', async () => {
    const mockOnClick = jest.fn()
    const { getByTestId } = setup({ onClick: mockOnClick })

    const newTagInput = getByTestId('TagAddNewTagModal-TextField')
    const submitButton = getByTestId('TagAddNewTagModal-Button-submit')

    fireEvent.change(newTagInput, { target: { value: 'value' } })
    fireEvent.click(submitButton)

    await wait(() => {
      expect(mockOnClick).toBeCalledTimes(1)
    })
  })

  it('should call "onClose" prop after save new tag', async () => {
    const mockOnClose = jest.fn()
    const { getByTestId } = setup({ onClose: mockOnClose })

    const newTagInput = getByTestId('TagAddNewTagModal-TextField')
    const submitButton = getByTestId('TagAddNewTagModal-Button-submit')

    fireEvent.change(newTagInput, { target: { value: 'value' } })
    fireEvent.click(submitButton)

    await wait(() => {
      expect(mockOnClose).toBeCalledTimes(1)
    })
  })
})
