import { useState } from 'preact/hooks'

interface Props {
  src: string | undefined
  alt: string
  fallback?: string
  lazy?: boolean
  class?: string
}

export default function Image({ src, alt, fallback = '/favicon.svg', lazy = true, class: className }: Props) {
  const [error, setError] = useState(false)
  const finalSrc = error || !src ? fallback : src

  return (
    <img
      src={finalSrc}
      alt={alt}
      loading={lazy ? 'lazy' : 'eager'}
      class={className}
      onError={() => setError(true)}
    />
  )
}
