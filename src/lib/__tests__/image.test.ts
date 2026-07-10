import { describe, it, expect } from 'vitest'
import { proxyImage } from '../image'

describe('proxyImage', () => {
  it('returns undefined for null/undefined input', () => {
    expect(proxyImage(null)).toBeUndefined()
    expect(proxyImage(undefined)).toBeUndefined()
  })

  it('returns undefined for non-http protocols', () => {
    expect(proxyImage('data:image/png;base64,abc')).toBeUndefined()
    expect(proxyImage('javascript:alert(1)')).toBeUndefined()
    expect(proxyImage('ftp://example.com/img.png')).toBeUndefined()
  })

  it('returns proxied URL for valid https URLs', () => {
    const result = proxyImage('https://example.com/img.png')
    expect(result).toBe('/api/image-proxy?url=' + encodeURIComponent('https://example.com/img.png'))
  })

  it('returns proxied URL for valid http URLs', () => {
    const result = proxyImage('http://example.com/img.png')
    expect(result).toBe('/api/image-proxy?url=' + encodeURIComponent('http://example.com/img.png'))
  })

  it('encodes the URL properly', () => {
    const result = proxyImage('https://example.com/path with spaces/img.png')
    expect(result).toContain('path%20with%20spaces')
  })
})
