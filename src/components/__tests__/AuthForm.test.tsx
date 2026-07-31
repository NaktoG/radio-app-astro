import { fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AuthForm from '../AuthForm'
import { createAnonymousProfile } from '../../lib/auth'
import en from '../../i18n/en.json'

vi.mock('../../lib/auth', () => ({
  createAnonymousProfile: vi.fn(async () => ({ success: true, message: 'ok' })),
}))

describe('anonymous profile setup form', () => {
  beforeEach(() => vi.clearAllMocks())

  it('requires the anonymous risk modal before creating a nickname profile', async () => {
    render(<AuthForm mode="register" copy={en.AUTH.PROFILE} onSuccess={vi.fn()} />)

    fireEvent.input(screen.getByLabelText(en.AUTH.PROFILE.NICKNAME_LABEL), {
      target: { value: 'Radio Fan' },
    })
    fireEvent.click(screen.getByRole('button', { name: en.AUTH.PROFILE.SUBMIT }))

    expect(createAnonymousProfile).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog').textContent).toContain(en.AUTH.PROFILE.RISK_TITLE)

    fireEvent.click(screen.getByRole('button', { name: en.AUTH.PROFILE.RISK_ACCEPT }))

    await waitFor(() => {
      expect(createAnonymousProfile).toHaveBeenCalledWith({
        nickname: 'Radio Fan',
        acceptedAnonymousRisk: true,
      })
    })
  })

  it('rejects modal bypass attempts and keeps the error accessible', async () => {
    render(<AuthForm mode="register" copy={en.AUTH.PROFILE} />)

    fireEvent.click(screen.getByRole('button', { name: en.AUTH.PROFILE.SUBMIT }))

    expect(screen.getByRole('alert').textContent).toContain(en.AUTH.PROFILE.NICKNAME_REQUIRED)
    expect(createAnonymousProfile).not.toHaveBeenCalled()
  })

  it('shows nickname availability conflicts without storing nickname locally', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    vi.mocked(createAnonymousProfile).mockResolvedValueOnce({
      success: false,
      message: en.AUTH.PROFILE.NICKNAME_TAKEN,
    })
    render(<AuthForm mode="register" copy={en.AUTH.PROFILE} onSuccess={vi.fn()} />)

    fireEvent.input(screen.getByLabelText(en.AUTH.PROFILE.NICKNAME_LABEL), {
      target: { value: 'Taken Handle' },
    })
    fireEvent.click(screen.getByRole('button', { name: en.AUTH.PROFILE.SUBMIT }))
    fireEvent.click(screen.getByRole('button', { name: en.AUTH.PROFILE.RISK_ACCEPT }))

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain(en.AUTH.PROFILE.NICKNAME_TAKEN)
    })
    expect(setItemSpy).not.toHaveBeenCalled()
  })
})
