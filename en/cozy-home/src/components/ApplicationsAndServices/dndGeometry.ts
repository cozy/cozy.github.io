import { DragEndEvent, DragMoveEvent } from '@dnd-kit/core'

// How long the dragged tile must hover (hold) over another tile before the
// gesture is treated as "into the group": a regular tile folds into a new
// folder, a folder springs open so the icon can be dropped straight inside.
export const DWELL_MS = 450

// Fraction of each tile trimmed off every edge to form its central "group"
// zone. The dragged tile's centre must sit inside this zone for a hold to fold
// or spring a folder; elsewhere the drag just reorders.
export const CENTRAL_INSET = 0.25

// No-op sorting strategy: keeps grid tiles in place during a drag. Live
// shuffling would slide the hovered tile out from under the pointer, making a
// stable "hold" gesture impossible. Grid reorder is committed on drop instead.
export const noSortStrategy = (): null => null

// True when the dragged tile's centre is inside the over tile's central zone.
export const isOverCentre = (
  active: DragMoveEvent['active'],
  over: DragMoveEvent['over']
): boolean => {
  const a = active.rect.current.translated
  const r = over?.rect
  if (!a || !r) return false
  const cx = a.left + a.width / 2
  const cy = a.top + a.height / 2
  const ix = r.width * CENTRAL_INSET
  const iy = r.height * CENTRAL_INSET
  return (
    cx >= r.left + ix &&
    cx <= r.right - ix &&
    cy >= r.top + iy &&
    cy <= r.bottom - iy
  )
}

// True when the dragged tile's centre is outside the open folder dialog.
export const isOutsideDialog = (active: DragEndEvent['active']): boolean => {
  const a = active.rect.current.translated
  const dialogEl = document.querySelector('[role="dialog"]')
  if (!a || !dialogEl) return false
  const r = dialogEl.getBoundingClientRect()
  const cx = a.left + a.width / 2
  const cy = a.top + a.height / 2
  return cx < r.left || cx > r.right || cy < r.top || cy > r.bottom
}
