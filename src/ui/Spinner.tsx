interface Props {
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

const sizeMap = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-[3px]',
}

export default function Spinner({ size = 'md', label }: Props) {
  return (
    <span
      class={`inline-block ${sizeMap[size]} border-[var(--color-accent)] border-t-transparent rounded-full animate-spin`}
      role="status"
      aria-label={label || 'Loading'}
    >
      <span class="sr-only">{label || 'Loading'}</span>
    </span>
  )
}
