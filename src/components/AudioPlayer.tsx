import {
  CirclePlay,
  CirclePause,
  StepForward,
  VolumeX,
  Volume1,
  Volume2,
  AudioWaveform,
} from 'lucide-preact'
import { useI18n } from '../i18n/client'
import {
  usePlayerStore,
  setVolume as storeSetVolume,
  toggleMute as storeToggleMute,
} from '../stores/player'
import { Image, Spinner, ErrorAlert, IconButton, Slider } from '../ui'
import type { AudioControls } from '../lib/useAudio'

interface Props {
  onNext?: () => void
  controls: AudioControls
}

const WAVE_COUNT = 8

export default function AudioPlayer({ onNext, controls }: Props) {
  const { t } = useI18n()
  const {
    currentStation: station,
    isPlaying,
    isLoading,
    hasError,
    volume,
    muted,
  } = usePlayerStore()

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

  if (!station.value) {
    return (
      <div class="card flex items-center gap-3 py-4 sm:flex-col sm:justify-center sm:py-16 sm:text-center animate-scale-in">
        <div class="icon-orb shrink-0 !w-12 !h-12 !rounded-xl sm:mx-auto sm:mb-5 sm:!w-20 sm:!h-20 sm:!rounded-full">
          <AudioWaveform size={24} strokeWidth={1.9} aria-hidden="true" />
        </div>
        <p class="text-left text-sm text-[var(--color-text-muted)] sm:text-center sm:text-lg">
          {t('PLAYER.SELECT_STATION')}
        </p>
      </div>
    )
  }

  const VolumeIcon =
    muted.value || volume.value === 0 ? VolumeX : volume.value < 0.4 ? Volume1 : Volume2
  const containerClass = isPlaying.value && !hasError.value ? 'card-glow' : 'card'
  const currentStation = station.value

  return (
    <div class={`${containerClass} animate-scale-in relative min-h-0 overflow-hidden`}>
      <div
        class="pointer-events-none absolute -top-20 -right-16 hidden h-56 w-56 rounded-full opacity-40 blur-3xl sm:block"
        style="background: radial-gradient(circle, color-mix(in oklab, var(--color-accent) 65%, transparent) 0%, transparent 70%)"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute -bottom-24 -left-16 hidden h-56 w-56 rounded-full opacity-30 blur-3xl sm:block"
        style="background: radial-gradient(circle, color-mix(in oklab, var(--color-pink) 60%, transparent) 0%, transparent 72%)"
        aria-hidden="true"
      />
      <div class="mb-3 flex items-center gap-2.5 text-left lg:mb-6 lg:flex-col lg:gap-3 lg:text-center">
        <div class="relative shrink-0 lg:mb-5">
          <Image
            src={
              currentStation.favicon
                ? `/api/image-proxy?url=${encodeURIComponent(currentStation.favicon)}`
                : undefined
            }
            alt={`Logo de ${currentStation.name}`}
            class="w-12 h-12 lg:w-40 lg:h-40 rounded-xl lg:rounded-2xl object-cover bg-[var(--color-bg-elevated)] shadow-[0_12px_34px_rgb(0_0_0_/_0.45)]"
          />
          {isPlaying.value && !hasError.value && (
            <div class="absolute -inset-1 lg:-inset-2 rounded-2xl lg:rounded-3xl border border-[var(--color-accent-soft)] opacity-50 animate-spin-slow pointer-events-none" />
          )}
        </div>

        <div class="min-w-0 flex-1 basis-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[0.65rem] lg:text-xs text-[var(--color-text-muted)] font-medium uppercase tracking-wider">
              {t('PLAYER.NOW_PLAYING')}
            </span>
            {isPlaying.value && !hasError.value && (
              <span class="flex items-center gap-1.5 text-[0.65rem] lg:text-xs font-semibold text-[var(--color-accent)]">
                <span class="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
                LIVE
              </span>
            )}
          </div>

          <h2 class="text-base lg:text-fluid-xl font-bold truncate max-w-full text-[var(--color-text-primary)]">
            {currentStation.name}
          </h2>
          <p class="text-xs lg:text-sm text-[var(--color-text-muted)] truncate max-w-full mt-0.5 lg:mt-1">
            {currentStation.tags} · {currentStation.codec} {currentStation.bitrate}kbps
          </p>
        </div>

        <div class="flex shrink-0 items-center justify-center gap-2 lg:gap-4">
          <button
            onClick={controls.togglePlay}
            disabled={isLoading.value}
            class={`
              relative flex items-center justify-center
              w-12 h-12 lg:w-20 lg:h-20 rounded-full
              bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-pink)]
              text-white transition-all duration-300 ease-out
              disabled:opacity-50 disabled:cursor-not-allowed
              ${isPlaying.value && !hasError.value ? 'shadow-[var(--shadow-glow)]' : ''}
              hover:shadow-[var(--shadow-glow)] hover:scale-105
              active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-accent-soft)]
            `}
            aria-label={
              isLoading.value ? 'Cargando stream' : isPlaying.value ? 'Pausar' : 'Reproducir'
            }
          >
            {isLoading.value ? (
              <Spinner size="sm" />
            ) : isPlaying.value ? (
              <CirclePause size={28} strokeWidth={2.2} />
            ) : (
              <CirclePlay size={28} strokeWidth={2.2} />
            )}
          </button>

          {onNext && (
            <button
              onClick={onNext}
              class="flex items-center justify-center w-11 h-11 lg:w-14 lg:h-14 rounded-full glass text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[color-mix(in_oklab,white_10%,transparent)] transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              aria-label={t('PLAYER.NEXT')}
            >
              <StepForward size={22} />
            </button>
          )}
        </div>
      </div>

      <div class="hidden lg:flex items-end justify-center gap-1.5 h-16 mb-6" aria-hidden="true">
        {Array.from({ length: WAVE_COUNT }, (_, i) => (
          <span
            key={i}
            class={`w-1.5 rounded-full ${
              isPlaying.value && !hasError.value
                ? 'bg-[var(--color-accent)]'
                : 'bg-[var(--color-border-strong)]'
            }`}
            style={{
              height:
                isPlaying.value && !hasError.value ? `${18 + Math.sin(i * 2.5) * 40 + 30}%` : '30%',
              animation:
                isPlaying.value && !hasError.value
                  ? `bar-wave ${0.4 + i * 0.08}s ease-in-out infinite`
                  : 'none',
              animationDelay: `${i * 0.1}s`,
              opacity: isPlaying.value && !hasError.value ? 1 : 0.3,
            }}
          />
        ))}
      </div>

      <div class="mt-3 flex items-center gap-2.5 px-0 lg:gap-3 lg:px-2">
        <IconButton
          icon={VolumeIcon}
          label={muted.value ? 'Activar sonido' : 'Silenciar'}
          onClick={handleMute}
          pressed={muted.value}
          size="sm"
        />
        <div class="flex-1">
          <Slider
            label="Volumen"
            min={0}
            max={1}
            step={0.05}
            value={muted.value ? 0 : volume.value}
            onChange={handleVolumeChange}
          />
        </div>
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
    </div>
  )
}
