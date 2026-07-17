import { DndContext } from '@dnd-kit/core'
import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'

import { FolderDialog } from './FolderDialog'
import { FolderItem } from './types'

import AppLike from '@/test/AppLike'

jest.mock('@/components/AppTile', () => ({
  __esModule: true,
  default: ({ app }: { app: { slug: string } }): JSX.Element => (
    <div data-testid="inner">{app.slug}</div>
  )
}))

const folder: FolderItem = {
  type: 'folder',
  id: 'folder:x',
  name: 'Banques',
  items: [{ type: 'app', id: 'app:drive', app: { slug: 'drive' } as never }]
}

const setup = (
  props = {}
): {
  onClose: jest.Mock
  onRename: jest.Mock
  onDissolve: jest.Mock
  onRemoveItem: jest.Mock
} => {
  const onClose = jest.fn()
  const onRename = jest.fn()
  const onDissolve = jest.fn()
  const onRemoveItem = jest.fn()
  render(
    <AppLike>
      <DndContext>
        <FolderDialog
          folder={folder}
          onClose={onClose}
          onRename={onRename}
          onDissolve={onDissolve}
          onRemoveItem={onRemoveItem}
          {...props}
        />
      </DndContext>
    </AppLike>
  )
  return { onClose, onRename, onDissolve, onRemoveItem }
}

describe('FolderDialog', () => {
  it('shows the folder name and inner tiles', () => {
    setup()
    expect(screen.getByDisplayValue('Banques')).toBeInTheDocument()
    expect(screen.getByTestId('inner')).toHaveTextContent('drive')
  })

  it('renames on blur', () => {
    const { onRename } = setup()
    const input = screen.getByDisplayValue('Banques')
    fireEvent.change(input, { target: { value: 'Comptes' } })
    fireEvent.blur(input)
    expect(onRename).toHaveBeenCalledWith('folder:x', 'Comptes')
  })

  it('dissolves from the actions menu', () => {
    const { onDissolve } = setup()
    fireEvent.click(screen.getByTestId('folder-menu'))
    fireEvent.click(screen.getByText('Dissolve the folder'))
    expect(onDissolve).toHaveBeenCalledWith('folder:x')
  })

  it('removes a single item', () => {
    const { onRemoveItem } = setup()
    fireEvent.click(screen.getByTestId('folder-remove-app:drive'))
    expect(onRemoveItem).toHaveBeenCalledWith('folder:x', 'app:drive')
  })
})
