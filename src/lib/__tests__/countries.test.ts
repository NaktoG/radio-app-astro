import { describe, it, expect } from 'vitest'
import { COUNTRIES, COUNTRY_OPTIONS } from '../countries'

describe('countries', () => {
  it('exports a non-empty array', () => {
    expect(COUNTRIES.length).toBeGreaterThan(0)
  })

  it('includes an empty-code "Todos" option first', () => {
    expect(COUNTRIES[0].code).toBe('')
    expect(COUNTRIES[0].name).toBe('Todos')
  })

  it('each country has code and name', () => {
    for (const c of COUNTRIES) {
      expect(typeof c.code).toBe('string')
      expect(typeof c.name).toBe('string')
      expect(c.name.length).toBeGreaterThan(0)
    }
  })

  it('country codes are unique (except empty)', () => {
    const codes = COUNTRIES.map((c) => c.code).filter((c) => c !== '')
    expect(new Set(codes).size).toBe(codes.length)
  })

  it('COUNTRY_OPTIONS maps to value/label format', () => {
    expect(COUNTRY_OPTIONS[0]).toEqual({ value: '', label: 'Todos' })
    expect(COUNTRY_OPTIONS.length).toBe(COUNTRIES.length)
  })
})
