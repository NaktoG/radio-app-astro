import type { JSX } from 'preact'
import type { LucideIcon } from 'lucide-preact'

interface Props extends JSX.HTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon
  label: string
  size?: 'sm' | 'md' | 'lg'
  pressed?: boolean
}

const sizeMap = {
  sm: 'w-9 h-9',
  md: 'w-11 h-11',
  lg: 'w-12 h-12',
}

const iconSizeMap = {
  sm: 16,
  md: 20,
  lg: 24,
}

export default function IconButton({
  icon: Icon,
  label,
  size = 'md',
  pressed,
  class: className,
  ...rest
}: Props) {
  return (
    <button
      class={`inline-flex items-center justify-center ${sizeMap[size]} rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[color-mix(in_oklab,white_8%,transparent)] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:scale-95 ${
        pressed ? 'text-[var(--color-accent)] bg-[var(--color-accent-soft)]' : ''
      } ${className || ''}`}
      aria-label={label}
      aria-pressed={pressed}
      {...rest}
    >
      <Icon size={iconSizeMap[size]} aria-hidden="true" />
    </button>
  )
}
