import { useState } from 'preact/hooks'
import { createAnonymousProfile } from '../lib/auth'

interface ProfileCopy {
  TITLE: string
  SUBTITLE: string
  NICKNAME_LABEL: string
  NICKNAME_PLACEHOLDER: string
  SUBMIT: string
  SUBMIT_LOADING: string
  NICKNAME_REQUIRED: string
  NICKNAME_TAKEN: string
  CREATE_ERROR: string
  RISK_TITLE: string
  RISK_BODY: string
  RISK_RECOVERY: string
  RISK_ACCEPT: string
  RISK_CANCEL: string
}

interface Props {
  mode: 'login' | 'register'
  onSuccess?: () => void
  copy: ProfileCopy
}

export default function AuthForm({ mode, onSuccess, copy }: Props) {
  void mode
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [showRisk, setShowRisk] = useState(false)
  const [loading, setLoading] = useState(false)

  function requestRiskAcceptance(event: Event) {
    event.preventDefault()
    if (!nickname.trim()) {
      setError(copy.NICKNAME_REQUIRED)
      return
    }
    setError('')
    setShowRisk(true)
  }

  async function acceptRisk() {
    setLoading(true)
    setError('')
    const response = await createAnonymousProfile({
      nickname: nickname.trim(),
      acceptedAnonymousRisk: true,
    }).catch(() => ({ success:false, message:copy.CREATE_ERROR }))
    setLoading(false)

    if (!response.success) {
      setShowRisk(false)
      setError(response.message || copy.CREATE_ERROR)
      return
    }

    if (onSuccess) {
      onSuccess()
      return
    }
    if (typeof window !== 'undefined') {
      // A hash-only navigation keeps the guest HTML and modal on screen.
      window.history.replaceState(null, '', '/#main')
      window.location.reload()
    }
  }

  return (
    <div class="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-lg">
      <form onSubmit={requestRiskAcceptance} class="space-y-5" aria-busy={loading}>
        <div class="text-center">
          <h2 class="text-xl font-semibold text-[var(--color-text)]">{copy.TITLE}</h2>
          <p class="mt-3 text-sm text-[var(--color-text-muted)]">{copy.SUBTITLE}</p>
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium text-[var(--color-text)]" for="nickname">
            {copy.NICKNAME_LABEL}
          </label>
          <input
            id="nickname"
            name="nickname"
            type="text"
            autocomplete="nickname"
            maxLength={40}
            value={nickname}
            onInput={(event) => setNickname((event.currentTarget as HTMLInputElement).value)}
            placeholder={copy.NICKNAME_PLACEHOLDER}
            class="input-field"
            aria-describedby={error ? 'profile-error' : undefined}
          />
        </div>

        {error && (
          <p id="profile-error" role="alert" class="text-sm text-[var(--color-danger)]">
            {error}
          </p>
        )}

        <button type="submit" class="btn-primary w-full" disabled={loading}>
          {loading ? copy.SUBMIT_LOADING : copy.SUBMIT}
        </button>
      </form>

      {showRisk && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="anonymous-risk-title"
          class="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/70 px-4"
        >
          <div class="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl">
            <h3 id="anonymous-risk-title" class="text-lg font-semibold text-[var(--color-text)]">
              {copy.RISK_TITLE}
            </h3>
            <p class="mt-3 text-sm text-[var(--color-text-muted)]">{copy.RISK_BODY}</p>
            <p class="mt-3 text-sm font-medium text-[var(--color-warning)]">{copy.RISK_RECOVERY}</p>
            <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                class="btn-ghost"
                onClick={() => setShowRisk(false)}
                disabled={loading}
              >
                {copy.RISK_CANCEL}
              </button>
              <button type="button" class="btn-primary" onClick={acceptRisk} disabled={loading}>
                {loading ? copy.SUBMIT_LOADING : copy.RISK_ACCEPT}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
