import { describe, expect, it } from 'vitest'
import en from '../en.json'
import es from '../es.json'

const requiredProfileKeys = [
  'TITLE',
  'SUBTITLE',
  'NICKNAME_LABEL',
  'NICKNAME_PLACEHOLDER',
  'SUBMIT',
  'SUBMIT_LOADING',
  'NICKNAME_REQUIRED',
  'NICKNAME_TAKEN',
  'CREATE_ERROR',
  'RISK_TITLE',
  'RISK_BODY',
  'RISK_RECOVERY',
  'RISK_ACCEPT',
  'RISK_CANCEL',
] as const

describe('localized anonymous profile copy', () => {
  it('provides nickname, risk, error, and recovery messages in each supported locale', () => {
    for (const dict of [en, es]) {
      for (const key of requiredProfileKeys) {
        expect(dict.AUTH.PROFILE[key]).toEqual(expect.any(String))
        expect(dict.AUTH.PROFILE[key].trim().length).toBeGreaterThan(0)
      }

      expect(dict.AUTH.PROFILE.NICKNAME_LABEL).not.toMatch(/password|contraseña/i)
      expect(dict.AUTH.PROFILE.NICKNAME_TAKEN).toMatch(/taken|uso/i)
      expect(dict.AUTH.PROFILE.NICKNAME_TAKEN).not.toMatch(
        /login|sign in|recover|recuper|credencial/i
      )
      expect(dict.AUTH.PROFILE.RISK_RECOVERY).toMatch(/recover|recuper/i)
    }
  })
})
