import { AlertTriangle } from 'lucide-preact'

interface Props {
  message: string
  action?: preact.ComponentChild
}

export default function ErrorAlert({ message, action }: Props) {
  return (
    <div
      class="flex items-center gap-3 rounded-lg bg-[var(--color-danger-soft)] border border-[color-mix(in_oklab,var(--color-danger)_30%,transparent)] px-4 py-3 text-sm text-[color-mix(in_oklab,var(--color-danger)_80%,white)]"
      role="alert"
    >
      <AlertTriangle size={18} class="flex-shrink-0" aria-hidden="true" />
      <span class="flex-1">{message}</span>
      {action && <div class="flex-shrink-0">{action}</div>}
    </div>
  )
}
