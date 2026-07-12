import { usePlayerStore } from '../stores/player'

export default function WaveBackground() {
  const { isPlaying } = usePlayerStore()

  return (
    <div class="wave-bg" aria-hidden="true">
      <div class={`wave-layer ${isPlaying.value ? '' : 'paused'}`}>
        <svg viewBox="0 0 1440 900" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 600 C 240 500, 480 700, 720 550 C 960 400, 1200 650, 1440 500 L 1440 900 L 0 900 Z"
            fill="url(#wave-grad-1)"
            opacity="0.15"
          />
        </svg>
      </div>
      <div class={`wave-layer ${isPlaying.value ? '' : 'paused'}`}>
        <svg viewBox="0 0 1440 900" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 650 C 280 450, 560 750, 840 550 C 1120 350, 1320 700, 1440 500 L 1440 900 L 0 900 Z"
            fill="url(#wave-grad-2)"
            opacity="0.12"
          />
        </svg>
      </div>
      <div class={`wave-layer ${isPlaying.value ? '' : 'paused'}`}>
        <svg viewBox="0 0 1440 900" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 500 C 200 650, 400 450, 600 600 C 800 750, 1000 400, 1200 550 C 1320 650, 1400 450, 1440 550 L 1440 900 L 0 900 Z"
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
