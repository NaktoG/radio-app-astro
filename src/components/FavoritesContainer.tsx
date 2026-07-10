import { useState, useEffect } from 'preact/hooks'
import { Heart, Music } from 'lucide-preact'
import { fetchStationsByUuids } from '../lib/api'
import { useAudio } from '../lib/useAudio'
import { useFavoritesStore } from '../stores/favorites'
import { setStation } from '../stores/player'
import AudioPlayer from './AudioPlayer'
import StationList from './StationList'
import { EmptyState, Spinner } from '../ui'
import { useI18n } from '../i18n/client'
import type { Radio } from '../lib/types'

export default function FavoritesContainer() {
  const { t } = useI18n()
  const { favorites } = useFavoritesStore()
  const [stations, setStations] = useState<Radio[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const audio = useAudio()
  const uuids = [...favorites.value]

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    if (uuids.length === 0) {
      setStations([])
      setLoading(false)
      return
    }

    fetchStationsByUuids(uuids).then((data) => {
      if (cancelled) return
      const valid = data.filter((s) => s.lastcheckok === 1 && (s.url_resolved || s.url))
      setStations(valid)
      setLoading(false)
    }).catch(() => {
      if (cancelled) return
      setStations([])
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [uuids.join(',')])

  const currentStation = stations[currentIndex] || null

  function handleSelect(index: number) {
    setCurrentIndex(index)
    const station = stations[index]
    if (station) {
      setStation(station)
      audio.load(station)
    }
  }

  function goNext() {
    if (stations.length === 0) return
    const next = (currentIndex + 1) % stations.length
    setCurrentIndex(next)
    const station = stations[next]
    if (station) {
      setStation(station)
      audio.load(station)
    }
  }

  if (loading) {
    return (
      <div class="flex items-center justify-center py-24" role="status" aria-live="polite">
        <Spinner size="lg" label={t('FAVORITES.LOADING')} />
      </div>
    )
  }

  if (stations.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title={t('FAVORITES.EMPTY_TITLE')}
        description={t('FAVORITES.EMPTY_DESC')}
      />
    )
  }

  return (
    <div class="grid lg:grid-cols-2 gap-6">
      <div class="space-y-4">
        <p class="text-sm text-[var(--color-text-muted)]">
          {t('FAVORITES.COUNT', { count: stations.length })}
        </p>
        <StationList
          stations={stations}
          currentIndex={currentIndex}
          onSelect={handleSelect}
        />
      </div>
      <div>
        <AudioPlayer
          onNext={goNext}
          controls={audio}
        />
      </div>
    </div>
  )
}
