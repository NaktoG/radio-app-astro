import { signal } from '@preact/signals'
import type { Lang } from './index'

const STORAGE_KEY = 'radio_app_language'
const COOKIE_KEY = 'radio_lang'

type Vars = Record<string, string | number>

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`))
  return match ? decodeURIComponent(match[2]) : null
}

const initial = (getCookie(COOKIE_KEY) ||
  (typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null) ||
  'es') as Lang

const langSignal = signal<Lang>(initial)

export function getLang() {
  return langSignal.value
}

export function setLang(lang: Lang) {
  langSignal.value = lang
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, lang)
  }
  if (typeof document !== 'undefined') {
    document.cookie = `${COOKIE_KEY}=${lang};path=/;max-age=31536000`
  }
}

import es from './es.json'
import en from './en.json'

const dicts: Record<Lang, Record<string, unknown>> = { es, en }

function resolveKey(key: string, dict: Record<string, unknown>): unknown {
  const keys = key.split('.')
  let value: unknown = dict
  for (const k of keys) {
    if (!value || typeof value !== 'object') return undefined
    value = (value as Record<string, unknown>)[k]
  }
  return value
}

function interpolate(str: string, vars: Vars): string {
  return str.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? `{${name}}`))
}

export function useI18n() {
  function t(key: string, vars?: Vars): string {
    const dict = dicts[langSignal.value]
    const value = resolveKey(key, dict)
    if (typeof value === 'string') {
      return vars ? interpolate(value, vars) : value
    }
    return key
  }

  return {
    t,
    lang: langSignal,
    setLang,
    toggleLang: () => setLang(langSignal.value === 'es' ? 'en' : 'es'),
  }
}
