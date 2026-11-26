import type { ComponentChildren } from 'preact'
import {
  Play,
  Pause,
  Shuffle,
  SkipForward,
  ChevronLeft,
  Headphones,
  Volume2,
  RadioTower,
} from 'lucide-preact'
import type { Radio } from '../lib/types'
import type { PlaybackStatus } from '../hooks/useRadioPlayback'
interface Props {
  tr: (es: string, en: string) => string
  featured: Radio | undefined
  station: Radio | null
  rows: Radio[]
  status: PlaybackStatus
  volume: number
  setVolume: (volume: number) => void
  play: (station: Radio, restart?: boolean) => void
  surprise: () => void
  onBack: () => void
  favorite: (station: Radio) => ComponentChildren
}
export default function RadioPlayerPanel({
  tr,
  featured,
  station,
  rows,
  status,
  volume,
  setVolume,
  play,
  surprise,
  onBack,
  favorite,
}: Props) {
  const playing = status === 'playing'
  return (
    <section
      class={'console ' + (playing ? 'sounding' : '')}
      aria-label={tr('Reproductor', 'Player')}
    >
      <div class="player-heading">
        <button
          class="icon-button player-back"
          onClick={onBack}
          aria-label={tr('Volver a las emisoras', 'Back to stations')}
        >
          <ChevronLeft size={22} />
        </button>
        <span>{tr('TU FRECUENCIA', 'YOUR FREQUENCY')}</span>
        <Headphones size={20} />
      </div>
      <div class="record-sleeve" aria-hidden="true">
        <div class="vinyl">
          <i>
            <img src="/favicon.svg" alt="" />
          </i>
        </div>
        <span class="record-caption">RADIO APP • LIVE RADIO •</span>
      </div>
      <div class="player-metadata">
        <small aria-live="polite">
          ●{' '}
          {status === 'error'
            ? tr('Señal interrumpida', 'Signal interrupted')
            : status === 'waiting'
              ? tr('Conectando…', 'Connecting…')
              : playing
                ? tr('En el aire', 'On air')
                : station
                  ? tr('En pausa', 'Paused')
                  : tr('Lista para escuchar', 'Ready to play')}
        </small>
        <div>
          <h2>{featured?.name || tr('Tu próxima emisora', 'Your next station')}</h2>
          {featured && favorite(featured)}
        </div>
        <p>
          {featured
            ? [featured.country, featured.tags.split(',')[0]].filter(Boolean).join(' · ')
            : tr('Elegí una emisora para empezar.', 'Choose a station to get started.')}
        </p>
      </div>
      <div class="signal-line" aria-hidden="true">
        <span />
      </div>
      <div class="signal-label">
        <span>{tr('RADIO EN DIRECTO', 'LIVE RADIO')}</span>
        <span>LIVE</span>
      </div>
      <div class="transport">
        <button
          class="icon-button"
          disabled={!rows.length}
          onClick={surprise}
          aria-label={tr('Sorprendeme', 'Surprise me')}
          title={tr('Sorprendeme', 'Surprise me')}
        >
          <Shuffle size={23} />
        </button>
        <button
          class="main-play"
          disabled={!featured}
          onClick={() => featured && play(featured)}
          aria-label={
            playing ? tr('Pausar radio', 'Pause radio') : tr('Reproducir radio', 'Play radio')
          }
        >
          {playing ? (
            <Pause size={30} fill="currentColor" />
          ) : (
            <Play size={30} fill="currentColor" />
          )}
        </button>
        <button
          class="icon-button"
          aria-label={tr('Siguiente emisora', 'Next station')}
          disabled={!rows.length}
          onClick={() =>
            play(
              rows[
                (rows.findIndex((r) => r.stationuuid === featured?.stationuuid) + 1) % rows.length
              ],
              true
            )
          }
        >
          <SkipForward size={25} />
        </button>
      </div>
      <label class="volume-control">
        <Volume2 size={18} />
        <span class="sr-only">{tr('Volumen', 'Volume')}</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onInput={(e) => {
            const value = Number(e.currentTarget.value)
            setVolume(value)
          }}
        />
        <span>{Math.round(volume * 100)}%</span>
      </label>
      {status === 'error' && (
        <p class="player-error" role="alert">
          {tr(
            'La emisora no responde. Probá de nuevo o elegí otra.',
            'The station is not responding. Try again or choose another.'
          )}
        </p>
      )}
      <div class="listening-note">
        <RadioTower size={18} />
        <span>
          {tr('Una señal. Miles de historias.', 'One signal. Thousands of stories.')}
          <small>{tr('Quedate en tu frecuencia.', 'Stay on your frequency.')}</small>
        </span>
      </div>
    </section>
  )
}
