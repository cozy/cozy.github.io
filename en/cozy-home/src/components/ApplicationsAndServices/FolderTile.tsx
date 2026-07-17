import React from 'react'

import { models } from 'cozy-client'
import SquareAppIcon from 'cozy-ui-plus/dist/SquareAppIcon'

import { AppIcon, FolderTileProps, TileItem } from './types'

const {
  file: { getShortcutImgSrc }
} = models

// A single inner item rendered as a small icon for the folder preview. Every
// item type resolves to the same square so the preview stays uniform.
const PreviewIcon = ({ item }: { item: TileItem }): JSX.Element | null => {
  switch (item.type) {
    case 'app':
      return (
        <AppIcon
          app={item.app}
          type="app"
          className="home-folder-preview-img"
        />
      )
    case 'konnector':
      return (
        <AppIcon
          app={item.konnector}
          type="konnector"
          className="home-folder-preview-img"
        />
      )
    case 'shortcut': {
      const src = getShortcutImgSrc(item.file)
      return src ? (
        <img className="home-folder-preview-img" src={src} alt="" />
      ) : null
    }
    case 'entrypoint':
      return (
        <img
          className="home-folder-preview-img"
          src={`data:image/svg+xml;base64,${item.entrypoint.icon}`}
          alt=""
        />
      )
    default:
      return null
  }
}

export const FolderTile = ({
  folder,
  onOpen
}: FolderTileProps): JSX.Element => {
  const preview = folder.items.slice(0, 4)
  return (
    <button
      type="button"
      className="scale-hover home-folder-tile"
      onClick={() => onOpen(folder.id)}
      data-testid="folder-tile"
    >
      <SquareAppIcon
        name={folder.name}
        variant="shortcut"
        hideShortcutBadge
        IconContent={
          <div className="home-folder-preview">
            {preview.map(item => (
              <div
                key={item.id}
                className="home-folder-preview-cell"
                data-icon-id={item.id}
              >
                <PreviewIcon item={item} />
              </div>
            ))}
          </div>
        }
      />
    </button>
  )
}
