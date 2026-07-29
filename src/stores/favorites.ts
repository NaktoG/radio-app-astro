import { signal, computed } from '@preact/signals'

const STORAGE_KEY = 'radio_favorites'
let synced = false

function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

function saveFavorites(favs: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...favs]))
  } catch {}
}

const favorites = signal<Set<string>>(loadFavorites())
const favoritesCount = computed(() => favorites.value.size)

export function useFavoritesStore() {
  return { favorites, favoritesCount }
}

export function isFavorite(uuid: string): boolean {
  return favorites.value.has(uuid)
}

export function toggleFavorite(uuid: string) {
  const next = new Set(favorites.value)
  const shouldAdd = !next.has(uuid)
  if (next.has(uuid)) {
    next.delete(uuid)
  } else {
    next.add(uuid)
  }
  favorites.value = next
  saveFavorites(next)

  syncFavoriteChange(uuid, shouldAdd).catch(() => {})
}

async function syncFavoriteChange(uuid: string, shouldAdd: boolean) {
  if (!synced) return
  await fetch('/api/favorites', {
    method: shouldAdd ? 'POST' : 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ stationUuid: uuid }),
  })
}

export async function syncFavorites() {
  try {
    const res = await fetch('/api/favorites', { credentials: 'same-origin' })
    if (!res.ok) return
    const data: { success: boolean; favorites: string[] } = await res.json()
    if (!data.success) return
    favorites.value = new Set(data.favorites)
    saveFavorites(favorites.value)
    synced = true
  } catch {}
}

export function _resetFavoritesForTesting() {
  favorites.value = new Set()
  synced = false
}
