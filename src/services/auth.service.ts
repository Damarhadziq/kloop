import type { Session, UserProfile } from '@/types'

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export const SESSION_STORAGE_KEY = 'kloop.session'

export const MOCK_CURRENT_USER: UserProfile = {
  id: 'u-self',
  username: 'kamu',
  fullName: 'Kamu',
  phone: '081234567890',
  avatarUrl: '/assets/99968.svg',
  bankName: 'BCA',
  bankAccountNo: '8420 1928 31',
  qrisUrl: '/assets/1d1c8.svg',
}

export function readStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

export function persistSession(session: Session): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  } catch {
    /* storage unavailable: session lasts for this tab only */
  }
}

export function clearStoredSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export async function login(
  phone: string,
  _password: string,
  delayMs = 900,
): Promise<{ session: Session; user: UserProfile; message: string }> {
  await wait(delayMs)
  const cleanPhone = phone.replace(/\D/g, '')
  const user: UserProfile = {
    ...MOCK_CURRENT_USER,
    phone: cleanPhone,
  }
  const session: Session = {
    name: user.fullName,
    phone: cleanPhone,
    user,
  }
  return {
    session,
    user,
    message: 'Berhasil masuk. Selamat datang kembali!',
  }
}

export async function registerUser(
  name: string,
  phone: string,
  _password: string,
  delayMs = 900,
): Promise<{ pendingSession: Session; message: string }> {
  await wait(delayMs)
  const cleanPhone = phone.replace(/\D/g, '')
  const cleanName = name.trim()
  const user: UserProfile = {
    ...MOCK_CURRENT_USER,
    username: cleanName.toLowerCase().replace(/\s+/g, '_'),
    fullName: cleanName,
    phone: cleanPhone,
  }
  return {
    pendingSession: {
      name: cleanName,
      phone: cleanPhone,
      user,
    },
    message: 'Kode verifikasi terkirim ke WhatsApp',
  }
}

export async function verifyOtp(
  code: string,
  pendingSession?: Session | null,
  delayMs = 900,
): Promise<{ verified: boolean; session: Session; user: UserProfile; message: string }> {
  await wait(delayMs)
  const verified = code.replace(/\D/g, '').length === 6
  const baseName = pendingSession?.name || MOCK_CURRENT_USER.fullName
  const basePhone = pendingSession?.phone || ''
  const user: UserProfile = {
    ...MOCK_CURRENT_USER,
    username: baseName.toLowerCase().replace(/\s+/g, '_'),
    fullName: baseName,
    phone: basePhone,
  }
  const session: Session = {
    name: baseName,
    phone: basePhone,
    user,
  }
  return {
    verified,
    session,
    user,
    message: 'Akun berhasil dibuat. Selamat datang di Kloop!',
  }
}

export async function requestPasswordReset(
  _contact: string,
  delayMs = 900,
): Promise<{ sent: boolean; message: string }> {
  await wait(delayMs)
  return {
    sent: true,
    message: 'Kode verifikasi terkirim',
  }
}

export async function resetPassword(
  _newPassword: string,
  delayMs = 900,
): Promise<{ session: Session; message: string }> {
  await wait(delayMs)
  const session: Session = {
    name: MOCK_CURRENT_USER.fullName,
    phone: '',
    user: MOCK_CURRENT_USER,
  }
  return {
    session,
    message: 'Kata sandi berhasil diperbarui',
  }
}

