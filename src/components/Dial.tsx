import { useEffect, useState } from 'preact/hooks'
import {
  Play,
  Compass,
  Search,
  Heart,
  Disc3,
  Library,
  RadioTower,
  ArrowUpRight,
  Headphones,
} from 'lucide-preact'
import StationArtwork from './StationArtwork'
import RadioPlayerPanel from './RadioPlayerPanel'
import { useStationDirectory } from '../hooks/useStationDirectory'
import { useRadioPlayback } from '../hooks/useRadioPlayback'
import type { Radio } from '../lib/types'
import { syncFavorites, toggleFavorite, useFavoritesStore } from '../stores/favorites'
import '../styles/dial-yellow.css'

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
  const { audio, audioEvents, station, status, recent, volume, setVolume, play } =
    useRadioPlayback()
  const tr = (es: string, en: string) => (english ? en : es)
  const [view, setView] = useState(0)
  const [playerOpen, setPlayerOpen] = useState(false)
  useEffect(() => {
    const selected = new URLSearchParams(location.search).get('view')
    if (selected === 'favorites') setView(2)
    if (selected === 'search') setView(1)
    if (selected === 'listening') setPlayerOpen(true)
  }, [])
  const [country, setCountry] = useState('AR')
  const [genre, setGenre] = useState('')
  const [query, setQuery] = useState('')
  const { favorites, favoritesStatus } = useFavoritesStore()
  const ids = view === 2 ? [...favorites.value].join(',') : ''
  const { rows, busy, failed, retry } = useStationDirectory(view, country, genre, query, ids)
  useEffect(() => {
    if (profile) void syncFavorites()
  }, [profile])
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
      <audio ref={audio} {...audioEvents} />
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
                <button class="yellow-button" onClick={retry}>
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
        <RadioPlayerPanel
          tr={tr}
          featured={featured}
          station={station}
          rows={rows}
          status={status}
          volume={volume}
          setVolume={setVolume}
          play={play}
          surprise={surprise}
          onBack={() => navigate(view)}
          favorite={favorite}
        />
      </main>
      <aside class="mobile-navigation">
        <nav aria-label={tr('Navegación móvil', 'Mobile navigation')}>{navigation}</nav>
      </aside>
    </div>
  )
}
