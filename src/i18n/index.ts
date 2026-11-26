import es from './es.json'
import en from './en.json'

export type Lang = 'es' | 'en'

const dicts: Record<Lang, typeof es> = { es, en }

export function t(key: string, lang: Lang): string {
  const keys = key.split('.')
  let value: unknown = dicts[lang]
  for (const k of keys) {
    if (!value || typeof value !== 'object') return key
    value = (value as Record<string, unknown>)[k]
  }
  return typeof value === 'string' ? value : key
}

export function loadDict(lang: Lang) {
  return dicts[lang]
}
