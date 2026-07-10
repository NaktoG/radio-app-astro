import { useState, useEffect } from 'preact/hooks'
import { Radio, Menu, X, Globe, LogOut, Home as HomeIcon, Search, Music, Heart } from 'lucide-preact'
import { useAuth, logout as doLogout, initAuth } from '../lib/auth'
import { useI18n, setLang } from '../i18n/client'
import { IconButton } from '../ui'

interface Props {
  lang: string
}

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

  function handleLogout() {
    doLogout()
    window.location.href = '/'
  }

  return (
    <nav
      class="fixed top-0 left-0 right-0 z-[var(--z-fixed)] backdrop-blur-xl bg-[var(--color-bg-glass)] border-b border-[var(--color-border)] nav-safe-top"
      aria-label={t('NAV.APP_NAME')}
    >
      <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <a
          href="/"
          class="flex items-center gap-2 text-xl font-bold hover:text-[var(--color-accent-hover)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded-lg px-1"
        >
          <Radio size={24} class="text-[var(--color-accent)]" aria-hidden="true" />
          <span>{t('NAV.APP_NAME')}</span>
        </a>

        <div class="hidden md:flex items-center gap-2">
          <a
            href="/"
            class="btn-ghost text-sm"
          >
            <HomeIcon size={16} aria-hidden="true" />
            {t('NAV.HOME')}
          </a>
          <a href="/player" class="btn-ghost text-sm">
            <Music size={16} aria-hidden="true" />
            {t('NAV.PLAYER')}
          </a>
          <a href="/search" class="btn-ghost text-sm">
            <Search size={16} aria-hidden="true" />
            {t('NAV.SEARCH')}
          </a>
          {isAuthenticated.value && (
            <a href="/favorites" class="btn-ghost text-sm">
              <Heart size={16} aria-hidden="true" />
              {t('NAV.FAVORITES')}
            </a>
          )}

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
            icon={Globe}
            label={lang.value === 'es' ? 'Switch to English' : 'Cambiar a Español'}
            onClick={handleLangChange}
            size="sm"
          />
        </div>

        <div class="md:hidden flex items-center gap-2">
          <IconButton
            icon={Globe}
            label={lang.value === 'es' ? 'Switch to English' : 'Cambiar a Español'}
            onClick={handleLangChange}
            size="sm"
          />
          <IconButton
            icon={menuOpen ? X : Menu}
            label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMenuOpen(!menuOpen)}
            pressed={menuOpen}
            size="sm"
          />
        </div>
      </div>

      {menuOpen && (
        <div
          class="md:hidden fixed inset-0 top-16 z-[var(--z-modal)] bg-[var(--color-bg-surface)] animate-slide-down overflow-y-auto"
          role="menu"
        >
          <div class="flex flex-col p-4 gap-2 mobile-menu-safe">
            <a href="/" class="btn-ghost justify-start" onClick={() => setMenuOpen(false)} role="menuitem">
              <HomeIcon size={18} aria-hidden="true" />
              {t('NAV.HOME')}
            </a>
            <a href="/player" class="btn-ghost justify-start" onClick={() => setMenuOpen(false)} role="menuitem">
              <Music size={18} aria-hidden="true" />
              {t('NAV.PLAYER')}
            </a>
            <a href="/search" class="btn-ghost justify-start" onClick={() => setMenuOpen(false)} role="menuitem">
              <Search size={18} aria-hidden="true" />
              {t('NAV.SEARCH')}
            </a>
            {isAuthenticated.value && (
              <a href="/favorites" class="btn-ghost justify-start" onClick={() => setMenuOpen(false)} role="menuitem">
                <Heart size={18} aria-hidden="true" />
                {t('NAV.FAVORITES')}
              </a>
            )}
            {isAuthenticated.value ? (
              <button
                onClick={() => { handleLogout(); setMenuOpen(false) }}
                class="btn-ghost justify-start text-[var(--color-danger)]"
                role="menuitem"
              >
                <LogOut size={18} aria-hidden="true" />
                {t('NAV.LOGOUT')}
              </button>
            ) : (
              <>
                <a href="/auth/login" class="btn-ghost justify-start" onClick={() => setMenuOpen(false)} role="menuitem">
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
      )}
    </nav>
  )
}
