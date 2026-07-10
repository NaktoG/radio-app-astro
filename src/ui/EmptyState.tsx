import type { LucideIcon } from 'lucide-preact'

interface Props {
  icon: LucideIcon
  title: string
  description: string
  action?: preact.ComponentChildren
}

export default function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div class="text-center py-12 px-4" role="status">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--color-accent-soft)] mb-4">
        <Icon size={32} class="text-[var(--color-accent)]" aria-hidden="true" />
      </div>
      <p class="text-lg font-semibold text-[var(--color-text-primary)] mb-1">{title}</p>
      <p class="text-sm text-[var(--color-text-muted)] max-w-sm mx-auto">{description}</p>
      {action && <div class="mt-4">{action}</div>}
    </div>
  )
}
