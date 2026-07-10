interface Props {
  variant?: 'glass' | 'elevated' | 'flat'
  hover?: boolean
  class?: string
  children: preact.ComponentChildren
}

const variantClass = {
  glass: 'card',
  elevated:
    'bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl p-6',
  flat: 'bg-[var(--color-bg-surface)] rounded-xl p-6',
}

export default function Card({ variant = 'glass', hover = true, class: className, children }: Props) {
  const base = variantClass[variant]
  const hoverClass = hover && variant === 'glass' ? '' : ''
  return <div class={`${base} ${hoverClass} ${className || ''}`}>{children}</div>
}
