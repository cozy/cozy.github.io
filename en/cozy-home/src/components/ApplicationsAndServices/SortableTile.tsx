import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import cx from 'classnames'
import React, { memo } from 'react'

import { TileContent } from './TileContent'
import { SortableTileProps } from './types'

const SortableTileComponent = ({
  item,
  combineTarget,
  onOpenFolder
}: SortableTileProps): JSX.Element => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })
  // The dragged tile stays faded in place (the DragOverlay represents it);
  // siblings take the shuffle transform so they slide aside to make room.
  const style = {
    transform: isDragging ? undefined : CSS.Transform.toString(transform),
    transition
  }
  return (
    <div
      ref={setNodeRef}
      data-id={item.id}
      style={style}
      className={cx('home-item', {
        'home-item--placeholder': isDragging,
        'home-item--combine': combineTarget
      })}
      {...attributes}
      {...listeners}
    >
      <TileContent item={item} onOpenFolder={onOpenFolder} />
    </div>
  )
}

export const SortableTile = memo(SortableTileComponent)
