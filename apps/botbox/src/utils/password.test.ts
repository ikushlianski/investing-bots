import { describe, expect, it, vi } from 'vitest'

import { hashPassword, verifyPassword } from './password'

describe('password utils', () => {
  it('hashes password using bcrypt rounds configuration', async () => {
    const password = 'StrongPassw0rd!'

    const hashed = await hashPassword(password)

    expect(hashed).toMatch(/^\$2[aby]\$/)
  })

  it('verifies correct password successfully', async () => {
    const password = 'StrongPassw0rd!'
    const hashed = await hashPassword(password)

    const result = await verifyPassword(password, hashed)

    expect(result).toBe(true)
  })

  it('fails verification for incorrect password', async () => {
    const password = 'StrongPassw0rd!'
    const hashed = await hashPassword(password)

    const result = await verifyPassword('WrongPassword!', hashed)

    expect(result).toBe(false)
  })

  it('delegates to bcrypt implementation', async () => {
    const bcryptModule = await import('bcryptjs')
    const hashSpy = vi.spyOn(bcryptModule, 'hash')
    const compareSpy = vi.spyOn(bcryptModule, 'compare')

    const password = 'StrongPassw0rd!'

    const hashed = await hashPassword(password)

    await verifyPassword(password, hashed)

    expect(hashSpy).toHaveBeenCalled()
    expect(compareSpy).toHaveBeenCalled()

    hashSpy.mockRestore()

    compareSpy.mockRestore()
  })
})
