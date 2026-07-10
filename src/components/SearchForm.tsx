import { useState, useRef, useCallback } from 'preact/hooks'
import { Search as SearchIcon, X } from 'lucide-preact'
import { searchStations } from '../lib/api'
import { Input, Select, Button } from '../ui'
import { COUNTRY_OPTIONS } from '../lib/countries'
import { useI18n } from '../i18n/client'
import type { Radio } from '../lib/types'

interface Props {
  onResults: (stations: Radio[], query: string) => void
}

export default function SearchForm({ onResults }: Props) {
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const [country, setCountry] = useState('')
  const [tag, setTag] = useState('')
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const doSearch = useCallback(
    async (q: string, c: string, tg: string) => {
      if (!q && !tg) return
      setLoading(true)
      try {
        const results = await searchStations(q, c, tg)
        onResults(results, q)
      } catch {
        onResults([], q)
      } finally {
        setLoading(false)
      }
    },
    [onResults]
  )

  function handleInput(value: string) {
    setQuery(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      doSearch(value, country, tag)
    }, 300)
  }

  function handleSubmit(e: Event) {
    e.preventDefault()
    doSearch(query, country, tag)
  }

  function handleClear() {
    setQuery('')
    setCountry('')
    setTag('')
    onResults([], '')
  }

  return (
    <form onSubmit={handleSubmit} class="space-y-4">
      <div class="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div class="flex-1 min-w-0">
          <div class="relative">
            <Input
              label={t('SEARCH.SEARCH_LABEL')}
              type="text"
              value={query}
              onInput={(e) => handleInput((e.target as HTMLInputElement).value)}
              placeholder={t('SEARCH.SEARCH_PLACEHOLDER')}
              class="!pl-10"
            />
            <SearchIcon
              size={18}
              class="absolute left-3 bottom-3.5 text-[var(--color-text-muted)] pointer-events-none"
              aria-hidden="true"
            />
          </div>
        </div>
        <Select
          label={t('SEARCH.COUNTRY_LABEL')}
          options={COUNTRY_OPTIONS}
          value={country}
          onChange={(v) => { setCountry(v); doSearch(query, v, tag) }}
          class="sm:w-48"
        />
        <Input
          label={t('SEARCH.TAG_LABEL')}
          type="text"
          value={tag}
          onInput={(e) => {
            const v = (e.target as HTMLInputElement).value
            setTag(v)
            doSearch(query, country, v)
          }}
          placeholder={t('SEARCH.TAG_PLACEHOLDER')}
          class="sm:w-48"
        />
      </div>
      <div class="flex gap-3">
        <Button type="submit" loading={loading}>
          {!loading && <SearchIcon size={18} aria-hidden="true" />}
          {loading ? t('SEARCH.BTN_SEARCHING') : t('SEARCH.BTN_SEARCH')}
        </Button>
        <Button type="button" variant="secondary" onClick={handleClear}>
          <X size={18} aria-hidden="true" />
          {t('SEARCH.BTN_CLEAR')}
        </Button>
      </div>
    </form>
  )
}
