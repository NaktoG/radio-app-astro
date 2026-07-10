import { signal, computed } from '@preact/signals'
import type { Radio } from '../lib/types'

const VOLUME_KEY = 'radio_volume'
const STATION_KEY = 'radio_current_station'

function loadVolume(): number {
  try {
    return Number(localStorage.getItem(VOLUME_KEY)) || 0.7
  } catch {
    return 0.7
  }
}

function loadStation(): Radio | null {
  try {
    const raw = localStorage.getItem(STATION_KEY)
    return raw ? (JSON.parse(raw) as Radio) : null
  } catch {
    return null
  }
}

const currentStation = signal<Radio | null>(loadStation())
const isPlaying = signal(false)
const isLoading = signal(false)
const hasError = signal(false)
const volume = signal(loadVolume())
const muted = signal(false)
const prevVolume = signal(0.7)

const hasStation = computed(() => currentStation.value !== null)

export function usePlayerStore() {
  return {
    currentStation,
    isPlaying,
    isLoading,
    hasError,
    volume,
    muted,
    hasStation,
  }
}

export function getStation() {
  return currentStation.value
}

export function setStation(station: Radio | null) {
  if (station && !station.url && !station.url_resolved) return
  currentStation.value = station
  hasError.value = false
  if (station) {
    try {
      localStorage.setItem(STATION_KEY, JSON.stringify(station))
    } catch {}
  } else {
    try {
      localStorage.removeItem(STATION_KEY)
    } catch {}
  }
}

export function setPlaying(playing: boolean) {
  isPlaying.value = playing
}

export function setLoading(loading: boolean) {
  isLoading.value = loading
}

export function setError(error: boolean) {
  hasError.value = error
  if (error) isPlaying.value = false
}

export function setVolume(v: number) {
  volume.value = v
  muted.value = false
  try {
    localStorage.setItem(VOLUME_KEY, String(v))
  } catch {}
}

export function toggleMute() {
  if (muted.value) {
    volume.value = prevVolume.value || 0.7
    muted.value = false
  } else {
    prevVolume.value = volume.value
    volume.value = 0
    muted.value = true
  }
}

export function _resetPlayerForTesting() {
  currentStation.value = null
  isPlaying.value = false
  isLoading.value = false
  hasError.value = false
  volume.value = 0.7
  muted.value = false
  prevVolume.value = 0.7
}
