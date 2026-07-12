import { Heart, Radio as RadioIcon } from 'lucide-preact'
import type { Radio } from '../lib/types'
import { Image, Spinner, EmptyState, IconButton } from '../ui'
import { useI18n } from '../i18n/client'
import { useFavoritesStore, toggleFavorite } from '../stores/favorites'

interface Props {
  stations: Radio[]
  currentIndex: number
  onSelect: (index: number) => void
  loading?: boolean
}

export default function StationList({
  stations,
  currentIndex,
  onSelect,
  loading,
}: Props) {
  const { t } = useI18n()
  const { favorites } = useFavoritesStore()

  if (loading) {
    return (
      <div class="flex items-center justify-center py-12" role="status" aria-live="polite">
        <Spinner size="lg" label={t('PLAYER.LOADING')} />
      </div>
    )
  }

  if (stations.length === 0) {
    return (
      <EmptyState
        icon={RadioIcon}
        title={t('PLAYER.NO_STATIONS_TITLE')}
        description={t('PLAYER.NO_STATIONS_DESC')}
      />
    )
  }

  return (
<ul
  class="space-y-2 max-h-[34dvh] sm:max-h-[40dvh] md:max-h-[60dvh] overflow-y-auto pr-1 sm:pr-2 scrollable-touch"
  role="listbox"
  aria-label={t('PLAYER.STATIONS_LIST')}
>
      {stations.map((station, i) => {
        const fav = favorites.value.has(station.stationuuid)
        const isSelected = i === currentIndex
        return (
          <li
            key={station.stationuuid || i}
            class={`animate-stagger rounded-lg transition-all duration-200 flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 ${
              isSelected
                ? 'bg-[var(--color-accent-soft)] border border-[var(--color-accent)]'
                : 'glass hover:border-[var(--color-border-strong)]'
            }`}
            style={`animation-delay: ${i * 0.04}s`}
          >
            <button
              onClick={() => onSelect(i)}
              class="flex-1 text-left flex items-center gap-3 min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded-lg px-1"
              role="option"
              aria-selected={isSelected}
              aria-label={`${station.name}, ${station.country}`}
            >
              <Image
                src={station.favicon ? `/api/image-proxy?url=${encodeURIComponent(station.favicon)}` : undefined}
                alt=""
                class="w-10 h-10 rounded-lg object-cover bg-[var(--color-bg-elevated)] flex-shrink-0"
              />
              <div class="min-w-0 flex-1">
                <p class="font-medium text-sm sm:text-base truncate text-[var(--color-text-primary)]">{station.name}</p>
                <p class="text-xs text-[var(--color-text-muted)] truncate">
                  {station.country} · {station.tags} · {station.codec} {station.bitrate}kbps
                </p>
              </div>
              <span
                class="text-xs text-[var(--color-text-muted)] flex-shrink-0"
                aria-label={`${station.votes} ${t('PLAYER.VOTES')}`}
              >
                {station.votes}
              </span>
            </button>
            <IconButton
              icon={Heart}
              label={fav ? `Quitar ${station.name} de favoritos` : `Agregar ${station.name} a favoritos`}
              onClick={() => toggleFavorite(station.stationuuid)}
              pressed={fav}
              size="sm"
            />
          </li>
        )
      })}
    </ul>
  )
}
