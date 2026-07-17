import { models } from 'cozy-client'
import type {
  IOCozyApp,
  IOCozyFile,
  IOCozyKonnector
} from 'cozy-client/types/types'

import type {
  AppFilters,
  AppItem,
  Entrypoint,
  EntrypointItem,
  FolderMap,
  GridItem,
  HomeLayout,
  KonnectorItem,
  ShortcutItem,
  TileItem
} from './types'

import homeConfig from '@/config/home.json'

const {
  applications: { sortApplicationsList, checkEntrypointCondition }
} = models

const FOLDER_PREFIX = 'folder:'
// First manifest category usable as a default folder name. Skips the catch-all
// 'others' (and an empty list), for which a generic name reads better.
export const pickFolderCategory = (categories?: string[]): string | null => {
  const category = categories?.[0]
  return category && category !== 'others' ? category : null
}

// A folder category from an app/konnector doc, handling both the modern
// `categories` array and the legacy singular `category` string.
export const folderCategoryFromDoc = (doc?: {
  categories?: string[]
  category?: string
}): string | null => {
  const list = doc?.categories?.length
    ? doc.categories
    : doc?.category
      ? [doc.category]
      : undefined
  return pickFolderCategory(list)
}

export const makeAppId = (slug: string): string => `app:${slug}`
export const makeKonnectorId = (slug: string): string => `konnector:${slug}`
export const makeShortcutId = (fileId: string): string => `shortcut:${fileId}`
export const makeEntrypointId = (slug: string, name: string): string =>
  `entrypoint:${slug}:${name}`
export const makeFolderId = (): string =>
  `${FOLDER_PREFIX}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
export const isFolderId = (id: string): boolean => id.startsWith(FOLDER_PREFIX)

export const buildAppItems = (
  apps: IOCozyApp[] | null | undefined,
  { sortSlugs, hiddenSlugs, hiddenHomeSlugs }: AppFilters
): AppItem[] => {
  if (!Array.isArray(apps) || apps.length === 0) return []
  const visible = apps.filter(
    app =>
      app.state !== 'hidden' &&
      !homeConfig.filteredApps.includes(app.slug) &&
      !hiddenSlugs.includes(app.slug.toLowerCase()) &&
      !hiddenHomeSlugs.includes(app.slug.toLowerCase())
  )
  const seenSlugs = new Set<string>()
  const deduped = visible.filter(app => {
    if (seenSlugs.has(app.slug)) return false
    seenSlugs.add(app.slug)
    return true
  })
  const sorted = (
    sortSlugs ? sortApplicationsList(deduped, sortSlugs) : deduped
  ) as IOCozyApp[]
  return sorted.map(app => ({ type: 'app', id: makeAppId(app.slug), app }))
}

export const buildKonnectorItems = (
  konnectors: IOCozyKonnector[],
  maintenanceSlugs: Set<string>,
  runningSlugs: string[]
): KonnectorItem[] =>
  konnectors.map(konnector => ({
    type: 'konnector',
    id: makeKonnectorId(konnector.slug),
    konnector,
    isInMaintenance: maintenanceSlugs.has(konnector.slug),
    isRunning: runningSlugs.includes(konnector.slug)
  }))

export const buildShortcutItems = (
  files: IOCozyFile[] | null | undefined
): ShortcutItem[] => {
  if (!Array.isArray(files)) return []
  return files.map(file => ({
    type: 'shortcut',
    id: makeShortcutId(file._id),
    file
  }))
}

const omit = (folders: FolderMap, id: string): FolderMap => {
  const next = { ...folders }
  delete next[id]
  return next
}

// Builds the rendered grid from the saved layout and the live tile items.
// Known ids first (saved order), then new items in default order; stale ids
// and empty folders are dropped.
export const buildGrid = (
  layout: HomeLayout,
  items: TileItem[]
): GridItem[] => {
  const byId = new Map(items.map(i => [i.id, i]))
  const inFolder = new Set<string>()
  Object.values(layout.folders).forEach(f =>
    f.items.forEach(id => inFolder.add(id))
  )

  const placed = new Set<string>()
  const grid: GridItem[] = []

  for (const id of layout.order) {
    if (isFolderId(id)) {
      const data = layout.folders[id]
      if (!data) continue
      const inner = data.items
        .map(i => byId.get(i))
        .filter((i): i is TileItem => Boolean(i))
      if (inner.length === 0) continue
      grid.push({ type: 'folder', id, name: data.name, items: inner })
      data.items.forEach(i => placed.add(i))
      placed.add(id)
    } else {
      const item = byId.get(id)
      if (item && !inFolder.has(id)) {
        grid.push(item)
        placed.add(id)
      }
    }
  }
  for (const item of items) {
    if (!placed.has(item.id) && !inFolder.has(item.id)) grid.push(item)
  }
  // Self-heal: render folders that exist but were never written into `order`
  // (e.g. created while `order` was still the empty default). Without this they
  // would swallow their items yet never appear on the grid.
  for (const [folderId, data] of Object.entries(layout.folders)) {
    if (placed.has(folderId)) continue
    const inner = data.items
      .map(i => byId.get(i))
      .filter((i): i is TileItem => Boolean(i))
    if (inner.length === 0) continue
    grid.push({ type: 'folder', id: folderId, name: data.name, items: inner })
    placed.add(folderId)
  }
  return grid
}

export const createFolder = (
  layout: HomeLayout,
  targetId: string,
  draggedId: string,
  makeId: () => string = makeFolderId,
  name = ''
): HomeLayout => {
  // No nested folders: a folder can never be put inside another tile/folder.
  if (isFolderId(draggedId)) return layout
  // The folder takes the target's slot (where the tile was dropped, iOS-style);
  // the dragged tile leaves its own slot and joins the folder.
  const folderId = makeId()
  const order = layout.order
    .map(id => (id === targetId ? folderId : id))
    .filter(id => id !== draggedId)
  return {
    order,
    folders: {
      ...layout.folders,
      [folderId]: { name, items: [targetId, draggedId] }
    }
  }
}

export const addToFolderAt = (
  layout: HomeLayout,
  folderId: string,
  draggedId: string,
  index: number
): HomeLayout => {
  const folder = layout.folders[folderId]
  if (!folder) return layout
  if (isFolderId(draggedId)) return layout // no nested folders
  const items = folder.items.filter(id => id !== draggedId)
  const at = index < 0 || index > items.length ? items.length : index
  items.splice(at, 0, draggedId)
  return {
    order: layout.order.filter(id => id !== draggedId),
    folders: { ...layout.folders, [folderId]: { ...folder, items } }
  }
}

export const addToFolder = (
  layout: HomeLayout,
  folderId: string,
  draggedId: string
): HomeLayout => {
  const folder = layout.folders[folderId]
  if (!folder) return layout
  return addToFolderAt(layout, folderId, draggedId, folder.items.length)
}

export const removeFromFolder = (
  layout: HomeLayout,
  folderId: string,
  itemId: string
): HomeLayout => {
  const folder = layout.folders[folderId]
  if (!folder) return layout
  const remaining = folder.items.filter(id => id !== itemId)
  // Spill the removed item back onto the grid, right after the folder when it
  // is placed, otherwise at the end (the folder may be self-healed and absent
  // from order).
  const folderIndex = layout.order.indexOf(folderId)
  const order = [...layout.order]
  if (folderIndex === -1) order.push(itemId)
  else order.splice(folderIndex + 1, 0, itemId)

  // A single remaining item is a valid folder (iOS-style); only drop the
  // folder once it is empty.
  if (remaining.length === 0) {
    return {
      order: order.filter(id => id !== folderId),
      folders: omit(layout.folders, folderId)
    }
  }
  return {
    order,
    folders: { ...layout.folders, [folderId]: { ...folder, items: remaining } }
  }
}

export const reorderFolderItems = (
  layout: HomeLayout,
  folderId: string,
  items: string[]
): HomeLayout => {
  const folder = layout.folders[folderId]
  if (!folder) return layout
  return {
    ...layout,
    folders: { ...layout.folders, [folderId]: { ...folder, items } }
  }
}

export const dissolveFolder = (
  layout: HomeLayout,
  folderId: string
): HomeLayout => {
  const folder = layout.folders[folderId]
  if (!folder) return layout
  const order = layout.order.flatMap(id =>
    id === folderId ? folder.items : [id]
  )
  return { order, folders: omit(layout.folders, folderId) }
}

export const renameFolder = (
  layout: HomeLayout,
  folderId: string,
  name: string
): HomeLayout => {
  const folder = layout.folders[folderId]
  if (!folder) return layout
  return {
    ...layout,
    folders: { ...layout.folders, [folderId]: { ...folder, name } }
  }
}

export const buildEntrypointItems = (
  apps: IOCozyApp[] | null | undefined
): EntrypointItem[] => {
  if (!Array.isArray(apps)) return []
  return apps.flatMap(app =>
    ((app as IOCozyApp & { entrypoints?: Entrypoint[] }).entrypoints ?? [])
      .filter(ep =>
        (ep.conditions ?? []).every(c => {
          if (c.type === 'flag' && c.name === 'bar.onlyoffice.enabled')
            return true
          return checkEntrypointCondition(c)
        })
      )
      .map(ep => ({
        type: 'entrypoint' as const,
        id: makeEntrypointId(app.slug, ep.name),
        entrypoint: { ...ep, slug: app.slug }
      }))
  )
}
