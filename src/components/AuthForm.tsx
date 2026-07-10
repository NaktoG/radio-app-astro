import { useState } from 'preact/hooks'
import { Eye, EyeOff } from 'lucide-preact'
import { login, register } from '../lib/auth'
import { useI18n } from '../i18n/client'
import { Input, Button, ErrorAlert, IconButton } from '../ui'
import type { AuthResponse } from '../lib/types'

interface Props {
  mode: 'login' | 'register'
  onSuccess?: () => void
}

export default function AuthForm({ mode, onSuccess }: Props) {
  const { t } = useI18n()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleSubmit(e: Event) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let res: AuthResponse
      if (mode === 'login') {
        res = await login({ username, password })
      } else {
        res = await register({ username, password, confirmPassword })
      }

      if (res.success) {
        onSuccess?.()
        window.location.href = '/player'
      } else {
        setError(res.message)
      }
    } catch {
      setError(t('AUTH.MESSAGES.GENERIC_ERROR'))
    } finally {
      setLoading(false)
    }
  }

  const isLogin = mode === 'login'
  const prefix = isLogin ? 'AUTH.LOGIN' : 'AUTH.REGISTER'

  return (
    <form onSubmit={handleSubmit} class="w-full max-w-md space-y-5">
      {error && <ErrorAlert message={error} />}

      <Input
        label={t(`${prefix}.USERNAME_LABEL`)}
        type="text"
        value={username}
        onInput={(e) => setUsername((e.target as HTMLInputElement).value)}
        placeholder={t(`${prefix}.USERNAME_PLACEHOLDER`)}
        required
        minLength={3}
        maxLength={20}
        autocomplete="username"
      />

      <div>
        <div class="relative">
          <Input
            label={t(`${prefix}.PASSWORD_LABEL`)}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
            placeholder={t(`${prefix}.PASSWORD_PLACEHOLDER`)}
            required
            minLength={8}
            autocomplete={isLogin ? 'current-password' : 'new-password'}
            class="!pr-12"
          />
          <div class="absolute right-2 bottom-2">
            <IconButton
              icon={showPassword ? EyeOff : Eye}
              label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              onClick={() => setShowPassword(!showPassword)}
              size="sm"
            />
          </div>
        </div>
      </div>

      {!isLogin && (
        <div>
          <div class="relative">
            <Input
              label={t(`${prefix}.CONFIRM_PASSWORD_LABEL`)}
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onInput={(e) => setConfirmPassword((e.target as HTMLInputElement).value)}
              placeholder={t(`${prefix}.PASSWORD_PLACEHOLDER`)}
              required
              minLength={8}
              autocomplete="new-password"
              class="!pr-12"
            />
            <div class="absolute right-2 bottom-2">
              <IconButton
                icon={showConfirm ? EyeOff : Eye}
                label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                onClick={() => setShowConfirm(!showConfirm)}
                size="sm"
              />
            </div>
          </div>
        </div>
      )}

      <Button type="submit" loading={loading} fullWidth>
        {loading ? t(`${prefix}.SUBMIT_LOADING`) : t(`${prefix}.SUBMIT`)}
      </Button>

      <p class="text-sm text-center text-[var(--color-text-muted)]">
        {isLogin ? t(`${prefix}.NO_ACCOUNT`) : t(`${prefix}.HAVE_ACCOUNT`)}{' '}
        <a
          href={isLogin ? '/auth/register' : '/auth/login'}
          class="text-[var(--color-accent-hover)] hover:text-[var(--color-accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded px-1"
        >
          {isLogin ? t(`${prefix}.REGISTER_LINK`) : t(`${prefix}.LOGIN_LINK`)}
        </a>
      </p>
    </form>
  )
}
