import { useEffect, useRef, useState } from 'preact/hooks'
import {
  Play,
  Pause,
  Shuffle,
  Compass,
  Search,
  Heart,
  SkipForward,
  Disc3,
  Library,
  RadioTower,
} from 'lucide-preact'
import { fetchStations, searchStations, fetchStationsByUuids } from '../lib/api'
import type { Radio } from '../lib/types'
import { syncFavorites, toggleFavorite, useFavoritesStore } from '../stores/favorites'
import '../styles/dial.css'

const bands = ['AR', 'ES', 'MX', 'US', 'BR', 'FR', 'GB']
export default function Dial({ english, profile }: { english: boolean; profile: boolean }) {
  const tr = (es: string, en: string) => (english ? en : es)
  const [view, setView] = useState(0)
  const [country, setCountry] = useState('AR')
  const [genre, setGenre] = useState('')
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState<Radio[]>([])
  const [busy, setBusy] = useState(true)
  const [failed, setFailed] = useState(false)
  const [retry, refresh] = useState(0)
  const [station, select] = useState<Radio | null>(null)
  const [status, setStatus] = useState<'idle' | 'waiting' | 'playing' | 'paused' | 'error'>('idle')
  const [recent, setRecent] = useState<Radio[]>([])
  const audio = useRef<HTMLAudioElement>(null)
  const { favorites, favoritesStatus } = useFavoritesStore()
  const ids = view === 2 ? [...favorites.value].join(',') : ''
  useEffect(() => {
    if (profile) void syncFavorites()
  }, [profile])
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
  function play(r: Radio, restart = false) {
    const a = audio.current
    if (!a) return
    if (!restart && station?.stationuuid === r.stationuuid && !a.paused) {
      a.pause()
      return
    }
    if (station?.stationuuid !== r.stationuuid || a.error) a.src = r.url_resolved || r.url
    select(r)
    setStatus('waiting')
    void a.play().catch((e) => {
      if (e.name !== 'AbortError') setStatus('error')
    })
  }
  const featured = station || rows[0]
  const labels = [
    tr('Explorar', 'Explore'),
    tr('Buscar', 'Search'),
    tr('Tu biblioteca', 'Your library'),
  ]
  const icons = [Compass, Search, Library]
  function navigate(next: number) {
    setView(next)
    document.querySelector('#main')?.scrollIntoView({ block: 'start' })
  }
  const navigation = labels.map((label, i) => {
    const Icon = icons[i]
    return (
      <button
        key={label}
        aria-current={view === i ? 'page' : undefined}
        onClick={() => navigate(i)}
      >
        <Icon size={20} />
        {label}
      </button>
    )
  })
  const playing = status === 'playing'
  return (
    <div class="dial-app" data-view={view}>
      <audio
        ref={audio}
        onPlaying={() => {
          setStatus('playing')
          if (station)
            setRecent((prev) =>
              [station, ...prev.filter((r) => r.stationuuid !== station.stationuuid)].slice(0, 6)
            )
        }}
        onWaiting={() => setStatus('waiting')}
        onPause={() => setStatus('paused')}
        onError={() => setStatus('error')}
      />
      <header>
        <strong>
          <RadioTower /> Radio App
        </strong>
        <a href={profile ? '/favorites' : '/auth/profile'}>
          {profile ? tr('Mi biblioteca', 'My library') : tr('Crear perfil', 'Create profile')}
        </a>
      </header>
      <main id="main">
        <div class="side-library">
          <a href="#studio-title">
            <RadioTower size={22} /> Radio App
          </a>
          <nav aria-label={tr('Secciones', 'Sections')}>{navigation}</nav>
        </div>
        <section class="discovery">
          <h2>{labels[view]}</h2>
          {view === 0 && (
            <>
              <div class="genre-shelf">
                {['rock', 'jazz', 'electronic'].map((g, i) => (
                  <button
                    key={g}
                    aria-pressed={genre === g}
                    onClick={() => setGenre(genre === g ? '' : g)}
                  >
                    <img
                      src={'/cover-' + g + '.webp'}
                      alt=""
                      loading="lazy"
                      width="480"
                      height="320"
                    />
                    <b>{['Rock', 'Jazz', tr('Electrónica', 'Electronic')][i]}</b>
                  </button>
                ))}
              </div>
              {recent.length > 0 && (
                <section class="recent">
                  <h3>{tr('Volver a escuchar', 'Recently played')}</h3>
                  <div>
                    {recent.map((r) => (
                      <button key={r.stationuuid} onClick={() => play(r, true)}>
                        <Disc3 />
                        {r.name}
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </section>
        <section class={'console ' + (playing ? 'sounding' : '')}>
          <div class="record-sleeve" aria-hidden="true">
            <div class="vinyl">
              <i />
            </div>
            <div class="tonearm" />
          </div>
          <div class="dial-scale" aria-hidden="true">
            <i key={featured?.stationuuid} />
          </div>
          <small aria-live="polite">
            {status === 'error'
              ? tr('Señal interrumpida', 'Signal interrupted')
              : status === 'waiting'
                ? tr('Conectando…', 'Connecting…')
                : playing
                  ? tr('En el aire', 'On air')
                  : station
                    ? tr('En pausa', 'Paused')
                    : tr('Sintonizador', 'Radio tuner')}
          </small>
          <h1>{featured?.name || tr('Radio mundial', 'World radio')}</h1>
          <p>
            {featured
              ? [featured.country, featured.tags.split(',')[0]].filter(Boolean).join(' · ')
              : tr('Elegí una emisora', 'Choose a station')}
          </p>
          <div class="transport">
            <button disabled={!featured} onClick={() => featured && play(featured)}>
              {playing ? <Pause /> : <Play />}
              {playing ? tr('Pausar', 'Pause') : tr('Escuchar', 'Listen')}
            </button>
            <button
              disabled={!rows.length}
              onClick={() => {
                const pool = rows.filter((r) => r.stationuuid !== station?.stationuuid)
                play(pool[Math.floor(Math.random() * pool.length)] || rows[0])
              }}
            >
              <Shuffle />
              {tr('Sorprendeme', 'Surprise me')}
            </button>
          </div>
          <div class="dial-bars" aria-hidden="true">
            {Array.from({ length: 32 }, (_, i) => (
              <i
                key={i}
                style={{
                  height: 15 + Math.abs(Math.sin(i * 2.7)) * 80 + '%',
                  animationDelay: (i % 7) * -0.13 + 's',
                }}
              />
            ))}
          </div>
        </section>
        <section class="directory">
          <h3>
            {view === 2
              ? tr('Emisoras guardadas', 'Saved stations')
              : view === 1
                ? tr('Encontrar emisoras', 'Find stations')
                : tr('Emisoras en directo', 'Live stations')}
          </h3>
          {view !== 2 && (
            <label>
              {tr('País', 'Country')}{' '}
              <select value={country} onChange={(e) => setCountry(e.currentTarget.value)}>
                {bands.map((c) => (
                  <option key={c} value={c}>
                    {new Intl.DisplayNames([english ? 'en' : 'es'], { type: 'region' }).of(c)}
                  </option>
                ))}
              </select>
            </label>
          )}
          {view !== 2 && (
            <label>
              {tr('Género', 'Genre')}{' '}
              <select value={genre} onChange={(e) => setGenre(e.currentTarget.value)}>
                <option value="">{tr('Todos', 'All')}</option>
                {['rock', 'pop', 'jazz', 'electronic', 'classical'].map((tag) => (
                  <option key={tag}>{tag}</option>
                ))}
              </select>
            </label>
          )}
          {view === 1 && (
            <input
              aria-label={labels[1]}
              placeholder={tr('Nombre de la emisora', 'Station name')}
              value={query}
              onInput={(e) => setQuery(e.currentTarget.value)}
            />
          )}
          {view === 2 && !profile ? (
            <a href="#nickname">
              {tr('Crear perfil para guardar favoritas', 'Create a profile to save favorites')}
            </a>
          ) : busy ? (
            <p role="status">{tr('Buscando emisoras…', 'Finding stations…')}</p>
          ) : failed ? (
            <button onClick={() => refresh(retry + 1)}>
              {tr('Reintentar búsqueda', 'Retry search')}
            </button>
          ) : !rows.length ? (
            <p>{tr('Sin emisoras en esta selección', 'No stations in this selection')}</p>
          ) : (
            rows.map((r, index) => (
              <div
                style={{ '--enter': Math.min(index, 5) }}
                class={'radio-row ' + (station?.stationuuid === r.stationuuid ? 'selected' : '')}
                key={r.stationuuid}
              >
                <button onClick={() => play(r)}>
                  <span
                    class="station-art"
                    style={{
                      '--tone':
                        (Array.from(r.name).reduce((sum, ch) => sum + ch.charCodeAt(0), 0) * 17) %
                        360,
                    }}
                  >
                    {station?.stationuuid === r.stationuuid && playing ? <Pause /> : <Play />}
                  </span>
                  <b>
                    {r.name}
                    <small>
                      {r.country} · {r.codec}
                    </small>
                  </b>
                </button>
                {profile ? (
                  <button
                    aria-label={tr('Favorita', 'Favorite')}
                    aria-pressed={favorites.value.has(r.stationuuid)}
                    onClick={() => void toggleFavorite(r.stationuuid)}
                  >
                    <Heart />
                  </button>
                ) : (
                  <a
                    href="#nickname"
                    aria-label={tr('Guardar con un perfil', 'Save with a profile')}
                  >
                    <Heart />
                  </a>
                )}
              </div>
            ))
          )}
          {profile && favoritesStatus.value.error && (
            <p role="alert">
              {tr('No se pudieron sincronizar las favoritas.', 'Could not sync favorites.')}{' '}
              <button onClick={() => void syncFavorites()}>{tr('Reintentar', 'Retry')}</button>
            </p>
          )}
        </section>
      </main>
      <aside>
        {station && (
          <div class="mini">
            <Disc3 aria-hidden="true" />
            <b>
              {station.name}
              <small>{station.country}</small>
            </b>
            <button
              aria-label={playing ? tr('Pausar', 'Pause') : tr('Escuchar', 'Play')}
              onClick={() => play(station)}
            >
              {playing ? <Pause /> : <Play />}
            </button>
            <button
              aria-label={tr('Siguiente emisora', 'Next station')}
              disabled={!rows.length}
              onClick={() =>
                play(
                  rows[
                    (rows.findIndex((r) => r.stationuuid === station.stationuuid) + 1) % rows.length
                  ],
                  true
                )
              }
            >
              <SkipForward />
            </button>
          </div>
        )}
        <nav aria-label={tr('Secciones', 'Sections')}>{navigation}</nav>
      </aside>
    </div>
  )
}
