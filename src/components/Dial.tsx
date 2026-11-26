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
  ArrowUpRight,
  ChevronLeft,
  Headphones,
  Volume2,
} from 'lucide-preact'
import { fetchStations, searchStations, fetchStationsByUuids } from '../lib/api'
import type { Radio } from '../lib/types'
import { syncFavorites, toggleFavorite, useFavoritesStore } from '../stores/favorites'
import '../styles/dial-yellow.css'

function StationArtwork({ radio }: { radio: Radio }) {
  const [failed, setFailed] = useState(false)
  const src = /^https:\/\//i.test(radio.favicon) ? radio.favicon : ''
  const initials = radio.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
  return (
    <span class={'station-logo ' + (!src || failed ? 'station-initials' : '')}>
      {src && !failed ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <b>{initials || 'FM'}</b>
      )}
    </span>
  )
}

const bands = ['AR', 'ES', 'MX', 'US', 'BR', 'FR', 'GB']
export default function Dial({
  english,
  profile,
  nickname = '',
}: {
  english: boolean
  profile: boolean
  nickname?: string
}) {
  const tr = (es: string, en: string) => (english ? en : es)
  const [view, setView] = useState(0)
  const [playerOpen, setPlayerOpen] = useState(false)
  const [volume, setVolume] = useState(0.7)
  useEffect(() => {
    const selected = new URLSearchParams(location.search).get('view')
    if (selected === 'favorites') setView(2)
    if (selected === 'search') setView(1)
    if (selected === 'listening') setPlayerOpen(true)
  }, [])
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
    tr('Favoritas', 'Favorites'),
    tr('Escuchar', 'Listen'),
  ]
  const icons = [Compass, Search, Library, Headphones]
  function navigate(next: number) {
    setPlayerOpen(next === 3)
    if (next !== 3) setView(next)
    history.replaceState(
      null,
      '',
      '/player' +
        (next === 1
          ? '?view=search'
          : next === 2
            ? '?view=favorites'
            : next === 3
              ? '?view=listening'
              : '')
    )
    document.querySelector('#main')?.scrollIntoView({ block: 'start' })
  }
  const navigation = labels.map((label, i) => {
    const Icon = icons[i]
    return (
      <button
        key={label}
        aria-current={(playerOpen ? i === 3 : view === i) ? 'page' : undefined}
        onClick={() => navigate(i)}
      >
        <Icon size={20} />
        <span>{label}</span>
      </button>
    )
  })
  const playing = status === 'playing'
  function tune(r: Radio) {
    play(r, true)
    navigate(3)
  }
  function surprise() {
    const pool = rows.filter((r) => r.stationuuid !== station?.stationuuid)
    const next = pool[Math.floor(Math.random() * pool.length)] || rows[0]
    if (next) tune(next)
  }
  function favorite(r: Radio) {
    const saved = favorites.value.has(r.stationuuid)
    return profile ? (
      <button
        class="favorite-button"
        aria-label={`${saved ? tr('Quitar de favoritas', 'Remove favorite') : tr('Guardar favorita', 'Save favorite')}: ${r.name}`}
        aria-pressed={saved}
        onClick={() => void toggleFavorite(r.stationuuid)}
      >
        <Heart size={19} fill={saved ? 'currentColor' : 'none'} />
      </button>
    ) : (
      <a
        class="favorite-button"
        href="/auth/profile"
        aria-label={tr('Crear perfil para guardar favoritas', 'Create a profile to save favorites')}
      >
        <Heart size={19} />
      </a>
    )
  }
  function artwork(r: Radio) {
    return <StationArtwork key={r.stationuuid} radio={r} />
  }
  function stationRow(r: Radio, index: number) {
    const active = station?.stationuuid === r.stationuuid
    return (
      <div class={'radio-row ' + (active ? 'selected' : '')} key={r.stationuuid}>
        <span class="row-number">{String(index + 1).padStart(2, '0')}</span>
        <button
          class="row-station"
          onClick={() => tune(r)}
          aria-label={`${tr('Escuchar', 'Listen to')} ${r.name}`}
        >
          <span class="row-art">{artwork(r)}</span>
          <span class="row-copy">
            <b>{r.name}</b>
            <small>
              {r.country}
              {r.tags ? ` · ${r.tags.split(',')[0]}` : ''}
            </small>
          </span>
          <span class="row-play">
            {active && playing ? (
              <span class="live-bars" aria-label={tr('Sonando', 'Playing')}>
                <i />
                <i />
                <i />
              </span>
            ) : (
              <Play size={15} fill="currentColor" />
            )}
          </span>
        </button>
        {favorite(r)}
      </div>
    )
  }
  const countryName = new Intl.DisplayNames([english ? 'en' : 'es'], { type: 'region' }).of(country)
  return (
    <div class={'dial-app page-shell ' + (playerOpen ? 'player-open' : '')}>
      <audio
        ref={audio}
        onLoadedMetadata={() => {
          if (audio.current) audio.current.volume = volume
        }}
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
      <header class="app-header">
        <a class="app-logo" href="/" aria-label={tr('Radio App, portada', 'Radio App, home')}>
          <img src="/favicon.svg" width="32" height="32" alt="" />
          <strong>
            Radio<span>App</span>
          </strong>
        </a>
        <span class="header-caption">{tr('EL MUNDO EN EL DIAL', 'THE WORLD ON YOUR DIAL')}</span>
        <div class="header-actions">
          <button
            class="icon-button"
            aria-label={tr('Buscar emisoras', 'Search stations')}
            onClick={() => navigate(1)}
          >
            <Search size={20} />
          </button>
          <span class="profile-avatar" title={nickname || tr('Invitado', 'Guest')}>
            {(nickname || 'R').slice(0, 1).toUpperCase()}
          </span>
        </div>
      </header>
      <main id="main" class="app-main">
        <div class="side-library">
          <small>{tr('TU ESPACIO', 'YOUR SPACE')}</small>
          <nav aria-label={tr('Secciones', 'Sections')}>{navigation}</nav>
          <div class="sidebar-note">
            <RadioTower size={28} />
            <p>
              {tr('Tu mundo.', 'Your world.')}
              <br />
              <b>{tr('Tu frecuencia.', 'Your frequency.')}</b>
            </p>
            <span>{tr('Radio en vivo, a tu manera.', 'Live radio, your way.')}</span>
          </div>
        </div>
        <div class="browse-content" hidden={playerOpen}>
          <div class="screen-heading">
            <div>
              <p>
                {tr('Hola', 'Hello')}
                {nickname ? `, ${nickname}` : ''} <span class="hello-dot">●</span>
              </p>
              <h1>{view === 0 ? tr('Encontrá tu onda.', 'Find your frequency.') : labels[view]}</h1>
            </div>
            <span class="outline-badge">
              <span />
              {tr('EN VIVO', 'LIVE')}
            </span>
          </div>
          {view === 0 && (
            <>
              <section class="discovery-banner">
                <img src="/media/hero-radio.jpg" alt="" width="1280" height="720" />
                <div class="banner-copy">
                  <small>{tr('DALE PLAY A TU DÍA', 'PRESS PLAY ON YOUR DAY')}</small>
                  <h2>
                    {tr('Todo suena', 'Everything sounds')}
                    <br />
                    <em>
                      {tr('mejor con', 'better with')}
                      <br />
                      {tr('radio.', 'radio.')}
                    </em>
                  </h2>
                  <p>
                    {tr(
                      'Miles de voces. Tu lugar en el mundo.',
                      'Thousands of voices. Your place in the world.'
                    )}
                  </p>
                  <button class="yellow-button" disabled={!rows.length} onClick={surprise}>
                    {tr('Descubrí una emisora', 'Discover a station')}
                    <ArrowUpRight size={18} />
                  </button>
                </div>
                <span class="banner-sticker">
                  <Headphones size={18} />
                  {tr('SINTONIZÁ TU MOMENTO', 'TUNE INTO YOUR MOMENT')}
                </span>
              </section>
              <section class="station-shelf" aria-label={tr('Para descubrir', 'Discover stations')}>
                <div class="section-heading">
                  <h2>{tr('Para descubrir', 'Discover stations')}</h2>
                  <button onClick={() => navigate(1)}>
                    {tr('Ver todas', 'View all')}
                    <ArrowUpRight size={15} />
                  </button>
                </div>
                <div class="station-cards" aria-busy={busy}>
                  {busy
                    ? [0, 1, 2, 3].map((i) => <div class="skeleton-card" key={i} />)
                    : rows.slice(0, 6).map((r, i) => (
                        <button
                          class={'station-card card-variant-' + (i % 3)}
                          key={r.stationuuid}
                          onClick={() => tune(r)}
                        >
                          <span class="card-art">
                            <span class="card-frequency">
                              RADIO / {String(i + 1).padStart(2, '0')}
                            </span>
                            {artwork(r)}
                            <span class="card-play">
                              <Play size={16} fill="currentColor" />
                            </span>
                          </span>
                          <b>{r.name}</b>
                          <small>{r.country}</small>
                        </button>
                      ))}
                </div>
              </section>
              <section class="genre-section">
                <div class="section-heading">
                  <h2>{tr('¿Qué te mueve hoy?', 'What moves you today?')}</h2>
                </div>
                <div class="genre-shelf">
                  {['rock', 'jazz', 'electronic'].map((g, i) => (
                    <button
                      key={g}
                      aria-pressed={genre === g}
                      onClick={() => {
                        setGenre(genre === g ? '' : g)
                        navigate(1)
                      }}
                    >
                      <img
                        src={'/cover-' + g + '.webp'}
                        alt=""
                        loading="lazy"
                        width="480"
                        height="320"
                      />
                      <span>
                        <b>{['Rock', 'Jazz', tr('Electrónica', 'Electronic')][i]}</b>
                        <ArrowUpRight size={18} />
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}
          {view === 1 && (
            <div class="search-box">
              <Search size={21} />
              <input
                type="search"
                aria-label={tr('Nombre de la emisora', 'Station name')}
                placeholder={tr('¿Qué querés escuchar?', 'What would you like to hear?')}
                value={query}
                onInput={(e) => setQuery(e.currentTarget.value)}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  aria-label={tr('Limpiar búsqueda', 'Clear search')}
                >
                  ×
                </button>
              )}
            </div>
          )}
          {view === 2 && (
            <div class="library-banner">
              <Heart size={30} />
              <div>
                <h2>{tr('Siempre a mano.', 'Always within reach.')}</h2>
                <p>
                  {tr(
                    'Las emisoras que elegís, en un solo lugar.',
                    'The stations you love, all in one place.'
                  )}
                </p>
              </div>
              <b>{favorites.value.size}</b>
            </div>
          )}
          <section class="directory">
            <div class="section-heading">
              <h2>
                {view === 2
                  ? tr('Tus emisoras', 'Your stations')
                  : view === 1
                    ? tr('Encontrá tu próxima favorita', 'Find your next favorite')
                    : tr('En el aire ahora', 'On air now')}
              </h2>
              {view === 0 && <span>{countryName}</span>}
            </div>
            {view !== 2 && (
              <div class="station-filters">
                <label>
                  {tr('País', 'Country')}
                  <select value={country} onChange={(e) => setCountry(e.currentTarget.value)}>
                    {bands.map((c) => (
                      <option key={c} value={c}>
                        {new Intl.DisplayNames([english ? 'en' : 'es'], { type: 'region' }).of(c)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {tr('Género', 'Genre')}
                  <select value={genre} onChange={(e) => setGenre(e.currentTarget.value)}>
                    <option value="">{tr('Todos', 'All')}</option>
                    {['rock', 'pop', 'jazz', 'electronic', 'classical'].map((g, i) => (
                      <option key={g} value={g}>
                        {
                          [
                            'Rock',
                            'Pop',
                            'Jazz',
                            tr('Electrónica', 'Electronic'),
                            tr('Clásica', 'Classical'),
                          ][i]
                        }
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            {view === 2 && !profile ? (
              <div class="empty-state">
                <Heart size={32} />
                <h3>{tr('Hacé lugar a tus favoritas.', 'Make room for your favorites.')}</h3>
                <p>
                  {tr(
                    'Elegí un apodo y guardá las radios que te acompañan.',
                    'Choose a nickname and save the stations you love.'
                  )}
                </p>
                <a class="yellow-button" href="/auth/profile">
                  {tr('Crear mi perfil', 'Create my profile')}
                  <ArrowUpRight size={18} />
                </a>
              </div>
            ) : busy ? (
              <div class="loading-state" role="status">
                {tr('Sintonizando emisoras…', 'Tuning into stations…')}
              </div>
            ) : failed ? (
              <div class="empty-state">
                <RadioTower />
                <p>
                  {tr(
                    'No pudimos conectar con el directorio.',
                    'We could not connect to the directory.'
                  )}
                </p>
                <button class="yellow-button" onClick={() => refresh(retry + 1)}>
                  {tr('Reintentar', 'Retry')}
                </button>
              </div>
            ) : !rows.length ? (
              <div class="empty-state">
                <Search />
                <h3>
                  {view === 2
                    ? tr(
                        'Tu colección empieza con un corazón.',
                        'Your collection starts with a heart.'
                      )
                    : tr('Todavía no encontramos esa onda.', 'We could not find that frequency.')}
                </h3>
                <p>
                  {view === 2
                    ? tr('Guardá una emisora desde Explorar.', 'Save a station from Explore.')
                    : tr(
                        'Probá otro nombre, país o género.',
                        'Try another name, country or genre.'
                      )}
                </p>
              </div>
            ) : (
              <div class="station-list">
                {(view === 0 ? rows.slice(0, 5) : rows).map(stationRow)}
              </div>
            )}
            {view === 0 && rows.length > 5 && (
              <button class="browse-all" onClick={() => navigate(1)}>
                {tr('Explorar todas las emisoras', 'Explore all stations')}
                <ArrowUpRight size={17} />
              </button>
            )}
            {profile && favoritesStatus.value.error && (
              <p class="sync-error" role="alert">
                {tr('No se pudieron sincronizar las favoritas.', 'Could not sync favorites.')}{' '}
                <button onClick={() => void syncFavorites()}>{tr('Reintentar', 'Retry')}</button>
              </p>
            )}
          </section>
          {view === 0 && recent.length > 0 && (
            <section class="recent">
              <div class="section-heading">
                <h2>{tr('Volver a escuchar', 'Recently played')}</h2>
              </div>
              <div>
                {recent.map((r) => (
                  <button key={r.stationuuid} onClick={() => tune(r)}>
                    <Disc3 size={18} />
                    {r.name}
                    <ArrowUpRight size={14} />
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
        <section
          class={'console ' + (playing ? 'sounding' : '')}
          aria-label={tr('Reproductor', 'Player')}
        >
          <div class="player-heading">
            <button
              class="icon-button player-back"
              onClick={() => navigate(view)}
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
                    (rows.findIndex((r) => r.stationuuid === featured?.stationuuid) + 1) %
                      rows.length
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
                if (audio.current) audio.current.volume = value
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
      </main>
      <aside class="mobile-navigation">
        <nav aria-label={tr('Navegación móvil', 'Mobile navigation')}>{navigation}</nav>
      </aside>
    </div>
  )
}
