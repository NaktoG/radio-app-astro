import { useState, useRef, useId } from 'preact/hooks'

interface Props {
  content: string
  children: preact.ComponentChild
}

export default function Tooltip({ content, children }: Props) {
  const [visible, setVisible] = useState(false)
  const tooltipId = useId()

  return (
    <span
      class="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <span aria-describedby={visible ? tooltipId : undefined}>{children}</span>
      {visible && (
        <span
          id={tooltipId}
          role="tooltip"
          class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-md bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] whitespace-nowrap pointer-events-none z-[var(--z-dropdown)] animate-fade-in"
        >
          {content}
        </span>
      )}
    </span>
  )
}
