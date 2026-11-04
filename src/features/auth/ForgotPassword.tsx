import { useState, type FormEvent } from 'react'
import { Field, PrimaryButton } from '@/components/ui'
import { requestPasswordReset, resetPassword } from '@/services/auth.service'
import { AuthHeader, AuthShell, Heading, digitsOnly, type AuthNav } from './AuthShared'

export function ForgotScreen({ go, support, notify }: AuthNav) {
  const [contact, setContact] = useState('')
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const ok = contact.includes('@') ? /\S+@\S+\.\S+/.test(contact) : digitsOnly(contact).length >= 9
    setError(ok ? undefined : 'Masukkan nomor HP atau email yang valid')
    if (!ok) return
    setLoading(true)
    try {
      const res = await requestPasswordReset(contact)
      notify(res.message)
      go('otp-reset')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell header={<AuthHeader onBack={() => go('login')} onSupport={support} />}>
      <form noValidate onSubmit={submit} className="stagger flex flex-col gap-[32px]">
        <Heading
          title="Lupa Kata Sandi?"
          subtitle="Tenang, masukkan nomor HP atau email yang terdaftar untuk mengatur ulang kata sandi."
          narrow
        />
        <Field
          label="Nomor Telepon"
          placeholder="Masukkan kontak terdaftarmu"
          autoComplete="username"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          error={error}
        />
        <PrimaryButton loading={loading}>Kirim Tautan</PrimaryButton>
      </form>
    </AuthShell>
  )
}

export function ResetScreen({ go, support, onAuthed }: AuthNav) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({})
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next = {
      password: password.length < 6 ? 'Kata sandi minimal 6 karakter' : undefined,
      confirm: confirm !== password || !confirm ? 'Kata sandi belum sama' : undefined,
    }
    setErrors(next)
    if (next.password || next.confirm) return
    setLoading(true)
    try {
      const res = await resetPassword(password)
      onAuthed(res.session, res.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell header={<AuthHeader onBack={() => go('login')} onSupport={support} />}>
      <form noValidate onSubmit={submit} className="stagger flex flex-col gap-[32px]">
        <Heading title="Buat Kata Sandi Baru" subtitle="Gunakan kombinasi kata sandi yang aman dan mudah kamu ingat." narrow />
        <div className="flex flex-col gap-[16px]">
          <Field
            label="Kata Sandi Baru"
            placeholder="Kata sandi baru"
            autoComplete="new-password"
            password
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <Field
            label="Konfirmasi Kata Sandi Baru"
            placeholder="Ulangi kata sandi baru"
            autoComplete="new-password"
            password
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={errors.confirm}
          />
        </div>
        <PrimaryButton loading={loading}>{'Simpan & Masuk'}</PrimaryButton>
      </form>
    </AuthShell>
  )
}

