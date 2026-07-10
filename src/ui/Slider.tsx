import type { JSX } from 'preact'

interface Props extends Omit<JSX.HTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string
  min?: number
  max?: number
  step?: number
  value: number
  onChange?: (value: number) => void
}

export default function Slider({ label, min = 0, max = 1, step = 0.05, value, onChange, id, ...rest }: Props) {
  const sliderId = id || `slider-${label.toLowerCase().replace(/\s+/g, '-')}`
  const percent = ((value - min) / (max - min)) * 100

  return (
    <div class="flex items-center gap-2 flex-1">
      <input
        type="range"
        id={sliderId}
        min={min}
        max={max}
        step={step}
        value={value}
        onInput={(e) => onChange?.(Number((e.target as HTMLInputElement).value))}
        class="flex-1 h-1.5 cursor-pointer appearance-none rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        style={`background: linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${percent}%, var(--color-border) ${percent}%, var(--color-border) 100%)`}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        {...rest}
      />
    </div>
  )
}
