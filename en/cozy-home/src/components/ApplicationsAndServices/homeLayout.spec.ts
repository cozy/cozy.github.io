import type { IOCozyApp, IOCozyKonnector } from 'cozy-client/types/types'

import {
  addToFolder,
  addToFolderAt,
  buildAppItems,
  buildGrid,
  buildKonnectorItems,
  buildShortcutItems,
  createFolder,
  dissolveFolder,
  folderCategoryFromDoc,
  isFolderId,
  makeAppId,
  makeFolderId,
  pickFolderCategory,
  removeFromFolder,
  renameFolder,
  reorderFolderItems
} from './homeLayout'
import type { AppItem } from './types'

const makeApp = (slug: string, state = 'ready'): IOCozyApp =>
  ({ slug, state }) as unknown as IOCozyApp

describe('buildAppItems', () => {
  const noFilters = { sortSlugs: null, hiddenSlugs: [], hiddenHomeSlugs: [] }

  it('returns [] without apps', () => {
    expect(buildAppItems(null, noFilters)).toEqual([])
  })

  it('filters hidden/home-hidden/hidden-state/home and dedups, then ids', () => {
    const items = buildAppItems(
      [
        makeApp('drive'),
        makeApp('ghost', 'hidden'),
        makeApp('home'),
        makeApp('drive')
      ],
      { sortSlugs: null, hiddenSlugs: [], hiddenHomeSlugs: [] }
    )
    expect(items.map(i => i.id)).toEqual(['app:drive'])
  })

  it('applies the sort flag, unknown slugs last', () => {
    const items = buildAppItems(
      [makeApp('notes'), makeApp('drive'), makeApp('zz')],
      {
        ...noFilters,
        sortSlugs: ['drive', 'notes']
      }
    )
    expect(items.map(i => i.id)).toEqual(['app:drive', 'app:notes', 'app:zz'])
  })
})

describe('buildKonnectorItems', () => {
  it('flags maintenance and running', () => {
    const ks = [
      { slug: 'alan', name: 'Alan' },
      { slug: 'edf', name: 'EDF' }
    ] as unknown as IOCozyKonnector[]
    const items = buildKonnectorItems(ks, new Set(['edf']), ['alan'])
    expect(items).toEqual([
      {
        type: 'konnector',
        id: 'konnector:alan',
        konnector: ks[0],
        isInMaintenance: false,
        isRunning: true
      },
      {
        type: 'konnector',
        id: 'konnector:edf',
        konnector: ks[1],
        isInMaintenance: true,
        isRunning: false
      }
    ])
  })
})

describe('buildShortcutItems', () => {
  it('builds ids from _id', () => {
    expect(
      buildShortcutItems([{ _id: 'abc' }] as never).map(i => i.id)
    ).toEqual(['shortcut:abc'])
  })
  it('returns [] when not loaded', () => {
    expect(buildShortcutItems(null)).toEqual([])
  })
})

describe('folder ids', () => {
  it('generates unique folder ids recognised by isFolderId', () => {
    const id = makeFolderId()
    expect(isFolderId(id)).toBe(true)
    expect(isFolderId(makeAppId('drive'))).toBe(false)
    expect(id).not.toEqual(makeFolderId())
  })
})

describe('pickFolderCategory', () => {
  it('returns the first category', () => {
    expect(pickFolderCategory(['banking', 'finance'])).toBe('banking')
  })

  it('ignores the catch-all "others" and empty/missing lists', () => {
    expect(pickFolderCategory(['others'])).toBe(null)
    expect(pickFolderCategory([])).toBe(null)
    expect(pickFolderCategory(undefined)).toBe(null)
  })
})

describe('folderCategoryFromDoc', () => {
  it('reads the modern categories array', () => {
    expect(folderCategoryFromDoc({ categories: ['banking'] })).toBe('banking')
  })

  it('falls back to the legacy singular category', () => {
    expect(folderCategoryFromDoc({ category: 'cozy' })).toBe('cozy')
  })

  it('prefers a non-empty categories array over the singular field', () => {
    expect(
      folderCategoryFromDoc({ categories: ['health'], category: 'cozy' })
    ).toBe('health')
  })

  it('returns null when neither yields a usable category', () => {
    expect(folderCategoryFromDoc({ categories: [] })).toBe(null)
    expect(folderCategoryFromDoc({ category: 'others' })).toBe(null)
    expect(folderCategoryFromDoc(undefined)).toBe(null)
  })
})

const app = (slug: string): AppItem => ({
  type: 'app',
  id: `app:${slug}`,
  app: { slug } as AppItem['app']
})

describe('buildGrid', () => {
  const items = [app('drive'), app('notes'), app('photos')]

  it('keeps default order when nothing saved', () => {
    const grid = buildGrid({ order: [], folders: {} }, items)
    expect(grid.map(g => g.id)).toEqual([
      'app:drive',
      'app:notes',
      'app:photos'
    ])
  })

  it('applies saved order, appends new items, drops stale ids', () => {
    const grid = buildGrid(
      { order: ['app:gone', 'app:notes'], folders: {} },
      items
    )
    expect(grid.map(g => g.id)).toEqual([
      'app:notes',
      'app:drive',
      'app:photos'
    ])
  })

  it('materialises folders with their live inner items, name and position', () => {
    const grid = buildGrid(
      {
        order: ['app:drive', 'folder:a'],
        folders: {
          'folder:a': { name: 'G', items: ['app:photos', 'app:notes'] }
        }
      },
      items
    )
    expect(grid[0].id).toBe('app:drive')
    const folder = grid[1]
    expect(folder.type).toBe('folder')
    if (folder.type === 'folder') {
      expect(folder.name).toBe('G')
      expect(folder.items.map(i => i.id)).toEqual(['app:photos', 'app:notes'])
    }
  })

  it('drops empty folders (all inner items stale)', () => {
    const grid = buildGrid(
      {
        order: ['folder:a', 'app:drive'],
        folders: { 'folder:a': { name: 'G', items: ['app:gone'] } }
      },
      items
    )
    expect(grid.map(g => g.id)).toEqual([
      'app:drive',
      'app:notes',
      'app:photos'
    ])
  })

  it('renders folders missing from order so their items are never lost', () => {
    const grid = buildGrid(
      {
        order: [],
        folders: { 'folder:a': { name: 'G', items: ['app:drive', 'app:notes'] } }
      },
      items
    )
    // Standalone items first, then the self-healed folder
    expect(grid.map(g => g.id)).toEqual(['app:photos', 'folder:a'])
    const folder = grid[1]
    expect(folder.type).toBe('folder')
    if (folder.type === 'folder') {
      expect(folder.items.map(i => i.id)).toEqual(['app:drive', 'app:notes'])
    }
  })
})

describe('folder operations', () => {
  const base = {
    order: ['app:drive', 'app:notes', 'app:photos'],
    folders: {} as Record<string, { name: string; items: string[] }>
  }

  it('puts the folder at the target slot, holding [target, dragged]', () => {
    const next = createFolder(
      base,
      'app:photos',
      'app:drive',
      () => 'folder:x',
      'Dossier'
    )
    expect(next.order).toEqual(['app:notes', 'folder:x'])
    expect(next.folders['folder:x']).toEqual({
      name: 'Dossier',
      items: ['app:photos', 'app:drive']
    })
  })

  it('addToFolder appends the dragged id and removes it from order', () => {
    const start = {
      order: ['folder:x', 'app:notes'],
      folders: { 'folder:x': { name: 'G', items: ['app:drive'] } }
    }
    const next = addToFolder(start, 'folder:x', 'app:notes')
    expect(next.order).toEqual(['folder:x'])
    expect(next.folders['folder:x'].items).toEqual(['app:drive', 'app:notes'])
  })

  it('addToFolderAt inserts the dragged id at the given index', () => {
    const start = {
      order: ['folder:x', 'app:notes'],
      folders: { 'folder:x': { name: 'G', items: ['app:drive', 'app:photos'] } }
    }
    const next = addToFolderAt(start, 'folder:x', 'app:notes', 1)
    expect(next.order).toEqual(['folder:x'])
    expect(next.folders['folder:x'].items).toEqual([
      'app:drive',
      'app:notes',
      'app:photos'
    ])
  })

  it('addToFolderAt clamps an out-of-range index to the end', () => {
    const start = {
      order: ['folder:x'],
      folders: { 'folder:x': { name: 'G', items: ['a', 'b'] } }
    }
    expect(
      addToFolderAt(start, 'folder:x', 'app:notes', 99).folders['folder:x'].items
    ).toEqual(['a', 'b', 'app:notes'])
  })

  it('removeFromFolder moves the id back to the grid after the folder', () => {
    const start = {
      order: ['folder:x', 'app:notes'],
      folders: {
        'folder:x': {
          name: 'G',
          items: ['app:drive', 'app:photos', 'app:contacts']
        }
      }
    }
    const next = removeFromFolder(start, 'folder:x', 'app:drive')
    expect(next.folders['folder:x'].items).toEqual(['app:photos', 'app:contacts'])
    expect(next.order).toEqual(['folder:x', 'app:drive', 'app:notes'])
  })

  it('removeFromFolder keeps a folder that still has a single item', () => {
    const start = {
      order: ['folder:x', 'app:notes'],
      folders: { 'folder:x': { name: 'G', items: ['app:drive', 'app:photos'] } }
    }
    const next = removeFromFolder(start, 'folder:x', 'app:drive')
    expect(next.folders['folder:x'].items).toEqual(['app:photos'])
    expect(next.order).toEqual(['folder:x', 'app:drive', 'app:notes'])
  })

  it('removeFromFolder drops the folder once it becomes empty', () => {
    const start = {
      order: ['folder:x', 'app:notes'],
      folders: { 'folder:x': { name: 'G', items: ['app:drive'] } }
    }
    const next = removeFromFolder(start, 'folder:x', 'app:drive')
    expect(next.folders['folder:x']).toBeUndefined()
    expect(next.order).toEqual(['app:drive', 'app:notes'])
  })

  it('dissolveFolder spills items at the folder position and deletes it', () => {
    const start = {
      order: ['app:notes', 'folder:x'],
      folders: { 'folder:x': { name: 'G', items: ['app:drive', 'app:photos'] } }
    }
    const next = dissolveFolder(start, 'folder:x')
    expect(next.order).toEqual(['app:notes', 'app:drive', 'app:photos'])
    expect(next.folders['folder:x']).toBeUndefined()
  })

  it('reorderFolderItems sets a new item order inside the folder', () => {
    const start = {
      order: ['folder:x'],
      folders: { 'folder:x': { name: 'G', items: ['a', 'b', 'c'] } }
    }
    const next = reorderFolderItems(start, 'folder:x', ['c', 'a', 'b'])
    expect(next.folders['folder:x'].items).toEqual(['c', 'a', 'b'])
    expect(next.order).toEqual(['folder:x'])
  })

  it('renameFolder sets the name', () => {
    const start = {
      order: ['folder:x'],
      folders: { 'folder:x': { name: 'G', items: ['a', 'b'] } }
    }
    expect(
      renameFolder(start, 'folder:x', 'Banques').folders['folder:x'].name
    ).toBe('Banques')
  })

  it('createFolder is a no-op when the dragged tile is a folder (no nesting)', () => {
    const start = {
      order: ['folder:a', 'app:notes'],
      folders: { 'folder:a': { name: 'G', items: ['app:x', 'app:y'] } }
    }
    expect(
      createFolder(start, 'app:notes', 'folder:a', () => 'folder:z')
    ).toEqual(start)
  })

  it('addToFolder is a no-op when the dragged tile is a folder (no nesting)', () => {
    const start = {
      order: ['folder:a', 'folder:b'],
      folders: {
        'folder:a': { name: 'A', items: ['app:x', 'app:y'] },
        'folder:b': { name: 'B', items: ['app:z', 'app:w'] }
      }
    }
    expect(addToFolder(start, 'folder:a', 'folder:b')).toEqual(start)
  })
})
