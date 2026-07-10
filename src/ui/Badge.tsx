interface Props {
  variant?: 'default' | 'accent' | 'danger' | 'success'
  children: preact.ComponentChild
}

const variantClass = {
  default: 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]',
  accent: 'bg-[var(--color-accent-soft)] text-[var(--color-accent-hover)]',
  danger: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
  success: 'bg-[var(--color-success-soft)] text-[var(--color-success)]',
}

export default function Badge({ variant = 'default', children }: Props) {
  return (
    <span
      class={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClass[variant]}`}
    >
      {children}
    </span>
  )
}
