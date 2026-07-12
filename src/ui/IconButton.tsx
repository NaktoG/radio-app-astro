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
      class={`inline-flex items-center justify-center ${sizeMap[size]} rounded-xl border border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-accent-hover)] hover:border-[var(--color-border)] hover:bg-[color-mix(in_oklab,var(--color-accent)_12%,transparent)] hover:shadow-[0_0_18px_color-mix(in_oklab,var(--color-accent)_20%,transparent)] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:scale-95 ${
        pressed ? 'text-[var(--color-accent-hover)] border-[var(--color-accent-soft)] bg-[var(--color-accent-soft)] shadow-[0_0_18px_color-mix(in_oklab,var(--color-accent)_22%,transparent)]' : ''
      } ${className || ''}`}
      aria-label={label}
      aria-pressed={pressed}
      {...rest}
    >
      <Icon size={iconSizeMap[size]} aria-hidden="true" />
    </button>
  )
}
