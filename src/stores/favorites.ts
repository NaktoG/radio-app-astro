import { signal, computed } from '@preact/signals'

const STORAGE_KEY = 'radio_favorites'

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
  if (next.has(uuid)) {
    next.delete(uuid)
  } else {
    next.add(uuid)
  }
  favorites.value = next
  saveFavorites(next)
}

export function _resetFavoritesForTesting() {
  favorites.value = new Set()
}
