import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const credentialUiPattern = /AuthForm|type=["']password["']|<form\b|username|PASSWORD_LABEL/
const authFormCredentialPattern = /type=["']password["']|username|PASSWORD_LABEL/

describe('legacy credential pages', () => {
  it('does not render credential-shaped UI from /auth/login or /auth/register', async () => {
    const [login, register] = await Promise.all([
      readFile('src/pages/auth/login.astro', 'utf8'),
      readFile('src/pages/auth/register.astro', 'utf8'),
    ])

    expect(login).not.toMatch(credentialUiPattern)
    expect(register).not.toMatch(credentialUiPattern)
  })

  it('keeps the legacy AuthForm component free of password credential controls', async () => {
    const authForm = await readFile('src/components/AuthForm.tsx', 'utf8')

    expect(authForm).not.toMatch(authFormCredentialPattern)
  })

  it('renders profile setup on /auth/profile and routes legacy auth pages to that flow', async () => {
    const [profile, login, register] = await Promise.all([
      readFile('src/pages/auth/profile.astro', 'utf8'),
      readFile('src/pages/auth/login.astro', 'utf8'),
      readFile('src/pages/auth/register.astro', 'utf8'),
    ])

    expect(profile).toMatch(
      /<AuthForm mode="register" copy=\{dict\.AUTH\.PROFILE\} client:load \/>/
    )
    expect(login).toContain('href="/auth/profile"')
    expect(register).toContain('href="/auth/profile"')
  })
})
