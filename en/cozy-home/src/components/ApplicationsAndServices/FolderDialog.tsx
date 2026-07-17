import {
  SortableContext,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import cx from 'classnames'
import React, { useRef, useState } from 'react'

import {
  Icon,
  CrossCircleOutline as CrossCircleOutlineIcon,
  Dots as DotsIcon,
  Trash as TrashIcon
} from '@linagora/twake-icons'
import { Dialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import CozyTheme from 'cozy-ui-plus/dist/providers/CozyTheme'
import { useI18n } from 'twake-i18n'

import { TileContent } from './TileContent'
import {
  ActionsMenu,
  FolderDialogItemProps,
  FolderDialogProps,
  makeAction,
  makeActions,
  TextField
} from './types'

const FolderDialogItem = ({
  item,
  onRemove,
  removeLabel
}: FolderDialogItemProps): JSX.Element => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cx('home-folder-item', {
        'home-folder-item--dragging': isDragging
      })}
      data-id={item.id}
    >
      <IconButton
        className="home-folder-remove"
        size="small"
        aria-label={removeLabel}
        data-testid={`folder-remove-${item.id}`}
        onClick={() => onRemove(item.id)}
      >
        <Icon icon={CrossCircleOutlineIcon} size={18} />
      </IconButton>
      <div className="home-folder-item-icon" {...attributes} {...listeners}>
        <TileContent item={item} onOpenFolder={() => undefined} />
      </div>
    </div>
  )
}

export const FolderDialog = ({
  folder,
  onClose,
  onRename,
  onDissolve,
  onRemoveItem
}: FolderDialogProps): JSX.Element => {
  const { t } = useI18n()
  const [name, setName] = useState(folder.name)
  const [menuOpen, setMenuOpen] = useState(false)
  const anchorRef = useRef<HTMLButtonElement>(null)
  // Tracks the last persisted name so blur and close (which both fire when the
  // dialog is dismissed) do not save the same rename twice.
  const committedNameRef = useRef(folder.name)

  const commitRename = (): void => {
    if (name !== committedNameRef.current) {
      committedNameRef.current = name
      onRename(folder.id, name)
    }
  }

  // Persist a pending rename even when the dialog closes via Escape, which
  // dismisses before the TextField fires its blur event.
  const handleClose = (): void => {
    commitRename()
    onClose()
  }

  const ids = folder.items.map(i => i.id)
  const actions = makeActions([
    (): unknown =>
      makeAction({
        name: 'DissolveFolder',
        icon: TrashIcon,
        label: t('folder.dissolve'),
        action: () => onDissolve(folder.id)
      })
  ])

  return (
    <>
      <Dialog
        open
        onClose={handleClose}
        title={
          <div className="u-flex u-flex-items-center u-flex-justify-between">
            <TextField
              value={name}
              placeholder={t('folder.name_placeholder')}
              onChange={e => setName(e.target.value)}
              onBlur={commitRename}
              variant="standard"
            />
            <IconButton
              ref={anchorRef}
              size="small"
              aria-label={t('folder.actions')}
              data-testid="folder-menu"
              onClick={() => setMenuOpen(true)}
            >
              <Icon icon={DotsIcon} rotate={90} />
            </IconButton>
          </div>
        }
        content={
          <SortableContext items={ids} strategy={rectSortingStrategy}>
            <div className="home-folder-content" data-testid="folder-content">
              {folder.items.map(item => (
                <FolderDialogItem
                  key={item.id}
                  item={item}
                  onRemove={id => onRemoveItem(folder.id, id)}
                  removeLabel={t('folder.remove_item')}
                />
              ))}
            </div>
          </SortableContext>
        }
      />
      <CozyTheme>
        <ActionsMenu
          ref={anchorRef}
          open={menuOpen}
          actions={actions}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          onClose={() => setMenuOpen(false)}
        />
      </CozyTheme>
    </>
  )
}
