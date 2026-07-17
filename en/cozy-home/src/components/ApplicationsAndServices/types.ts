import {
  CollisionDetection,
  DragEndEvent,
  DragMoveEvent,
  DragStartEvent,
  SensorDescriptor,
  SensorOptions
} from '@dnd-kit/core'
import React from 'react'

import { models } from 'cozy-client'
import type {
  IOCozyApp,
  IOCozyFile,
  IOCozyKonnector
} from 'cozy-client/types/types'
import UntypedActionsMenu from 'cozy-ui/transpiled/react/ActionsMenu'
import { makeActions as untypedMakeActions } from 'cozy-ui/transpiled/react/ActionsMenu/Actions'
import { makeAction as untypedMakeAction } from 'cozy-ui/transpiled/react/ActionsMenu/Actions/makeAction'
import UntypedTextField from 'cozy-ui/transpiled/react/TextField'
import UntypedAppIcon from 'cozy-ui-plus/dist/AppIcon'

import { LoadingAppTiles as UntypedLoadingAppTiles } from '@/components/Applications'

// --- Typed wrappers for cozy-ui(-plus) components that ship without usable TS
// types, kept here so the casts are declared once instead of in every file.

export const AppIcon = UntypedAppIcon as React.FC<{
  app: unknown
  type?: 'app' | 'konnector'
  className?: string
}>

export const TextField = UntypedTextField as React.FC<{
  value: string
  placeholder: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur: () => void
  variant: string
}>

export const LoadingAppTiles = UntypedLoadingAppTiles as React.FC<{
  num: number
}>

export interface FolderAction {
  name: string
  icon: unknown
  label: string
  action: () => void
}

export const makeAction = untypedMakeAction as (a: FolderAction) => unknown

export const makeActions = untypedMakeActions as unknown as (
  actions: Array<() => unknown>,
  options?: Record<string, unknown>
) => unknown[]

export const ActionsMenu =
  UntypedActionsMenu as React.ForwardRefExoticComponent<
    {
      open: boolean
      actions: unknown[]
      anchorOrigin?: { vertical: string; horizontal: string }
      onClose: () => void
    } & React.RefAttributes<HTMLButtonElement>
  >

// --- Home layout domain types

export type EntrypointCondition = Parameters<
  typeof models.applications.checkEntrypointCondition
>[0]

export interface Entrypoint {
  name: string
  slug: string
  hash: string
  title: Record<string, string>
  icon: string
  conditions?: EntrypointCondition[]
}

export interface AppItem {
  type: 'app'
  id: string
  app: IOCozyApp
}

export interface KonnectorItem {
  type: 'konnector'
  id: string
  konnector: IOCozyKonnector
  isInMaintenance: boolean
  isRunning: boolean
}

export interface ShortcutItem {
  type: 'shortcut'
  id: string
  file: IOCozyFile
}

export interface EntrypointItem {
  type: 'entrypoint'
  id: string
  entrypoint: Entrypoint
}

export type TileItem = AppItem | KonnectorItem | ShortcutItem | EntrypointItem

export interface FolderItem {
  type: 'folder'
  id: string
  name: string
  items: TileItem[]
}

export type GridItem = TileItem | FolderItem

export interface FolderData {
  name: string
  items: string[]
}

export type FolderMap = Record<string, FolderData>

export interface HomeLayout {
  order: string[]
  folders: FolderMap
}

export interface AppFilters {
  sortSlugs: string[] | null
  hiddenSlugs: string[]
  hiddenHomeSlugs: string[]
}

// --- useHomeLayout hook

export interface SettingsShape {
  query: { fetchStatus: string; lastFetch?: number }
  values?: { homeLayout?: HomeLayout }
  save: (data: { homeLayout: HomeLayout }) => void
}

export interface UseHomeLayout {
  hasLoaded: boolean
  isAppsLoading: boolean
  items: TileItem[]
  layout: HomeLayout
  apps: IOCozyApp[]
  saveLayout: (layout: HomeLayout) => void
}

// --- Component props

export interface SortableTileProps {
  item: GridItem
  combineTarget: boolean
  onOpenFolder: (id: string) => void
}

export interface TileContentProps {
  item: GridItem
  onOpenFolder: (id: string) => void
}

export interface FolderTileProps {
  folder: FolderItem
  onOpen: (id: string) => void
}

export interface FolderDialogItemProps {
  item: TileItem
  onRemove: (itemId: string) => void
  removeLabel: string
}

export interface FolderDialogProps {
  folder: FolderItem
  onClose: () => void
  onRename: (id: string, name: string) => void
  onDissolve: (id: string) => void
  onRemoveItem: (folderId: string, itemId: string) => void
}

// --- useHomeDnd hook

export interface UseHomeDndParams {
  items: TileItem[]
  layout: HomeLayout
  saveLayout: (next: HomeLayout) => void
}

export interface UseHomeDndResult {
  grid: GridItem[]
  ids: string[]
  activeId: string | null
  combineTargetId: string | null
  openFolder: FolderItem | undefined
  draggedItem: TileItem | FolderItem | undefined
  effectiveLayout: HomeLayout
  sensors: SensorDescriptor<SensorOptions>[]
  collisionDetection: CollisionDetection
  setOpenFolderId: (id: string | null) => void
  handleSave: (next: HomeLayout) => void
  handleDragStart: (event: DragStartEvent) => void
  handleDragMove: (event: DragMoveEvent) => void
  handleDragCancel: () => void
  handleDragEnd: (event: DragEndEvent) => void
}
