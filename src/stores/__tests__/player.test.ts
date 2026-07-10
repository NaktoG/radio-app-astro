import { describe, it, expect, beforeEach } from 'vitest'
import { setStation, setVolume, toggleMute, usePlayerStore, _resetPlayerForTesting } from '../player'

describe('player store', () => {
  beforeEach(() => {
    localStorage.clear()
    _resetPlayerForTesting()
  })

  it('starts with no station', () => {
    const { currentStation, hasStation } = usePlayerStore()
    expect(currentStation.value).toBeNull()
    expect(hasStation.value).toBe(false)
  })

  it('sets a station', () => {
    const station = {
      stationuuid: 'test-1',
      name: 'Test Radio',
      url: 'http://example.com/stream',
      url_resolved: 'http://example.com/stream',
    } as any
    setStation(station)
    const { currentStation, hasStation } = usePlayerStore()
    expect(currentStation.value?.stationuuid).toBe('test-1')
    expect(hasStation.value).toBe(true)
  })

  it('sets volume and persists', () => {
    setVolume(0.5)
    const { volume } = usePlayerStore()
    expect(volume.value).toBe(0.5)
    expect(localStorage.getItem('radio_volume')).toBe('0.5')
  })

  it('toggles mute and restores volume', () => {
    setVolume(0.8)
    toggleMute()
    const { muted, volume } = usePlayerStore()
    expect(muted.value).toBe(true)
    expect(volume.value).toBe(0)
    toggleMute()
    expect(muted.value).toBe(false)
    expect(volume.value).toBe(0.8)
  })
})
