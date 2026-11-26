import { useEffect, useState } from 'preact/hooks'
import { fetchStations, searchStations, fetchStationsByUuids } from '../lib/api'
import type { Radio } from '../lib/types'

export function useStationDirectory(
  view: number,
  country: string,
  genre: string,
  query: string,
  ids: string
) {
  const [rows, setRows] = useState<Radio[]>([])
  const [busy, setBusy] = useState(true)
  const [failed, setFailed] = useState(false)
  const [retry, refresh] = useState(0)
  useEffect(() => {
    let current = true
    setBusy(true)
    setFailed(false)
    setRows([])
    const timer = setTimeout(
      async () => {
        try {
          const result =
            view === 2
              ? await fetchStationsByUuids(ids ? ids.split(',') : [])
              : view === 1
                ? await searchStations(query.trim(), country, genre)
                : await fetchStations({ countrycode: country, tag: genre, limit: 36 })
          if (current) setRows(result.filter((r) => /^https?:\/\//i.test(r.url_resolved || r.url)))
        } catch {
          if (current) setFailed(true)
        } finally {
          if (current) setBusy(false)
        }
      },
      view === 1 ? 300 : 0
    )
    return () => {
      current = false
      clearTimeout(timer)
    }
  }, [view, country, genre, query, ids, retry])
  return { rows, busy, failed, retry: () => refresh((value) => value + 1) }
}
