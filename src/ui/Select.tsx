import type { JSX } from 'preact'

interface Option {
  value: string
  label: string
}

interface Props extends Omit<JSX.HTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label: string
  options: Option[]
  value: string
  onChange?: (value: string) => void
}

export default function Select({ label, options, value, onChange, id, class: className, ...rest }: Props) {
  const selectId = id || `select-${label.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div class={`w-full ${className || ''}`}>
      <label for={selectId} class="block text-sm font-medium mb-1.5 text-[var(--color-text-secondary)]">
        {label}
      </label>
      <select
        id={selectId}
        class="input-field cursor-pointer"
        value={value}
        onChange={(e) => onChange?.((e.target as HTMLSelectElement).value)}
        {...rest}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} class="bg-[var(--color-bg-base)] text-[var(--color-text-primary)]">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
