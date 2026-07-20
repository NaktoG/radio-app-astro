import type { JSX } from 'preact'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface Props extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

const variantClass: Record<Variant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger:
    'inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-danger)] text-white font-semibold rounded-lg transition-all hover:opacity-90 active:scale-95 min-h-11',
}

const sizeClass: Record<Size, string> = {
  sm: '!px-3 !py-1.5 text-sm',
  md: '',
  lg: '!px-8 !py-4 text-lg',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  children,
  class: className,
  ...rest
}: Props) {
  return (
    <button
      class={`${variantClass[variant]} ${sizeClass[size]} ${fullWidth ? 'w-full' : ''} ${
        className || ''
      } focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && (
        <span
          class="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  )
}
