import { useState, useCallback, useRef } from 'preact/hooks'
import { Heart } from 'lucide-preact'
import { fetchStations } from '../lib/api'
import { useAudio } from '../lib/useAudio'
import { useFavoritesStore } from '../stores/favorites'
import { setStation } from '../stores/player'
import AudioPlayer from './AudioPlayer'
import StationList from './StationList'
import Filter from './Filter'
import { IconButton } from '../ui'
import { useI18n } from '../i18n/client'
import type { Radio, StationFilter } from '../lib/types'

export default function RadioPlayer() {
  const { t } = useI18n()
  const [stations, setStations] = useState<Radio[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [showFavorites, setShowFavorites] = useState(false)
  const errorCountRef = useRef(0)
  const { favorites } = useFavoritesStore()
  const audio = useAudio()

  const displayedStations = showFavorites
    ? stations.filter((s) => favorites.value.has(s.stationuuid))
    : stations

  const currentStation = displayedStations[currentIndex] || null

  const loadStations = useCallback(async (filters: StationFilter) => {
    setLoading(true)
    setLoadError(false)
    errorCountRef.current = 0
    setShowFavorites(false)
    try {
      const data = await fetchStations(filters)
      const valid = data.filter((s) => s.lastcheckok === 1 && (s.url_resolved || s.url))
      setStations(valid)
      setCurrentIndex(0)
    } catch {
      setStations([])
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  function goNext() {
    if (displayedStations.length === 0) return
    errorCountRef.current++
    if (errorCountRef.current >= 5) {
      loadStations({ countrycode: 'AR', limit: 150, order: 'votes', reverse: true })
      errorCountRef.current = 0
      return
    }
    const next = (currentIndex + 1) % displayedStations.length
    setCurrentIndex(next)
    const station = displayedStations[next]
    if (station) {
      setStation(station)
      audio.load(station)
    }
  }

  function handleSelect(index: number) {
    setCurrentIndex(index)
    const station = displayedStations[index]
    if (station) {
      setStation(station)
      audio.load(station)
    }
  }

  function toggleFavFilter() {
    setShowFavorites((prev) => !prev)
    setCurrentIndex(0)
  }

  return (
    <div class="grid items-start gap-5 lg:gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
      <div class="order-2 lg:order-1 space-y-4">
        <div class="flex items-center gap-2">
          <Filter onChange={loadStations} />
          <IconButton
            icon={Heart}
            label={showFavorites ? t('PLAYER.SHOW_ALL') : t('PLAYER.SHOW_FAV')}
            onClick={toggleFavFilter}
            pressed={showFavorites}
            size="md"
            class="self-start sm:self-auto"
          />
        </div>
        {!loadError && (
          <StationList
            stations={displayedStations}
            currentIndex={currentIndex}
            onSelect={handleSelect}
            loading={loading}
          />
        )}
        {loadError && !loading && (
          <p class="rounded-xl border border-[var(--color-danger-soft)] bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
            {t('PLAYER.LOAD_ERROR')}
          </p>
        )}
        {showFavorites && displayedStations.length === 0 && (
          <p class="text-center text-[var(--color-text-muted)] text-sm py-4">
            {t('PLAYER.NO_FAV')}
          </p>
        )}
      </div>
      <div class="order-1 lg:order-2 lg:sticky lg:top-24">
        <AudioPlayer
          onNext={goNext}
          controls={audio}
        />
      </div>
    </div>
  )
}
