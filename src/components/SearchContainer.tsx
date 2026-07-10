import { useState } from 'preact/hooks'
import { Search as SearchIcon, Music } from 'lucide-preact'
import SearchForm from './SearchForm'
import AudioPlayer from './AudioPlayer'
import StationList from './StationList'
import { useAudio } from '../lib/useAudio'
import { EmptyState } from '../ui'
import { useI18n } from '../i18n/client'
import { setStation } from '../stores/player'
import type { Radio } from '../lib/types'

export default function SearchContainer() {
  const { t } = useI18n()
  const [results, setResults] = useState<Radio[]>([])
  const [query, setQuery] = useState('')
  const [selectedStation, setSelectedStation] = useState<Radio | null>(null)
  const audio = useAudio()

  function handleResults(stations: Radio[], q: string) {
    setResults(stations)
    setQuery(q)
  }

  function handleSelect(station: Radio) {
    setSelectedStation(station)
    setStation(station)
    audio.load(station)
  }

  return (
    <div class="space-y-6">
      <SearchForm onResults={handleResults} />

      {selectedStation && <AudioPlayer controls={audio} />}

      {results.length > 0 && (
        <div>
          <p class="text-sm text-[var(--color-text-muted)] mb-3" aria-live="polite">
            {t('SEARCH.RESULTS')}: {results.length}
          </p>
          <StationList
            stations={results}
            currentIndex={-1}
            onSelect={(i) => handleSelect(results[i])}
          />
        </div>
      )}

      {results.length === 0 && query && (
        <EmptyState
          icon={SearchIcon}
          title={t('SEARCH.NO_RESULTS')}
          description={t('SEARCH.NO_RESULTS_DESC')}
        />
      )}

      {results.length === 0 && !query && (
        <EmptyState
          icon={Music}
          title={t('SEARCH.EMPTY_TITLE')}
          description={t('SEARCH.EMPTY_DESC')}
        />
      )}
    </div>
  )
}
