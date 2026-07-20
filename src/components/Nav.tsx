import { useState, useEffect } from 'preact/hooks'
import { RadioTower, Menu, X, Languages, LogOut, House, SearchCheck, Headphones, HeartPulse, Github } from 'lucide-preact'
import { useAuth, logout as doLogout, initAuth } from '../lib/auth'
import { useI18n, setLang } from '../i18n/client'
import { IconButton } from '../ui'

interface Props {
  lang: string
}

const GITHUB_URL = 'https://github.com/NaktoG/radio-app-astro'

export default function Nav({ lang: initialLang }: Props) {
  const { isAuthenticated, currentUser } = useAuth()
  const { t, lang } = useI18n()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    initAuth()
    if (initialLang && initialLang !== lang.value) {
      setLang(initialLang as 'es' | 'en')
    }
  }, [])

  function handleLangChange() {
    const newLang = lang.value === 'es' ? 'en' : 'es'
    setLang(newLang)
    document.cookie = `radio_lang=${newLang};path=/;max-age=31536000`
    window.location.reload()
  }

  async function handleLogout() {
    await doLogout()
    window.location.href = '/'
  }

  return (
    <>
    <nav
      class="fixed top-0 left-0 right-0 z-[var(--z-fixed)] w-full max-w-full backdrop-blur-xl bg-[var(--color-bg-glass)] border-b border-[var(--color-border)] nav-safe-top"
      aria-label={t('NAV.APP_NAME')}
    >
      <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between min-w-0">
        <a
          href="/"
          class="flex min-w-0 items-center gap-2 text-xl font-bold hover:text-[var(--color-accent-hover)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded-lg px-1"
        >
          <RadioTower size={24} class="text-[var(--color-accent-hover)] drop-shadow-[0_0_10px_color-mix(in_oklab,var(--color-accent)_50%,transparent)]" aria-hidden="true" />
          <span class="truncate">{t('NAV.APP_NAME')}</span>
        </a>

        <div class="hidden md:flex items-center gap-2">
          <a
            href="/"
            class="btn-ghost text-sm"
          >
            <House size={16} aria-hidden="true" />
            {t('NAV.HOME')}
          </a>
          <a href="/player" class="btn-ghost text-sm">
            <Headphones size={16} aria-hidden="true" />
            {t('NAV.PLAYER')}
          </a>
          <a href="/search" class="btn-ghost text-sm">
            <SearchCheck size={16} aria-hidden="true" />
            {t('NAV.SEARCH')}
          </a>
          {isAuthenticated.value && (
            <a href="/favorites" class="btn-ghost text-sm">
              <HeartPulse size={16} aria-hidden="true" />
              {t('NAV.FAVORITES')}
            </a>
          )}
          <a
            href={GITHUB_URL}
            class="btn-ghost text-sm"
            target="_blank"
            rel="noreferrer"
            aria-label="Ver repositorio en GitHub"
          >
            <Github size={16} aria-hidden="true" />
            GitHub
          </a>

          {isAuthenticated.value ? (
            <div class="flex items-center gap-3 ml-2 bg-[var(--color-accent-soft)] px-3 py-1.5 rounded-lg">
              <span class="text-sm text-[var(--color-accent-hover)] font-medium">
                {t('NAV.HELLO')}, {currentUser.value?.username}
              </span>
              <button
                onClick={handleLogout}
                class="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-danger)] rounded px-1 min-h-11"
                aria-label={t('NAV.LOGOUT')}
              >
                <LogOut size={16} aria-hidden="true" />
                <span class="hidden lg:inline">{t('NAV.LOGOUT')}</span>
              </button>
            </div>
          ) : (
            <>
              <a
                href="/auth/login"
                class="btn-ghost text-sm"
              >
                {t('NAV.LOGIN')}
              </a>
              <a
                href="/auth/register"
                class="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-pink)] text-white text-sm font-semibold rounded-lg hover:shadow-[var(--shadow-glow)] transition-all min-h-11 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              >
                {t('NAV.REGISTER')}
              </a>
            </>
          )}

          <IconButton
            icon={Languages}
            label={lang.value === 'es' ? 'Switch to English' : 'Cambiar a Español'}
            onClick={handleLangChange}
            size="sm"
          />
        </div>

        <div class="md:hidden flex items-center">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            class="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-[color-mix(in_oklab,var(--color-accent)_16%,var(--color-bg-surface))] px-3 py-2 text-sm font-semibold text-[var(--color-text-primary)] shadow-[0_0_20px_color-mix(in_oklab,var(--color-accent)_18%,transparent)] transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-menu"
          >
            {menuOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
            <span>{menuOpen ? 'Cerrar' : 'Menú'}</span>
          </button>
        </div>
      </div>

    </nav>

      {menuOpen && (
        <>
          <button
            class="mobile-nav-backdrop"
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
          />
          <div
            id="mobile-nav-menu"
            class="mobile-nav-drawer animate-slide-down"
            role="menu"
          >
            <div class="flex flex-col p-4 gap-2 mobile-menu-safe">
              <button
                onClick={handleLangChange}
                class="mobile-nav-item"
                role="menuitem"
              >
                <Languages size={18} aria-hidden="true" />
                {lang.value === 'es' ? 'English' : 'Español'}
              </button>
              <a href="/" class="mobile-nav-item" onClick={() => setMenuOpen(false)} role="menuitem">
                <House size={18} aria-hidden="true" />
                {t('NAV.HOME')}
              </a>
              <a href="/player" class="mobile-nav-item" onClick={() => setMenuOpen(false)} role="menuitem">
                <Headphones size={18} aria-hidden="true" />
                {t('NAV.PLAYER')}
              </a>
              <a href="/search" class="mobile-nav-item" onClick={() => setMenuOpen(false)} role="menuitem">
                <SearchCheck size={18} aria-hidden="true" />
                {t('NAV.SEARCH')}
              </a>
              {isAuthenticated.value && (
                <a href="/favorites" class="mobile-nav-item" onClick={() => setMenuOpen(false)} role="menuitem">
                  <HeartPulse size={18} aria-hidden="true" />
                  {t('NAV.FAVORITES')}
                </a>
              )}
              <a href={GITHUB_URL} class="mobile-nav-item" target="_blank" rel="noreferrer" role="menuitem">
                <Github size={18} aria-hidden="true" />
                GitHub
              </a>
              {isAuthenticated.value ? (
                <button
                  onClick={() => { handleLogout(); setMenuOpen(false) }}
                  class="mobile-nav-item text-[var(--color-danger)]"
                  role="menuitem"
                >
                  <LogOut size={18} aria-hidden="true" />
                  {t('NAV.LOGOUT')}
                </button>
              ) : (
                <>
                  <a href="/auth/login" class="mobile-nav-item" onClick={() => setMenuOpen(false)} role="menuitem">
                    {t('NAV.LOGIN')}
                  </a>
                  <a
                    href="/auth/register"
                    class="btn-primary w-full"
                    onClick={() => setMenuOpen(false)}
                    role="menuitem"
                  >
                    {t('NAV.REGISTER')}
                  </a>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
