import { useState } from 'preact/hooks'
import type { Radio } from '../lib/types'

export default function StationArtwork({ radio }: { radio: Radio }) {
  const [failed, setFailed] = useState(false)
  const src = /^https:\/\//i.test(radio.favicon) ? radio.favicon : ''
  const initials = radio.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
  return (
    <span class={'station-logo ' + (!src || failed ? 'station-initials' : '')}>
      {src && !failed ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <b>{initials || 'FM'}</b>
      )}
    </span>
  )
}
