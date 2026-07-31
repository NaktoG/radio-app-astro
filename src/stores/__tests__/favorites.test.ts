import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  toggleFavorite,
  isFavorite,
  useFavoritesStore,
  syncFavorites,
  confirmFavoritesImport,
  cancelFavoritesImport,
  _resetFavoritesForTesting,
} from '../favorites'

describe('favorites store', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
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

  it('does not read or write localStorage or sessionStorage when toggling or syncing favorites', async () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem')
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const removeItem = vi.spyOn(Storage.prototype, 'removeItem')
    const fetchMock = vi.fn(async () =>
      Response.json({ success: true, favorites: ['api-station'] })
    )
    vi.stubGlobal('fetch', fetchMock)

    toggleFavorite('station-memory')
    await syncFavorites()

    expect(isFavorite('api-station')).toBe(true)
    expect(isFavorite('station-memory')).toBe(true)
    expect(getItem).not.toHaveBeenCalled()
    expect(setItem).not.toHaveBeenCalled()
    expect(removeItem).not.toHaveBeenCalled()
  })

  it('keeps a favorite clicked during slow initial sync and persists it after the GET resolves', async () => {
    let resolveInitialSync: (response: Response) => void = () => {}
    const initialSyncResponse = new Promise<Response>((resolve) => {
      resolveInitialSync = resolve
    })
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(initialSyncResponse)
      .mockResolvedValueOnce(Response.json({ success: true }))
    vi.stubGlobal('fetch', fetchMock)
    const { favoritesStatus } = useFavoritesStore()

    const syncPromise = syncFavorites()
    expect(favoritesStatus.value.isLoading).toBe(true)

    toggleFavorite('clicked-before-load')

    expect(isFavorite('clicked-before-load')).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    resolveInitialSync(Response.json({ success: true, favorites: ['server-favorite'] }))
    await syncPromise

    expect(isFavorite('server-favorite')).toBe(true)
    expect(isFavorite('clicked-before-load')).toBe(true)
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/favorites',
      expect.objectContaining({
        method: 'POST',
        credentials: 'same-origin',
        body: JSON.stringify({ stationUuid: 'clicked-before-load' }),
      })
    )
  })

  it('persists clicks after the initial GET fails instead of dropping them', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(Response.json({ success: true }))
    vi.stubGlobal('fetch', fetchMock)
    const { favoritesStatus } = useFavoritesStore()

    await syncFavorites()
    expect(favoritesStatus.value.error).toBe('Could not load favorites')

    await toggleFavorite('after-load-failure')

    expect(isFavorite('after-load-failure')).toBe(true)
    expect(favoritesStatus.value.error).toBeNull()
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/favorites',
      expect.objectContaining({
        method: 'POST',
        credentials: 'same-origin',
        body: JSON.stringify({ stationUuid: 'after-load-failure' }),
      })
    )
  })

  it('rolls back a queued mutation failure to the initial server state deterministically', async () => {
    let resolveInitialSync: (response: Response) => void = () => {}
    const initialSyncResponse = new Promise<Response>((resolve) => {
      resolveInitialSync = resolve
    })
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(initialSyncResponse)
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
    vi.stubGlobal('fetch', fetchMock)
    const { favoritesStatus } = useFavoritesStore()

    const syncPromise = syncFavorites()
    toggleFavorite('server-kept-favorite')

    resolveInitialSync(Response.json({ success: true, favorites: ['server-kept-favorite'] }))
    await syncPromise

    expect(isFavorite('server-kept-favorite')).toBe(true)
    expect(favoritesStatus.value.error).toBe('Could not update favorite')
  })

  it('uses same-origin credentials when loading and mutating favorites', async () => {
    const fetchMock = vi.fn(async () => Response.json({ success: true, favorites: [] }))
    vi.stubGlobal('fetch', fetchMock)

    await syncFavorites()
    toggleFavorite('station-persist')
    await Promise.resolve()

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/favorites', {
      credentials: 'same-origin',
    })
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/favorites',
      expect.objectContaining({
        method: 'POST',
        credentials: 'same-origin',
        body: JSON.stringify({ stationUuid: 'station-persist' }),
      })
    )
  })

  it('reverts optimistic favorite changes when the API mutation fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ success: true, favorites: [] }))
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
    vi.stubGlobal('fetch', fetchMock)

    await syncFavorites()
    toggleFavorite('station-fail')
    expect(isFavorite('station-fail')).toBe(true)

    await Promise.resolve()
    await Promise.resolve()

    expect(isFavorite('station-fail')).toBe(false)
  })

  it('rolls back only the failed station when another favorite changes before the failed mutation settles', async () => {
    let rejectStationA: (error: Error) => void = () => {}
    const stationAFailure = new Promise<Response>((_, reject) => {
      rejectStationA = reject
    })
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ success: true, favorites: [] }))
      .mockReturnValueOnce(stationAFailure)
      .mockResolvedValueOnce(Response.json({ success: true }))
    vi.stubGlobal('fetch', fetchMock)
    const { favoritesStatus } = useFavoritesStore()

    await syncFavorites()
    const stationAPromise = toggleFavorite('station-a')
    const stationBPromise = toggleFavorite('station-b')

    expect(isFavorite('station-a')).toBe(true)
    expect(isFavorite('station-b')).toBe(true)

    rejectStationA(new Error('network failed'))
    await stationAPromise
    await stationBPromise

    expect(isFavorite('station-a')).toBe(false)
    expect(isFavorite('station-b')).toBe(true)
    expect(favoritesStatus.value.error).toBe('Could not update favorite')
  })

  it('exposes loading, empty, and error states while syncing favorites', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 503 }))
    vi.stubGlobal('fetch', fetchMock)
    const { favoritesStatus } = useFavoritesStore()

    const syncPromise = syncFavorites()
    expect(favoritesStatus.value.isLoading).toBe(true)
    await syncPromise

    expect(favoritesStatus.value.isLoading).toBe(false)
    expect(favoritesStatus.value.isEmpty).toBe(true)
    expect(favoritesStatus.value.error).toBe('Could not load favorites')
  })

  it('confirms import by deduping station IDs, batch upserting to the API, and cleaning up only after success', async () => {
    const cleanupLegacyFavorites = vi.fn()
    const fetchMock = vi.fn(async () => Response.json({ success: true, favorites: ['api-a', 'legacy-b'] }))
    vi.stubGlobal('fetch', fetchMock)

    await syncFavorites()
    await confirmFavoritesImport(['legacy-b', 'legacy-b', 'legacy-c'], cleanupLegacyFavorites)

    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/favorites',
      expect.objectContaining({
        method: 'POST',
        credentials: 'same-origin',
        body: JSON.stringify({ stationUuids: ['api-a', 'legacy-b', 'legacy-c'], confirmed: true }),
      })
    )
    expect(isFavorite('api-a')).toBe(true)
    expect(isFavorite('legacy-c')).toBe(true)
    expect(cleanupLegacyFavorites).toHaveBeenCalledOnce()
  })

  it('keeps import retryable or cancelable without writing fallback storage when import fails', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const cleanupLegacyFavorites = vi.fn()
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ success: true, favorites: ['api-a'] }))
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
    vi.stubGlobal('fetch', fetchMock)
    const { favoritesStatus } = useFavoritesStore()

    await syncFavorites()
    await expect(confirmFavoritesImport(['legacy-fail'], cleanupLegacyFavorites)).rejects.toThrow(
      'Could not import favorites'
    )
    cancelFavoritesImport()

    expect(isFavorite('api-a')).toBe(true)
    expect(isFavorite('legacy-fail')).toBe(false)
    expect(favoritesStatus.value.importPending).toBe(false)
    expect(favoritesStatus.value.error).toBeNull()
    expect(cleanupLegacyFavorites).not.toHaveBeenCalled()
    expect(setItem).not.toHaveBeenCalled()
  })
})
