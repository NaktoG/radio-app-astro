import { signal, computed } from '@preact/signals'

type FavoritesStatus = {
  isLoading: boolean
  isImporting: boolean
  isEmpty: boolean
  importPending: boolean
  error: string | null
}

type PendingFavoriteChange = {
  shouldAdd: boolean
  rollbackShouldHave: boolean
}

let initialSyncInFlight = false
let initialSyncSettled = false
let pendingFavoriteChanges = new Map<string, PendingFavoriteChange>()

const favorites = signal<Set<string>>(new Set())
const favoritesCount = computed(() => favorites.value.size)
const favoritesStatus = signal<FavoritesStatus>({
  isLoading: false,
  isImporting: false,
  isEmpty: true,
  importPending: false,
  error: null,
})

export function useFavoritesStore() {
  return { favorites, favoritesCount, favoritesStatus }
}

export function isFavorite(uuid: string): boolean {
  return favorites.value.has(uuid)
}

export function toggleFavorite(uuid: string) {
  const previous = favorites.value
  const next = new Set(favorites.value)
  const shouldAdd = !next.has(uuid)
  if (next.has(uuid)) {
    next.delete(uuid)
  } else {
    next.add(uuid)
  }
  favorites.value = next
  updateEmptyState()

  if (!initialSyncSettled) {
    const existingPendingChange = pendingFavoriteChanges.get(uuid)
    pendingFavoriteChanges.set(uuid, {
      shouldAdd,
      rollbackShouldHave: existingPendingChange?.rollbackShouldHave ?? previous.has(uuid),
    })
    updateStatus({ error: null })
    return Promise.resolve()
  }

  updateStatus({ error: null })

  return syncFavoriteChange(uuid, shouldAdd).catch(() => {
    const rollback = new Set(favorites.value)
    if (previous.has(uuid)) {
      rollback.add(uuid)
    } else {
      rollback.delete(uuid)
    }
    favorites.value = rollback
    updateStatus({ isEmpty: rollback.size === 0, error: 'Could not update favorite' })
  })
}

async function syncFavoriteChange(uuid: string, shouldAdd: boolean) {
  const res = await fetch('/api/favorites', {
    method: shouldAdd ? 'POST' : 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ stationUuid: uuid }),
  })
  if (!res.ok) throw new Error('Failed to sync favorite')
}

export async function syncFavorites() {
  if (initialSyncInFlight) return
  initialSyncInFlight = true
  let rollbackState: Set<string> | undefined
  updateStatus({ isLoading: true, error: null })
  try {
    const res = await fetch('/api/favorites', { credentials: 'same-origin' })
    if (!res.ok) throw new Error('Could not load favorites')
    const data: { success: boolean; favorites: string[] } = await res.json()
    if (!data.success) throw new Error('Could not load favorites')
    const serverFavorites = new Set(dedupeStationUuids(data.favorites))
    favorites.value = applyPendingFavoriteChanges(new Set(serverFavorites))
    rollbackState = serverFavorites
    updateStatus({ isLoading: false, isEmpty: favorites.value.size === 0, error: null })
  } catch {
    updateStatus({ isLoading: false, isEmpty: favorites.value.size === 0, error: 'Could not load favorites' })
  } finally {
    initialSyncInFlight = false
    initialSyncSettled = true
  }

  await flushPendingFavoriteChanges(rollbackState)
}

export async function confirmFavoritesImport(
  stationUuids: string[],
  cleanupLegacyFavorites: () => void = () => {}
) {
  const previous = favorites.value
  const merged = new Set([...favorites.value, ...dedupeStationUuids(stationUuids)])
  updateStatus({ isImporting: true, importPending: true, error: null })

  try {
    const res = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ stationUuids: [...merged], confirmed: true }),
    })
    if (!res.ok) throw new Error('Could not import favorites')

    favorites.value = merged
    cleanupLegacyFavorites()
    updateStatus({ isImporting: false, importPending: false, isEmpty: merged.size === 0, error: null })
  } catch {
    favorites.value = previous
    updateStatus({
      isImporting: false,
      importPending: true,
      isEmpty: previous.size === 0,
      error: 'Could not import favorites',
    })
    throw new Error('Could not import favorites')
  }
}

export function cancelFavoritesImport() {
  updateStatus({ importPending: false, isImporting: false, error: null })
}

export function _resetFavoritesForTesting() {
  favorites.value = new Set()
  initialSyncInFlight = false
  initialSyncSettled = false
  pendingFavoriteChanges = new Map()
  favoritesStatus.value = {
    isLoading: false,
    isImporting: false,
    isEmpty: true,
    importPending: false,
    error: null,
  }
}

function updateEmptyState() {
  updateStatus({ isEmpty: favorites.value.size === 0 })
}

function updateStatus(next: Partial<FavoritesStatus>) {
  favoritesStatus.value = { ...favoritesStatus.value, ...next }
}

function applyPendingFavoriteChanges(next: Set<string>) {
  for (const [uuid, { shouldAdd }] of pendingFavoriteChanges) {
    if (shouldAdd) {
      next.add(uuid)
    } else {
      next.delete(uuid)
    }
  }
  return next
}

async function flushPendingFavoriteChanges(rollbackState?: Set<string>) {
  const changes = [...pendingFavoriteChanges]
  pendingFavoriteChanges.clear()

  for (const [uuid, { shouldAdd, rollbackShouldHave }] of changes) {
    try {
      await syncFavoriteChange(uuid, shouldAdd)
      if (shouldAdd) {
        rollbackState?.add(uuid)
      } else {
        rollbackState?.delete(uuid)
      }
    } catch {
      const next = new Set(favorites.value)
      const shouldHaveAfterRollback = rollbackState?.has(uuid) ?? rollbackShouldHave
      if (shouldHaveAfterRollback) {
        next.add(uuid)
      } else {
        next.delete(uuid)
      }
      favorites.value = next
      updateStatus({ isEmpty: favorites.value.size === 0, error: 'Could not update favorite' })
    }
  }
}

function dedupeStationUuids(stationUuids: string[]): string[] {
  return [...new Set(stationUuids.map((stationUuid) => stationUuid.trim()).filter(Boolean))]
}
