import { Play, Pause, SkipForward, VolumeX, Volume1, Volume2, Radio as RadioIcon } from 'lucide-preact'
import { useI18n } from '../i18n/client'
import {
  usePlayerStore,
  setVolume as storeSetVolume,
  toggleMute as storeToggleMute,
} from '../stores/player'
import { Image, Spinner, ErrorAlert, IconButton, Slider, Badge } from '../ui'
import type { AudioControls } from '../lib/useAudio'

interface Props {
  onNext?: () => void
  controls: AudioControls
}

export default function AudioPlayer({ onNext, controls }: Props) {
  const { t } = useI18n()
  const { currentStation: station, isPlaying, isLoading, hasError, volume, muted } = usePlayerStore()

  function handleVolumeChange(v: number) {
    storeSetVolume(v)
    if (controls.audioRef.current) {
      controls.audioRef.current.volume = v
    }
  }

  function handleMute() {
    storeToggleMute()
    if (controls.audioRef.current) {
      const willBeMuted = !controls.audioRef.current.muted
      controls.audioRef.current.muted = willBeMuted
      if (willBeMuted) {
        controls.audioRef.current.volume = 0
      } else {
        controls.audioRef.current.volume = volume.value || 0.7
      }
    }
  }

  if (!station) {
    return (
      <div class="card text-center py-12">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--color-accent-soft)] mb-4">
          <RadioIcon size={32} class="text-[var(--color-accent)]" aria-hidden="true" />
        </div>
        <p class="text-[var(--color-text-muted)]">{t('PLAYER.SELECT_STATION')}</p>
      </div>
    )
  }

  const VolumeIcon = muted.value || volume.value === 0 ? VolumeX : volume.value < 0.4 ? Volume1 : Volume2

  return (
    <div class="card animate-fade-in">
      <div class="flex items-center gap-4 mb-5">
        <Image
          src={station.favicon ? `/api/image-proxy?url=${encodeURIComponent(station.favicon)}` : undefined}
          alt={`Logo de ${station.name}`}
          class="w-16 h-16 rounded-xl object-cover bg-[var(--color-bg-elevated)]"
        />
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs text-[var(--color-text-muted)]">{t('PLAYER.NOW_PLAYING')}</span>
            {isPlaying.value && (
              <Badge variant="accent">
                <span class="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
                LIVE
              </Badge>
            )}
          </div>
          <p class="font-bold text-lg truncate text-[var(--color-text-primary)]">{station.name}</p>
          <p class="text-sm text-[var(--color-text-muted)] truncate">
            {station.tags} · {station.codec} {station.bitrate}kbps
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button
          onClick={controls.togglePlay}
          disabled={isLoading.value}
          class="btn-primary !p-3 disabled:opacity-50"
          aria-label={isLoading.value ? 'Cargando stream' : isPlaying.value ? 'Pausar' : 'Reproducir'}
        >
          {isLoading.value ? <Spinner size="sm" /> : isPlaying.value ? <Pause size={20} /> : <Play size={20} />}
        </button>

        <div class="flex items-center gap-2 flex-1">
          <IconButton
            icon={VolumeIcon}
            label={muted.value ? 'Activar sonido' : 'Silenciar'}
            onClick={handleMute}
            pressed={muted.value}
            size="sm"
          />
          <Slider
            label="Volumen"
            min={0}
            max={1}
            step={0.05}
            value={muted.value ? 0 : volume.value}
            onChange={handleVolumeChange}
          />
        </div>

        {onNext && (
          <IconButton icon={SkipForward} label="Siguiente estación" onClick={onNext} size="md" />
        )}
      </div>

      {hasError.value && (
        <div class="mt-4">
          <ErrorAlert
            message={t('PLAYER.ERROR')}
            action={
              onNext && (
                <button
                  onClick={onNext}
                  class="text-[var(--color-accent-hover)] hover:text-[var(--color-accent)] text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded px-1"
                >
                  {t('PLAYER.ERROR_RETRY')}
                </button>
              )
            }
          />
        </div>
      )}

      {isPlaying.value && !hasError.value && (
        <div class="mt-4 flex items-center gap-1 h-6" aria-hidden="true">
          {[0, 0.15, 0.3, 0.45, 0.6].map((delay) => (
            <span
              key={delay}
              class="w-1 bg-[var(--color-accent)] rounded-full origin-bottom"
              style={`animation: pulse-bar 0.8s ease-in-out infinite; animation-delay: ${delay}s; height: ${20 + Math.random() * 60}%`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
