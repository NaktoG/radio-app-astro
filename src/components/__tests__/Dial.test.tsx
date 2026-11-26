import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Dial from '../Dial'
import { fetchStations, searchStations } from '../../lib/api'
import type { Radio } from '../../lib/types'

const station = {
  stationuuid: 'radio-1',
  name: 'Radio de prueba',
  country: 'Argentina',
  tags: 'rock',
  favicon: '',
  url: 'https://example.com/live',
  url_resolved: 'https://example.com/live',
} as Radio
vi.mock('../../lib/api', () => ({
  fetchStations: vi.fn(),
  searchStations: vi.fn(),
  fetchStationsByUuids: vi.fn(async () => []),
}))

beforeEach(() => {
  vi.clearAllMocks()
  history.replaceState(null, '', '/player')
  Element.prototype.scrollIntoView = vi.fn()
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  vi.mocked(fetchStations).mockResolvedValue([station])
  vi.mocked(searchStations).mockResolvedValue([station])
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('radio navigation', () => {
  it('keeps the same audio and station when moving between player and discovery', async () => {
    const { container } = render(<Dial english={false} profile={false} />)
    const audio = container.querySelector('audio')!
    fireEvent.click(await screen.findByRole('button', { name: 'Escuchar Radio de prueba' }))
    Object.defineProperty(audio, 'paused', { configurable: true, value: false })
    fireEvent.playing(audio)
    expect(location.search).toBe('?view=listening')
    expect(container.querySelector('.browse-content')?.hasAttribute('hidden')).toBe(true)
    expect(screen.getAllByRole('region', { name: 'Reproductor' })).toHaveLength(1)
    const nav = within(screen.getByRole('navigation', { name: 'Navegación móvil' }))
    fireEvent.click(nav.getByRole('button', { name: 'Explorar' }))
    expect(container.querySelector('audio')).toBe(audio)
    expect(audio.src).toBe(station.url)
    expect(HTMLMediaElement.prototype.pause).not.toHaveBeenCalled()
    fireEvent.click(nav.getByRole('button', { name: 'Escuchar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Pausar radio' }))
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledOnce()
  })
  it('opens genre search and sends the chosen filter to the directory', async () => {
    render(<Dial english={false} profile={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'Jazz' }))
    await waitFor(() => expect(searchStations).toHaveBeenCalledWith('', 'AR', 'jazz'))
    fireEvent.input(screen.getByRole('searchbox'), { target: { value: 'Mitre' } })
    await waitFor(() => expect(searchStations).toHaveBeenCalledWith('Mitre', 'AR', 'jazz'))
    expect(location.search).toBe('?view=search')
  })
})
