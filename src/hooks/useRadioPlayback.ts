import { useEffect, useRef, useState } from 'preact/hooks'
import type { Radio } from '../lib/types'

export type PlaybackStatus = 'idle' | 'waiting' | 'playing' | 'paused' | 'error'
/** The sole owner of the audio element and playback lifecycle. */
export function useRadioPlayback() {
  const audio = useRef<HTMLAudioElement>(null)
  const selected = useRef<Radio | null>(null)
  const attempt = useRef(0)
  const [station, select] = useState<Radio | null>(null)
  const [status, setStatus] = useState<PlaybackStatus>('idle')
  const [volume, updateVolume] = useState(0.7)
  const [recent, setRecent] = useState<Radio[]>([])
  useEffect(
    () => () => {
      attempt.current += 1
      audio.current?.pause()
    },
    []
  )
  // A silent or stalled endpoint must not leave the controls connecting forever.
  useEffect(() => {
    if (status !== 'waiting') return
    const timer = setTimeout(() => {
      attempt.current += 1
      audio.current?.pause()
      setStatus('error')
    }, 15_000)
    return () => clearTimeout(timer)
  }, [status, station])
  function setVolume(value: number) {
    const normalized = Math.max(0, Math.min(1, value))
    updateVolume(normalized)
    if (audio.current) audio.current.volume = normalized
  }
  function play(next: Radio, restart = false) {
    const element = audio.current
    if (!element) return
    const token = ++attempt.current
    if (!restart && selected.current?.stationuuid === next.stationuuid && !element.paused) {
      element.pause()
      return
    }
    if (selected.current?.stationuuid !== next.stationuuid || element.error)
      element.src = next.url_resolved || next.url
    selected.current = next
    select(next)
    element.volume = volume
    setStatus('waiting')
    void element.play().catch((error: unknown) => {
      if (token !== attempt.current) return
      if (!(error instanceof Error) || error.name !== 'AbortError') setStatus('error')
    })
  }
  const audioEvents = {
    onPlaying() {
      setStatus('playing')
      const current = selected.current
      if (current)
        setRecent((previous) =>
          [current, ...previous.filter((r) => r.stationuuid !== current.stationuuid)].slice(0, 6)
        )
    },
    onWaiting: () => setStatus('waiting'),
    onPause: () => setStatus((current) => (current === 'error' ? 'error' : 'paused')),
    onError: () => setStatus('error'),
    onEnded: () => setStatus('paused'),
  }
  return { audio, audioEvents, station, status, recent, volume, setVolume, play }
}
