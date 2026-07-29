import { usePlayerStore } from '../stores/player'

export default function WaveBackground() {
  const { isPlaying } = usePlayerStore()

  return (
    <div class="wave-bg" aria-hidden="true">
      <div class={`wave-layer ${isPlaying.value ? '' : 'paused'}`}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 66 C 17 56, 33 78, 50 61 C 67 44, 83 72, 100 56 L 100 100 L 0 100 Z"
            fill="url(#wave-grad-1)"
            opacity="0.15"
          />
        </svg>
      </div>
      <div class={`wave-layer ${isPlaying.value ? '' : 'paused'}`}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 72 C 19 50, 39 83, 58 61 C 78 39, 92 78, 100 56 L 100 100 L 0 100 Z"
            fill="url(#wave-grad-2)"
            opacity="0.12"
          />
        </svg>
      </div>
      <div class={`wave-layer ${isPlaying.value ? '' : 'paused'}`}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 56 C 14 72, 28 50, 42 67 C 56 83, 69 44, 83 61 C 92 72, 97 50, 100 61 L 100 100 L 0 100 Z"
            fill="url(#wave-grad-3)"
            opacity="0.08"
          />
        </svg>
      </div>
      <svg aria-hidden="true" style="position:absolute;width:0;height:0">
        <defs>
          <linearGradient id="wave-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="var(--color-accent)" />
            <stop offset="50%" stop-color="var(--color-pink)" />
            <stop offset="100%" stop-color="var(--color-accent)" />
          </linearGradient>
          <linearGradient id="wave-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#7dcfff" />
            <stop offset="50%" stop-color="#7aa2f7" />
            <stop offset="100%" stop-color="#89b4fa" />
          </linearGradient>
          <linearGradient id="wave-grad-3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="var(--color-pink)" />
            <stop offset="50%" stop-color="var(--color-accent)" />
            <stop offset="100%" stop-color="var(--color-pink)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}
