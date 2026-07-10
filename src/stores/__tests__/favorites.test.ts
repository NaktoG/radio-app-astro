import { describe, it, expect, beforeEach } from 'vitest'
import { toggleFavorite, isFavorite, useFavoritesStore, _resetFavoritesForTesting } from '../favorites'

describe('favorites store', () => {
  beforeEach(() => {
    localStorage.clear()
    _resetFavoritesForTesting()
  })

  it('starts empty', () => {
    const { favorites } = useFavoritesStore()
    expect(favorites.value.size).toBe(0)
  })

  it('toggles a favorite on', () => {
    toggleFavorite('station-1')
    expect(isFavorite('station-1')).toBe(true)
  })

  it('toggles a favorite off', () => {
    toggleFavorite('station-1')
    toggleFavorite('station-1')
    expect(isFavorite('station-1')).toBe(false)
  })

  it('tracks count correctly', () => {
    const { favoritesCount } = useFavoritesStore()
    expect(favoritesCount.value).toBe(0)
    toggleFavorite('a')
    toggleFavorite('b')
    expect(favoritesCount.value).toBe(2)
  })

  it('persists to localStorage', () => {
    toggleFavorite('station-persist')
    const raw = localStorage.getItem('radio_favorites')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed).toContain('station-persist')
  })
})
