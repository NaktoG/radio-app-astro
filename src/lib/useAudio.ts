import { useRef, useCallback, useEffect } from 'preact/hooks'
import type { Radio } from './types'
import {
  setPlaying,
  setLoading,
  setError,
} from '../stores/player'

export interface AudioControls {
  load: (station: Radio | null) => void
  togglePlay: () => void
  audioRef: { current: HTMLAudioElement | null }
}

export function useAudio(): AudioControls {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const retryRef = useRef(0)
  const urlRef = useRef<string>('')
  const cancelledRef = useRef(false)

  useEffect(() => {
    return () => {
      cancelledRef.current = true
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current = null
      }
    }
  }, [])

  const load = useCallback((station: Radio | null) => {
    cancelledRef.current = false

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }

    if (!station) return

    const url = station.url_resolved || station.url
    if (!url) {
      setError(true)
      setLoading(false)
      return
    }

    urlRef.current = url
    retryRef.current = 0
    setError(false)
    setLoading(true)
    setPlaying(false)

    const audio = new Audio(url)
    audio.preload = 'none'

    const loadingTimeout = setTimeout(() => {
      if (cancelledRef.current) return
      setLoading(false)
    }, 10000)

    audio.onerror = () => {
      if (cancelledRef.current) return
      clearTimeout(loadingTimeout)
      retryRef.current++
      if (retryRef.current >= 3) {
        setLoading(false)
        setError(true)
        return
      }
      setTimeout(() => {
        if (cancelledRef.current) return
        audio.src = urlRef.current
        audio.load()
        audio.play().catch(() => {})
      }, 1000 * retryRef.current)
    }

    audio.oncanplay = () => {
      if (cancelledRef.current) return
      clearTimeout(loadingTimeout)
      setLoading(false)
      setError(false)
      retryRef.current = 0
    }

    audio.onplay = () => {
      if (cancelledRef.current) return
      clearTimeout(loadingTimeout)
      setPlaying(true)
      setLoading(false)
      setError(false)
    }

    audio.load()
    audio.play().then(() => {
      if (cancelledRef.current) return
      clearTimeout(loadingTimeout)
      setPlaying(true)
      setLoading(false)
    }).catch(() => {
      if (cancelledRef.current) return
      clearTimeout(loadingTimeout)
      setPlaying(false)
      setLoading(false)
    })

    audioRef.current = audio
  }, [])

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return
    if (audioRef.current.paused) {
      audioRef.current.play().then(() => {
        setPlaying(true)
      }).catch(() => {})
    } else {
      audioRef.current.pause()
      setPlaying(false)
    }
  }, [])

  return { load, togglePlay, audioRef }
}
