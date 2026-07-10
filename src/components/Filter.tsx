import { useEffect, useState } from 'preact/hooks'
import { Select } from '../ui'
import { useI18n } from '../i18n/client'
import type { StationFilter } from '../lib/types'

interface Props {
  onChange: (filters: StationFilter) => void
}

const COUNTRY_FILTER_OPTIONS = [
  { value: 'AR', label: 'Argentina' },
  { value: 'ES', label: 'España' },
  { value: 'US', label: 'Estados Unidos' },
  { value: 'MX', label: 'México' },
  { value: 'BR', label: 'Brasil' },
  { value: 'CL', label: 'Chile' },
  { value: 'CO', label: 'Colombia' },
  { value: 'PE', label: 'Perú' },
  { value: 'UY', label: 'Uruguay' },
  { value: 'VE', label: 'Venezuela' },
]

const LIMIT_OPTIONS = [
  { value: '50', label: '50' },
  { value: '100', label: '100' },
  { value: '200', label: '200' },
  { value: '300', label: '300' },
]

export default function Filter({ onChange }: Props) {
  const { t } = useI18n()
  const [country, setCountry] = useState('AR')
  const [limit, setLimit] = useState(300)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!ready) {
      setReady(true)
      onChange({ countrycode: country, limit, order: 'votes', reverse: true })
    }
  }, [])

  function emit(c: string, l: number) {
    onChange({ countrycode: c, limit: l, order: 'votes', reverse: true })
  }

  return (
    <div class="flex flex-wrap gap-2 items-end">
      <Select
        label={t('PLAYER.COUNTRY')}
        options={COUNTRY_FILTER_OPTIONS}
        value={country}
        onChange={(v) => { setCountry(v); emit(v, limit) }}
        class="sm:w-48"
      />
      <Select
        label={t('PLAYER.LIMIT')}
        options={LIMIT_OPTIONS}
        value={String(limit)}
        onChange={(v) => { const n = Number(v); setLimit(n); emit(country, n) }}
        class="sm:w-32"
      />
    </div>
  )
}
