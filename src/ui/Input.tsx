import type { JSX } from 'preact'

interface Props extends JSX.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export default function Input({ label, error, hint, id, class: className, ...rest }: Props) {
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`

  return (
    <div class={`w-full ${className || ''}`}>
      <label for={inputId} class="block text-sm font-medium mb-1.5 text-[var(--color-text-secondary)]">
        {label}
      </label>
      <input
        id={inputId}
        class="input-field"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        {...rest}
      />
      {hint && !error && (
        <p id={hintId} class="mt-1.5 text-xs text-[var(--color-text-muted)]">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} class="mt-1.5 text-xs text-[var(--color-danger)]" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
